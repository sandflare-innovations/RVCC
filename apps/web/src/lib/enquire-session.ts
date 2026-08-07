import { cookies } from "next/headers";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import "server-only";

import { prisma } from "@/lib/db";
import { ENQUIRE_COOKIE } from "@/lib/enquire-constants";

export {
  ENQUIRE_COOKIE,
  ENQUIRE_STEPS,
  OTP_TTL_MS,
  makeReferenceNumber,
  nextStep,
  prevStep,
  stepIndex,
  type EnquireStep,
} from "@/lib/enquire-constants";

export function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function safeEqualHash(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function getRegistrationFromSession() {
  const jar = await cookies();
  const token = jar.get(ENQUIRE_COOKIE)?.value;
  if (!token) return null;

  return prisma.supplierRegistration.findFirst({
    where: { sessionToken: token, status: { in: ["DRAFT", "SUBMITTED"] } },
    include: {
      company: true,
      contacts: { orderBy: { sortOrder: "asc" } },
      addresses: { orderBy: { sortOrder: "asc" } },
      classifications: { orderBy: { sortOrder: "asc" } },
      bankAccounts: { orderBy: { sortOrder: "asc" } },
      questionnaire: true,
      attachments: true,
    },
  });
}
