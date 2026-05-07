import { MajorProjectItem } from "../../types";

export interface DetailedProject extends MajorProjectItem {
  slug: string;
  category: string;
  client: string;
  year: string;
  status: "Completed" | "In Progress" | "Upcoming";
  gallery: string[];
  scope: string[];
}

export const PROJECTS: DetailedProject[] = [
  {
    id: "01",
    slug: "kafd-iconic-tower",
    title: "KAFD Iconic Tower",
    location: "Riyadh, KSA",
    image: "/images/projects/13.png",
    category: "Commercial Architecture",
    client: "KAFD Development",
    year: "2023",
    status: "Completed",
    description:
      "A landmark skyscraper in the King Abdullah Financial District, featuring state-of-the-art sustainable engineering and premium commercial spaces.",
    gallery: [
      "/images/projects/13.png",
      "/images/projects/14.png",
      "/images/projects/12.png",
      "/images/projects/4.png",
    ],
    scope: [
      "Structural Engineering",
      "Interior Fit-out",
      "Sustainable Facade Design",
      "Project Management",
    ],
  },
  {
    id: "02",
    slug: "heritage-residences",
    title: "Heritage Residences",
    location: "Riyadh, KSA",
    image: "/images/projects/2.png",
    category: "Residential Architecture",
    client: "Al-Faisaliah Group",
    year: "2024",
    status: "Completed",
    description:
      "Luxury residential villas that blend traditional Najdi architectural motifs with contemporary minimalist interiors.",
    gallery: [
      "/images/projects/2.png",
      "/images/projects/5.png",
      "/images/projects/3.png",
      "/images/projects/15.png",
    ],
    scope: ["Architectural Design", "Civil Construction", "Landscape Architecture", "MEP Services"],
  },
  {
    id: "03",
    slug: "prism-commercial-hub",
    title: "Prism Commercial Hub",
    location: "Jeddah, KSA",
    image: "/images/projects/1.png",
    category: "Corporate Infrastructure",
    client: "Red Sea Development",
    year: "2023",
    status: "Completed",
    description:
      "A high-tech corporate hub featuring geometric glass facades and collaborative workspaces for modern enterprises.",
    gallery: [
      "/images/projects/1.png",
      "/images/projects/8.png",
      "/images/projects/7.png",
      "/images/projects/6.png",
    ],
    scope: ["Glass Curtain Wall", "Foundation Works", "Digital Integration", "HVAC Systems"],
  },
  {
    id: "04",
    slug: "urban-green-initiative",
    title: "Urban Green Initiative",
    location: "Dammam, KSA",
    image: "/images/projects/10.png",
    category: "Landscape & Urbanism",
    client: "Municipality of Dammam",
    year: "2024",
    status: "In Progress",
    description:
      "Transforming urban spaces with sustainable irrigation systems, native plantations, and recreational public parks.",
    gallery: [
      "/images/projects/10.png",
      "/images/projects/11.png",
      "/images/projects/9.png",
      "/images/projects/14.png",
    ],
    scope: ["Site Planning", "Irrigation Systems", "Soft & Hard Landscaping", "Outdoor Lighting"],
  },
  {
    id: "05",
    slug: "heavy-industrial-foundation",
    title: "Industrial Foundation",
    location: "Jubail, KSA",
    image: "/images/projects/15.png",
    category: "Industrial Engineering",
    client: "SABIC",
    year: "2023",
    status: "Completed",
    description:
      "Precision heavy-earth works and foundation engineering for large-scale industrial complexes in the Jubail industrial zone.",
    gallery: ["/images/projects/15.png", "/images/projects/3.png", "/images/projects/8.png"],
    scope: ["Excavation", "Concrete Foundation", "Site Preparation", "Utility Trenching"],
  },
  {
    id: "06",
    slug: "skyline-business-park",
    title: "Skyline Business Park",
    location: "Riyadh, KSA",
    image: "/images/projects/14.png",
    category: "Corporate Infrastructure",
    client: "Riyadh Development Authority",
    year: "2024",
    status: "In Progress",
    description:
      "A sprawling business park featuring modular office spaces, green roof gardens, and high-tech connectivity infrastructure.",
    gallery: [
      "/images/projects/14.png",
      "/images/projects/1.png",
      "/images/projects/2.png",
      "/images/projects/13.png",
    ],
    scope: [
      "Master Planning",
      "Modular Construction",
      "Smart Building Systems",
      "Urban Landscaping",
    ],
  },
];
