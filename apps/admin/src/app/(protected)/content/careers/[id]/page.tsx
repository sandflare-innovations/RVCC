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
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        Could not load posting ({result.status}).
      </p>
    );
  }

  const job = result.data;
  const applications = appsResult.ok ? appsResult.data.applications : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/content/careers" className="hover:text-brand-blue text-sm text-zinc-600">
          ← Careers
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{job.title}</h1>
      </div>
      <CareerEditor
        departments={DEPARTMENTS}
        employmentTypes={EMPLOYMENT_TYPES}
        initial={{
          id: job.id,
          title: job.title,
          slug: job.slug,
          department: job.department,
          location: job.location,
          employmentType: job.employmentType,
          description: job.description,
          requirements: (job.requirements ?? []).join("\n"),
          benefits: (job.benefits ?? []).join("\n"),
          isRemote: job.isRemote,
          isPublished: job.isPublished,
        }}
      />
      <CareerApplicationsPanel applications={applications} />
    </div>
  );
}
