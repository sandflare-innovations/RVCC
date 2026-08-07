import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { otpVerifySchema } from "@/lib/enquire-schemas";
import {
  ENQUIRE_COOKIE,
  generateSessionToken,
  hashValue,
  safeEqualHash,
} from "@/lib/enquire-session";
import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(ENQUIRE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

async function viaWorker(email: string, code: string) {
  const res = await enquireWorkerFetch("/otp/verify", {
    method: "POST",
    body: { email, code },
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const out = NextResponse.json({
    ok: true,
    registrationId: data.registrationId,
    currentStep: data.currentStep,
  });
  if (data.sessionToken) setSessionCookie(out, data.sessionToken);
  return out;
}

async function viaPrisma(email: string, code: string) {
  const codeHash = hashValue(code);
  const otp = await prisma.registrationOtp.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || !safeEqualHash(otp.codeHash, codeHash)) {
    return NextResponse.json({ error: "Invalid or expired access code" }, { status: 401 });
  }

  await prisma.registrationOtp.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  let registration = await prisma.supplierRegistration.findFirst({
    where: { email, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
  });

  if (!registration) {
    registration = await prisma.supplierRegistration.create({
      data: {
        email,
        currentStep: "company",
        company: { create: {} },
        contacts: { create: [{ email, isAdministrative: true, sortOrder: 0 }] },
      },
    });
  }

  const sessionToken = generateSessionToken();
  const nextStep = registration.currentStep === "verify" ? "company" : registration.currentStep;

  registration = await prisma.supplierRegistration.update({
    where: { id: registration.id },
    data: { sessionToken, currentStep: nextStep },
  });

  const out = NextResponse.json({
    ok: true,
    registrationId: registration.id,
    currentStep: registration.currentStep,
  });
  setSessionCookie(out, sessionToken);
  return out;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Email and 6-digit code are required" }, { status: 400 });
    }
    const { email, code } = parsed.data;
    if (workerConfigured()) return viaWorker(email, code);
    return viaPrisma(email, code);
  } catch (err) {
    console.error("[enquire/otp/verify]", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
