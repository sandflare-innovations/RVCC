import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { hashPassword, verifyPassword } from "../../../lib/password";
import { prisma } from "../../../lib/prisma";
import { hashSha256 } from "../../../lib/sql";
import {
  attemptVendorLogin,
  createVendorSession,
  getVendorFromSession,
  revokeVendorSession,
} from "../services/vendor-auth.service";

function vendorSessionFrom(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}

export class VendorAuthController {
  static async handleLogin(sql: unknown, env: Env, request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(env, request, { error: "Invalid request" }, 400);
    }

    const email =
      typeof body === "object" && body && "email" in body
        ? String((body as { email?: unknown }).email ?? "")
        : "";
    const password =
      typeof body === "object" && body && "password" in body
        ? String((body as { password?: unknown }).password ?? "")
        : "";

    if (!email.includes("@") || !password) {
      return json(env, request, { error: "Email and password are required" }, 400);
    }

    const result = await attemptVendorLogin(sql, email, password);

    if (!result.ok) {
      if (result.reason === "locked") {
        const mins = Math.ceil((result.retryAfterMs ?? 0) / 60000);
        return json(
          env,
          request,
          {
            error: `Too many failed attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
          },
          429
        );
      }
      if (result.reason === "disabled") {
        return json(env, request, { error: "This account has been disabled." }, 403);
      }
      if (result.reason === "held") {
        return json(
          env,
          request,
          {
            error:
              "Account registered successfully, but vendor portal access is on hold. Wait for RVCC to release access.",
            outcome: "held",
          },
          403
        );
      }
      return json(env, request, { error: "Incorrect email or password." }, 401);
    }

    const token = await createVendorSession(
      sql,
      result.vendorId,
      request.headers.get("user-agent") ?? ""
    );

    return json(env, request, {
      ok: true,
      token,
      mustChangePassword: result.mustChangePassword,
      vendor: result.vendor,
    });
  }

  static async handleLogout(sql: unknown, env: Env, request: Request): Promise<Response> {
    await revokeVendorSession(sql, vendorSessionFrom(request));
    return json(env, request, { ok: true });
  }

  static async handleMe(sql: unknown, env: Env, request: Request): Promise<Response> {
    const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);
    return json(env, request, {
      id: vendor.id,
      email: vendor.email,
      name: vendor.name,
      mustChangePassword: vendor.mustChangePassword,
      registrationId: vendor.registrationId,
      portalAccess: vendor.portalAccess,
      registrationComplete: vendor.registrationComplete,
    });
  }

  static async handlePassword(sql: unknown, env: Env, request: Request): Promise<Response> {
    const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(env, request, { error: "Invalid request" }, 400);
    }

    const currentPassword =
      typeof body === "object" && body && "currentPassword" in body
        ? String((body as { currentPassword?: unknown }).currentPassword ?? "")
        : "";
    const newPassword =
      typeof body === "object" && body && "newPassword" in body
        ? String((body as { newPassword?: unknown }).newPassword ?? "")
        : "";

    if (!currentPassword) {
      return json(env, request, { error: "Current password is required." }, 400);
    }
    if (newPassword.length < 12) {
      return json(env, request, { error: "New password must be at least 12 characters." }, 400);
    }

    const record = await prisma.vendorUser.findUnique({
      where: { id: vendor.id },
      select: { id: true, passwordHash: true },
    });
    if (!record) return json(env, request, { error: "Account not found." }, 404);

    if (!(await verifyPassword(currentPassword, record.passwordHash))) {
      return json(env, request, { error: "Current password is incorrect." }, 401);
    }

    if (await verifyPassword(newPassword, record.passwordHash)) {
      return json(env, request, { error: "New password must differ from the current one." }, 400);
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.vendorUser.update({
      where: { id: vendor.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    const currentToken = vendorSessionFrom(request);
    if (currentToken) {
      await prisma.vendorSession.updateMany({
        where: {
          vendorId: vendor.id,
          tokenHash: { not: await hashSha256(currentToken) },
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }

    return json(env, request, { ok: true });
  }
}

export const handleVendorLogin = VendorAuthController.handleLogin;
export const handleVendorLogout = VendorAuthController.handleLogout;
export const handleVendorMe = VendorAuthController.handleMe;
export const handleVendorPassword = VendorAuthController.handlePassword;
