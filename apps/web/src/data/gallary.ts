export interface GallaryProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnail: string;
  images: string[];
  serviceSlugs: string[];
}

export const GALLARY_PROJECTS: GallaryProject[] = [
  {
    id: "p1",
    slug: "kafd-iconic-tower",
    title: "KAFD Iconic Tower",
    description:
      "Setting new benchmarks for luxury and sustainability in commercial architecture within the financial district.",
    thumbnail: "/images/projects/13.webp",
    images: [
      "/images/projects/13.webp",
      "/images/projects/1.webp",
      "/images/projects/2.webp",
      "/images/projects/3.webp",
      "/images/projects/4.webp",
    ],
    serviceSlugs: [
      "architectural-service",
      "cladding-works",
      "steel-metal-works",
      "building-projects",
    ],
  },
  {
    id: "p2",
    slug: "heritage-residences",
    title: "Heritage Residences",
    description:
      "Ultra-luxury residential complex featuring traditional Najdi architectural elements with modern engineering.",
    thumbnail: "/images/projects/2.webp",
    images: [
      "/images/projects/2.webp",
      "/images/projects/5.webp",
      "/images/projects/6.webp",
      "/images/projects/7.webp",
    ],
    serviceSlugs: ["cladding-works", "hardscaping-works", "building-projects"],
  },
  {
    id: "p3",
    slug: "prism-commercial-hub",
    title: "Prism Commercial Hub",
    description:
      "A pinnacle of modern geometric design, redefining corporate environments in the Red Sea region.",
    thumbnail: "/images/projects/1.webp",
    images: [
      "/images/projects/1.webp",
      "/images/projects/8.webp",
      "/images/projects/9.webp",
      "/images/projects/10.webp",
    ],
    serviceSlugs: ["steel-metal-works", "building-projects"],
  },
  {
    id: "p4",
    slug: "urban-landscape-initiative",
    title: "Urban Landscape Initiative",
    description:
      "Revitalizing city spaces with sustainable greenery and modern recreational facilities.",
    thumbnail: "/images/projects/10.webp",
    images: [
      "/images/projects/10.webp",
      "/images/projects/11.webp",
      "/images/projects/12.webp",
      "/images/projects/14.webp",
    ],
    serviceSlugs: [
      "artificial-grass",
      "artificial-lakes",
      "fountain-services",
      "irrigation-plantation",
      "landscape-works",
    ],
  },
  {
    id: "p5",
    slug: "heavy-earth-works",
    title: "Heavy Earth Works",
    description: "Specialized excavation and site preparation for large-scale industrial projects.",
    thumbnail: "/images/projects/15.webp",
    images: ["/images/projects/15.webp", "/images/projects/6.webp", "/images/projects/7.webp"],
    serviceSlugs: ["hardscaping-works", "land-development", "sand-removal-earthwork"],
  },
  {
    id: "p6",
    slug: "sky-villa-collection",
    title: "Sky Villa Collection",
    description:
      "Exclusive residential villas designed with panoramic vistas and vertical gardens.",
    thumbnail: "/images/projects/12.webp",
    images: [
      "/images/projects/12.webp",
      "/images/projects/3.webp",
      "/images/projects/4.webp",
      "/images/projects/5.webp",
      "/images/projects/14.webp",
    ],
    serviceSlugs: ["architectural-service", "landscape-works", "building-projects"],
  },
];
