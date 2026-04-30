export interface MajorProjectItem {
  id: string;
  title: string;
  location: string;
  image: string;
  description: string;
}

export const MAJOR_PROJECTS: MajorProjectItem[] = [
  {
    id: "01",
    title: "KAFD Iconic Tower",
    location: "RIYADH, KSA",
    image: "/images/projects/major-center.png",
    description:
      "Setting new benchmarks for luxury and sustainability in commercial architecture within the financial district.",
  },
  {
    id: "02",
    title: "The Heritage Residences",
    location: "RIYADH, KSA",
    image: "/images/projects/major-left.png",
    description:
      "Ultra-luxury residential complex featuring traditional Najdi architectural elements with modern engineering.",
  },
  {
    id: "03",
    title: "The Prism Commercial Hub",
    location: "JEDDAH, KSA",
    image: "/images/projects/major-right.png",
    description:
      "A pinnacle of modern geometric design, redefining corporate environments in the Red Sea region.",
  },
];
