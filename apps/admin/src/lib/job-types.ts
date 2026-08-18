export type JobPosition = {
  id: string;
  slug: string;
  title: string;
  department: "Architecture" | "Engineering" | "Management" | "Operations" | string;
  location: string;
  type: "Full-time" | "Contract" | "Internship" | string;
  postedAt: string;
  description: string;
  requirements: string[];
  benefits: string[];
  isRemote: boolean;
};
