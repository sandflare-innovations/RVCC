export const ENQUIRE_ATTACHMENT_SECTIONS = [
  {
    id: "commercial_registration",
    label: "Commercial Registration (CR)",
    hint: "Company registration certificate",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    id: "vat_certificate",
    label: "VAT Certificate",
    hint: "Tax registration document",
    accept: ".pdf,.jpg,.jpeg,.png",
  },
  {
    id: "bank_confirmation",
    label: "Bank Confirmation Letter",
    hint: "Official letter confirming bank account details",
    accept: ".pdf",
  },
  {
    id: "iso_certificate",
    label: "Quality / ISO Certificate",
    hint: "Optional quality or HSE certification",
    accept: ".pdf,.jpg,.jpeg,.png",
    optional: true,
  },
  {
    id: "other",
    label: "Other Supporting Document",
    hint: "Any additional document for procurement review",
    accept: ".pdf,.jpg,.jpeg,.png",
    optional: true,
  },
] as const;

export function attachmentSectionLabel(sectionId: string): string {
  return ENQUIRE_ATTACHMENT_SECTIONS.find((s) => s.id === sectionId)?.label ?? sectionId;
}
