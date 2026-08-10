export const ENQUIRE_CATEGORIES = [
  { id: "civil-construction", label: "Civil Construction" },
  { id: "structural-steel", label: "Structural Steel & Metal Works" },
  { id: "mep", label: "MEP Services" },
  { id: "landscape", label: "Landscape & Softscape" },
  { id: "water-features", label: "Water Features" },
  { id: "finishing", label: "Interior Finishing" },
  { id: "materials-supply", label: "Building Materials Supply" },
  { id: "equipment-rental", label: "Equipment Rental" },
  { id: "consultancy", label: "Engineering Consultancy" },
  { id: "hse", label: "HSE / Safety Services" },
  { id: "logistics", label: "Logistics & Transport" },
  { id: "other", label: "Other Goods & Services" },
] as const;

export type EnquireCategoryId = (typeof ENQUIRE_CATEGORIES)[number]["id"];
