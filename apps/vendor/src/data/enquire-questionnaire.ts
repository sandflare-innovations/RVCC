export const ENQUIRE_QUESTIONNAIRE = [
  {
    key: "years_experience",
    label: "How many years has your company operated in this industry?",
    type: "text" as const,
    required: true,
  },
  {
    key: "saudi_presence",
    label: "Do you have an active commercial registration in Saudi Arabia?",
    type: "select" as const,
    options: ["Yes", "No", "In progress"],
    required: true,
  },
  {
    key: "project_types",
    label: "What types of projects have you completed in the last 3 years?",
    type: "textarea" as const,
    required: true,
  },
  {
    key: "quality_certifications",
    label: "List quality / HSE certifications (ISO 9001, ISO 14001, ISO 45001, etc.)",
    type: "textarea" as const,
    required: false,
  },
  {
    key: "capacity",
    label: "Approximate annual delivery capacity (SAR or project count)",
    type: "text" as const,
    required: false,
  },
  {
    key: "conflict_interest",
    label: "Are any of your owners/directors related to RVCC employees or board members?",
    type: "select" as const,
    options: ["No", "Yes — will disclose separately"],
    required: true,
  },
] as const;

export const CLASSIFICATION_OPTIONS = [
  "Small / Medium Enterprise (SME)",
  "Woman-owned business",
  "Local content / IKTVA participant",
  "Veteran / disability-owned",
  "Minority-owned",
  "ISO certified organization",
  "Other",
] as const;

export const ORG_TYPES = [
  "Corporation",
  "Limited Liability Company (LLC)",
  "Partnership",
  "Sole Proprietorship",
  "Government Entity",
  "Non-Profit",
  "Other",
] as const;

export const SUPPLIER_TYPES = [
  "Manufacturer",
  "Distributor / Wholesaler",
  "Contractor",
  "Service Provider",
  "Consultant",
  "Other",
] as const;

export const ADDRESS_PURPOSES = ["Ordering", "Remit To", "RFQ", "Returns"] as const;

export const COUNTRIES = [
  "Saudi Arabia",
  "United Arab Emirates",
  "Bahrain",
  "Kuwait",
  "Qatar",
  "Oman",
  "Egypt",
  "Jordan",
  "India",
  "China",
  "United States",
  "United Kingdom",
  "Other",
] as const;
