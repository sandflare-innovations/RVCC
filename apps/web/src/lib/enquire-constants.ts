export const ENQUIRE_COOKIE = "enquire_session";
export const OTP_TTL_MS = 15 * 60 * 1000;

export const ENQUIRE_STEPS = [
  "verify",
  "company",
  "contacts",
  "addresses",
  "classifications",
  "bank",
  "products",
  "questionnaire",
  "review",
  "done",
] as const;

export type EnquireStep = (typeof ENQUIRE_STEPS)[number];

export function stepIndex(step: string): number {
  return ENQUIRE_STEPS.indexOf(step as EnquireStep);
}

export function nextStep(step: string): EnquireStep {
  const i = stepIndex(step);
  if (i < 0 || i >= ENQUIRE_STEPS.length - 1) return "review";
  return ENQUIRE_STEPS[i + 1]!;
}

export function prevStep(step: string): EnquireStep {
  const i = stepIndex(step);
  if (i <= 1) return "verify";
  return ENQUIRE_STEPS[i - 1]!;
}

export function makeReferenceNumber(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `REG-${y}${m}${day}-${rand}`;
}
