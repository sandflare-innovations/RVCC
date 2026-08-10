import Link from "next/link";
import { notFound } from "next/navigation";

import { DEPARTMENTS, EMPLOYMENT_TYPES } from "@/lib/content/careers";
import { prisma } from "@/lib/db";
import { CareerEditor } from "@/sections/admin/CareerEditor";

export const dynamic = "force-dynamic";

export default async function EditCareerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.jobPosting.findUnique({ where: { id } });
  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/content/careers" className="hover:text-brand-blue text-sm text-zinc-600">
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
          requirements: job.requirements.join("\n"),
          benefits: job.benefits.join("\n"),
          isRemote: job.isRemote,
          isPublished: job.isPublished,
        }}
      />
    </div>
  );
}
