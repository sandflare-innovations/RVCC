import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { otpRequestSchema } from "@/lib/enquire-schemas";
import { OTP_TTL_MS, generateOtpCode, hashValue } from "@/lib/enquire-session";
import { enquireWorkerFetch, workerConfigured } from "@/lib/enquire-worker";

async function viaWorker(email: string) {
  const res = await enquireWorkerFetch("/otp/request", {
    method: "POST",
    body: { email },
  });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  // Worker sends SMTP itself — OTP never reaches Next.js.
  return NextResponse.json({
    ok: true,
    registrationId: data.registrationId,
    message: "Access code sent. Check your email.",
  });
}

async function viaPrisma(email: string) {
  // Local-only fallback: Worker is required for mail in production.
  const code = generateOtpCode();
  const codeHash = hashValue(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.registrationOtp.create({
    data: { email, codeHash, expiresAt },
  });

  let registration = await prisma.supplierRegistration.findFirst({
    where: { email, status: "DRAFT" },
    orderBy: { updatedAt: "desc" },
  });

  if (!registration) {
    registration = await prisma.supplierRegistration.create({
      data: {
        email,
        currentStep: "verify",
        company: { create: {} },
        contacts: {
          create: [{ email, isAdministrative: true, sortOrder: 0 }],
        },
      },
    });
  }

  console.warn(`[enquire:mail] Local fallback — configure Worker SMTP. OTP for ${email}: ${code}`);

  return NextResponse.json({
    ok: true,
    registrationId: registration.id,
    message: "Access code sent. Check your email.",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = otpRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const { email } = parsed.data;
    if (workerConfigured()) return viaWorker(email);
    return viaPrisma(email);
  } catch (err) {
    console.error("[enquire/otp/request]", err);
    return NextResponse.json(
      {
        error: "Unable to send access code. Configure ENQUIRE_WORKER_URL + ENQUIRE_API_SECRET.",
      },
      { status: 500 }
    );
  }
}
