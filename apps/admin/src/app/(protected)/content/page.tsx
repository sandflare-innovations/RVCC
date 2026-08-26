import { Suspense } from "react";
import Link from "next/link";

import { Briefcase, Image as ImageIcon, Wrench, Info, UserCheck, FolderOpen, FileArchive, ShieldCheck, ArrowRight, Globe } from "lucide-react";

import { adminSessionJson } from "@/lib/admin-data";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

type DashboardJobs = { publishedJobs: number; totalJobs: number };

const SECTIONS = [
  {
    href: "/content/projects",
    label: "Projects",
    description: "Manage company project portfolio, details, images, and metrics.",
    icon: Briefcase,
    color: "bg-blue-50 text-blue-600",
    borderColor: "hover:border-blue-400",
  },
  {
    href: "/content/gallery",
    label: "Gallery",
    description: "Upload and organize project gallery images and collections.",
    icon: ImageIcon,
    color: "bg-purple-50 text-purple-600",
    borderColor: "hover:border-purple-400",
  },
  {
    href: "/content/services",
    label: "Services",
    description: "Edit service categories, descriptions, and detail pages.",
    icon: Wrench,
    color: "bg-emerald-50 text-emerald-600",
    borderColor: "hover:border-emerald-400",
  },
  {
    href: "/content/about",
    label: "About Page",
    description: "Update company overview, mission, journey, stats, and divisions.",
    icon: Info,
    color: "bg-amber-50 text-amber-600",
    borderColor: "hover:border-amber-400",
  },
  {
    href: "/content/clients",
    label: "Clients",
    description: "Manage client logos, names, and partner information.",
    icon: UserCheck,
    color: "bg-cyan-50 text-cyan-600",
    borderColor: "hover:border-cyan-400",
  },
  {
    href: "/content/careers",
    label: "Careers",
    description: "Post, edit, and manage job listings shown on the careers page.",
    icon: FolderOpen,
    color: "bg-rose-50 text-rose-600",
    borderColor: "hover:border-rose-400",
  },
  {
    href: "/content/documents",
    label: "Documents",
    description: "Upload and manage company PDFs, brochures, and certificates.",
    icon: FileArchive,
    color: "bg-indigo-50 text-indigo-600",
    borderColor: "hover:border-indigo-400",
  },
  {
    href: "/content/quality-policy",
    label: "Quality Policy",
    description: "Edit the company quality policy and compliance information.",
    icon: ShieldCheck,
    color: "bg-teal-50 text-teal-600",
    borderColor: "hover:border-teal-400",
  },
];

/* ------------------------------------------------------------------ */
/*  Skeleton fallbacks                                                  */
/* ------------------------------------------------------------------ */

function ContentStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-2xl" />
          </div>
          <Skeleton className="h-8 w-16 mt-3" />
        </div>
      ))}
    </div>
  );
}

function ContentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex items-start justify-between mb-4">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function ContentPageSkeleton() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative">
      {/* Static header */}
      <div className="flex-none flex items-center justify-between bg-white pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="space-y-8 pb-12">
          <ContentStatsSkeleton />
          <div>
            <Skeleton className="h-5 w-36 mb-4" />
            <ContentGridSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Async data components (streamed via Suspense)                      */
/* ------------------------------------------------------------------ */

async function ContentStatsData() {
  const result = await adminSessionJson<DashboardJobs>("/dashboard");
  const published = result.ok ? (result.data.publishedJobs ?? 0) : 0;
  const total = result.ok ? (result.data.totalJobs ?? published) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[
        { label: "Sections", value: "8", icon: Globe },
        { label: "Published Jobs", value: published, icon: FolderOpen },
        { label: "Total Jobs", value: total, icon: Briefcase },
        { label: "Draft Jobs", value: total - published, icon: FileArchive },
      ].map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-blue/25 to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">{stat.label}</p>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-colors duration-300 group-hover:bg-brand-blue group-hover:text-white">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page (static shell + streamed data)                                */
/* ------------------------------------------------------------------ */

export default async function ContentDashboardPage() {
  return (
    <div className="flex flex-col min-h-0 w-full h-full relative">
      {/* Static Header */}
      <div className="flex-none flex items-center justify-between bg-white pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-blue flex items-center justify-center">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">Website Content</h1>
            <p className="text-sm text-zinc-500">Manage your company website content</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="space-y-8 pb-12">
          {/* ---- Streamed Stats ---- */}
          <Suspense fallback={<ContentStatsSkeleton />}>
            <ContentStatsData />
          </Suspense>

          {/* Static Content Sections Grid */}
          <div>
            <h2 className="text-lg font-bold tracking-tight text-zinc-900 mb-4">Content Sections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className={`group flex flex-col p-5 rounded-2xl border border-zinc-200 bg-white transition-all hover:shadow-md ${section.borderColor}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-11 w-11 rounded-xl ${section.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-300 transition-all group-hover:text-zinc-600 group-hover:translate-x-1" />
                    </div>
                    <h3 className="font-bold text-zinc-900 text-base mb-1">{section.label}</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">{section.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
