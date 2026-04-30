export interface RecentProjectItem {
  title: string;
  location: string;
  year: string;
  category: string;
  type: string;
  description: string;
  image: string;
}

export const RECENT_PROJECTS: RecentProjectItem[] = [
  {
    title: "Luxury Skyline",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    description:
      "A breathtaking architectural masterpiece redefining the city's horizon with unparalleled elegance and sustainable design.",
    image: "/images/home-hero.png",
  },
  {
    title: "Bohemian Rhapsody",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    description:
      "Artistic living spaces that blend avant-garde aesthetics with functional modernity for a unique urban experience.",
    image: "/images/hero-bg.png",
  },
  {
    title: "Vintage Glamour",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    description:
      "Timeless luxury meets contemporary comfort in this meticulously restored heritage estate.",
    image: "/images/home-hero.png",
  },
  {
    title: "Modern Sanctuary",
    location: "Berlin, Germany",
    year: "2025",
    category: "RESIDENTIAL",
    type: "SINGLE HOME",
    description:
      "An oasis of calm featuring minimalist lines, natural light, and state-of-the-art smart home integration.",
    image: "/images/hero-bg.png",
  },
  {
    title: "Urban Oasis",
    location: "London, UK",
    year: "2024",
    category: "COMMERCIAL",
    type: "OFFICE",
    description:
      "Dynamic workspace designed to foster creativity and collaboration in the heart of the business district.",
    image: "/images/home-hero.png",
  },
  {
    title: "Nordic Minimal",
    location: "Oslo, Norway",
    year: "2024",
    category: "RESIDENTIAL",
    type: "APARTMENT",
    description:
      "Sleek Scandinavian design focused on simplicity, functionality, and connection with nature.",
    image: "/images/hero-bg.png",
  },
];
