import Link from "next/link";

import { DEPARTMENTS, EMPLOYMENT_TYPES } from "@/lib/content/careers";
import { CareerEditor } from "@/sections/admin/CareerEditor";

export default function NewCareerPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/content/careers" className="hover:text-brand-blue text-sm text-zinc-600">
          ← Careers
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">New posting</h1>
      </div>
      <CareerEditor
        departments={DEPARTMENTS}
        employmentTypes={EMPLOYMENT_TYPES}
        initial={{
          id: null,
          title: "",
          slug: "",
          department: "",
          location: "",
          employmentType: "Full-time",
          description: "",
          requirements: "",
          benefits: "",
          isRemote: false,
          isPublished: false,
        }}
      />
    </div>
  );
}
