import Link from "next/link";
import { notFound } from "next/navigation";

import { adminSessionJson } from "@/lib/admin-data";
import { DEPARTMENTS, EMPLOYMENT_TYPES } from "@/lib/careers";
import { CareerApplicationsPanel } from "@/sections/careers/CareerApplicationsPanel";
import { CareerEditor } from "@/sections/careers/CareerEditor";

export const dynamic = "force-dynamic";

type Job = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  requirements: string[];
  benefits: string[];
  isRemote: boolean;
  isPublished: boolean;
};

type Application = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  cvFileName: string;
  cvFileUrl: string;
  createdAt: string;
};

export default async function EditCareerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, appsResult] = await Promise.all([
    adminSessionJson<Job>(`/careers/${encodeURIComponent(id)}`),
    adminSessionJson<{ applications: Application[] }>(
      `/careers/${encodeURIComponent(id)}/applications`
    ),
  ]);

  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        Could not load posting ({result.status}).
      </div>
    );
  }

  const job = result.data;
  const applications = appsResult.ok && Array.isArray(appsResult.data?.applications) ? appsResult.data.applications : [];

  // Safely format requirements and benefits whether returned as array, string, or undefined
  const safeRequirements = Array.isArray(job.requirements)
    ? job.requirements.join("\n")
    : typeof job.requirements === "string"
    ? job.requirements
    : "";

  const safeBenefits = Array.isArray(job.benefits)
    ? job.benefits.join("\n")
    : typeof job.benefits === "string"
    ? job.benefits
    : "";

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col overflow-x-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 pb-12">
        <CareerEditor
          departments={DEPARTMENTS}
          employmentTypes={EMPLOYMENT_TYPES}
          initial={{
            id: job.id,
            title: job.title || "",
            slug: job.slug || "",
            department: job.department || "",
            location: job.location || "",
            employmentType: job.employmentType || "Full-time",
            description: job.description || "",
            requirements: safeRequirements,
            benefits: safeBenefits,
            isRemote: Boolean(job.isRemote),
            isPublished: Boolean(job.isPublished),
          }}
        />
        <CareerApplicationsPanel applications={applications} />
      </div>
    </div>
  );
}
