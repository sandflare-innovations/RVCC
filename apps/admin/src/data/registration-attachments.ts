export const REGISTRATION_ATTACHMENT_LABELS: Record<string, string> = {
  commercial_registration: "Commercial Registration (CR)",
  vat_certificate: "VAT Certificate",
  bank_confirmation: "Bank Confirmation Letter",
  iso_certificate: "Quality / ISO Certificate",
  other: "Other Supporting Document",
};

export function registrationAttachmentLabel(sectionId: string): string {
  return REGISTRATION_ATTACHMENT_LABELS[sectionId] ?? sectionId;
}
