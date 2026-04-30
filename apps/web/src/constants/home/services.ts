export interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: "civil",
    title: "Civil Construction",
    subtitle: "High-end villa construction and commercial developments.",
    image: "/images/services/civil.png",
  },
  {
    id: "landscaping",
    title: "Landscaping",
    subtitle: "Sustainable outdoor environments that harmonize with architecture.",
    image: "/images/services/landscaping.png",
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    subtitle: "Foundational systems and complex utility networks.",
    image: "/images/services/infrastructure.png",
  },
  {
    id: "surveying",
    title: "Surveying",
    subtitle: "State-of-the-art instruments for absolute measurement accuracy.",
    image: "/images/services/surveying.png",
  },
];
