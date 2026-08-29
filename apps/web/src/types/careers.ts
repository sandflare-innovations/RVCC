export interface JobPosition {
  id: string;
  slug: string;
  title: string;
  department: "Architecture" | "Engineering" | "Management" | "Operations";
  location: string;
  type: "Full-time" | "Contract" | "Internship";
  postedAt: string;
  description: string;
  requirements: string[];
  benefits: string[];
  isRemote?: boolean;
}
