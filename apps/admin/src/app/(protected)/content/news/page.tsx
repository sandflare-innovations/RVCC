import type { NewsEventDTO } from "@rvcc/schemas";
import { Suspense } from "react";

import { adminSessionJson } from "@/lib/admin-data";
import { hasRole } from "@/lib/constants";
import { getAdminFromSession } from "@/lib/session";
import { NewsGrid } from "@/sections/news/NewsGrid";

export const dynamic = "force-dynamic";

async function NewsContent({ canDelete }: { canDelete: boolean }) {
  const res = await adminSessionJson<{ news: NewsEventDTO[] }>("/news");
  const items = res.ok && Array.isArray(res.data.news) ? res.data.news : [];

  return <NewsGrid initialNews={items} canDelete={canDelete} />;
}

export default async function ContentNewsPage() {
  const admin = await getAdminFromSession();
  const canDelete = Boolean(admin && hasRole(admin.role, "SUPER_ADMIN"));

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      <div className="flex-1 overflow-y-auto pb-12">
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-zinc-100 animate-pulse" />
              ))}
            </div>
          }
        >
          <NewsContent canDelete={canDelete} />
        </Suspense>
      </div>
    </div>
  );
}
