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
    thumbnail: "/images/projects/13.png",
    images: [
      "/images/projects/13.png",
      "/images/projects/1.png",
      "/images/projects/2.png",
      "/images/projects/3.png",
      "/images/projects/4.png",
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
    thumbnail: "/images/projects/2.png",
    images: [
      "/images/projects/2.png",
      "/images/projects/5.png",
      "/images/projects/6.png",
      "/images/projects/7.png",
    ],
    serviceSlugs: ["cladding-works", "hardscaping-works", "building-projects"],
  },
  {
    id: "p3",
    slug: "prism-commercial-hub",
    title: "Prism Commercial Hub",
    description:
      "A pinnacle of modern geometric design, redefining corporate environments in the Red Sea region.",
    thumbnail: "/images/projects/1.png",
    images: [
      "/images/projects/1.png",
      "/images/projects/8.png",
      "/images/projects/9.png",
      "/images/projects/10.png",
    ],
    serviceSlugs: ["steel-metal-works", "building-projects"],
  },
  {
    id: "p4",
    slug: "urban-landscape-initiative",
    title: "Urban Landscape Initiative",
    description:
      "Revitalizing city spaces with sustainable greenery and modern recreational facilities.",
    thumbnail: "/images/projects/10.png",
    images: [
      "/images/projects/10.png",
      "/images/projects/11.png",
      "/images/projects/12.png",
      "/images/projects/14.png",
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
    thumbnail: "/images/projects/15.png",
    images: ["/images/projects/15.png", "/images/projects/6.png", "/images/projects/7.png"],
    serviceSlugs: ["hardscaping-works", "land-development", "sand-removal-earthwork"],
  },
  {
    id: "p6",
    slug: "sky-villa-collection",
    title: "Sky Villa Collection",
    description:
      "Exclusive residential villas designed with panoramic vistas and vertical gardens.",
    thumbnail: "/images/projects/12.png",
    images: [
      "/images/projects/12.png",
      "/images/projects/3.png",
      "/images/projects/4.png",
      "/images/projects/5.png",
      "/images/projects/14.png",
    ],
    serviceSlugs: ["architectural-service", "landscape-works", "building-projects"],
  },
];
