import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { ProjectsGrid } from "@/sections/projects/ProjectsGrid";
import type { ProjectDTO } from "@rvcc/types";

export const dynamic = "force-dynamic";

async function ProjectsContent({ canDelete }: { canDelete: boolean }) {
  const res = await adminSessionJson<{ projects: ProjectDTO[] }>("/projects");
  const projects = res.ok && Array.isArray(res.data.projects) ? res.data.projects : [];

  return <ProjectsGrid initialProjects={projects} canDelete={canDelete} />;
}

export default async function ContentProjectsPage() {
  const admin = await getAdminFromSession();
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto pb-12">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-80 w-full rounded-3xl" />
              ))}
            </div>
          }
        >
          <ProjectsContent canDelete={canDelete} />
        </Suspense>
      </div>
    </div>
  );
}
