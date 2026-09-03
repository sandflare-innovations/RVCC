import { notFound } from "next/navigation";

import { adminSessionJson } from "@/lib/admin-data";
import { ProjectEditor } from "@/sections/projects/ProjectEditor";
import type { ProjectDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

export default async function EditProjectPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const res = await adminSessionJson<{ project?: ProjectDTO } & Partial<ProjectDTO>>(
    `/projects/${encodeURIComponent(id)}`
  );

  const project =
    res.ok && (res.data.project || (res.data.id && res.data))
      ? ((res.data.project || res.data) as ProjectDTO)
      : null;

  if (!project) {
    notFound();
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto pb-12">
        <ProjectEditor initial={project} />
      </div>
    </div>
  );
}
