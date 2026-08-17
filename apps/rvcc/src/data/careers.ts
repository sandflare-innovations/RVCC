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

export const OPEN_POSITIONS: JobPosition[] = [
  {
    id: "j1",
    slug: "senior-architect",
    title: "Senior Architect",
    department: "Architecture",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    postedAt: "2024-05-01",
    description:
      "We are looking for a Senior Architect to lead iconic high-rise projects and mentor our design team.",
    requirements: [
      "Master's Degree in Architecture",
      "10+ years of experience in large-scale projects",
      "Proficiency in Revit and Rhino",
      "Knowledge of Saudi building codes",
    ],
    benefits: [
      "Competitive salary and performance bonuses",
      "Comprehensive medical insurance",
      "Professional development support",
      "Relocation assistance",
    ],
  },
  {
    id: "j2",
    slug: "structural-engineer",
    title: "Lead Structural Engineer",
    department: "Engineering",
    location: "Jeddah, Saudi Arabia",
    type: "Full-time",
    postedAt: "2024-05-05",
    description:
      "Join our engineering team to solve complex structural challenges in urban development.",
    requirements: [
      "Bachelor's Degree in Civil/Structural Engineering",
      "8+ years of experience in structural design",
      "Strong analytical skills",
      "Experience with Etabs and SAP2000",
    ],
    benefits: [
      "Premium workspace in our Jeddah office",
      "Flexible working hours",
      "Annual flight allowance",
      "Project completion incentives",
    ],
  },
  {
    id: "j3",
    slug: "project-manager",
    title: "Project Manager",
    department: "Management",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    postedAt: "2024-05-10",
    description:
      "Manage end-to-end project lifecycles for our commercial and residential portfolios.",
    requirements: [
      "PMP Certification",
      "Proven track record in construction management",
      "Excellent communication and leadership skills",
      "Fluent in Arabic and English",
    ],
    benefits: [
      "Standard-setting compensation package",
      "Company vehicle",
      "Generous vacation policy",
      "Leadership training programs",
    ],
  },
  {
    id: "j4",
    slug: "bim-coordinator",
    title: "BIM Coordinator",
    department: "Engineering",
    location: "Riyadh, Saudi Arabia",
    type: "Full-time",
    postedAt: "2024-05-12",
    description: "Coordinate BIM workflows and ensure data integrity across all project stages.",
    requirements: [
      "Degree in Architecture or Engineering",
      "5+ years of BIM-specific experience",
      "Expert level in Autodesk Revit and Navisworks",
      "Experience in VDC processes",
    ],
    benefits: [
      "Cutting-edge technology stack",
      "Flexible work arrangements",
      "Team-building retreats",
      "Health and wellness programs",
    ],
    isRemote: true,
  },
];
