import {
  ArrowRight,
  Briefcase,
  Building2,
  FileArchive,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Info,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { adminSessionJson } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

type DashboardJobs = { publishedJobs: number; totalJobs: number };

const SECTIONS = [
  {
    href: "/content/hero",
    label: "Hero Slides",
    description: "Manage homepage interactive hero slides, titles, badges, and background media.",
    icon: SlidersHorizontal,
    color: "bg-amber-50 text-amber-600",
    borderColor: "hover:border-amber-400",
  },
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
    href: "/content/companies",
    label: "Our Companies",
    description: "Manage sister concern companies, subsidiaries, and logos.",
    icon: Building2,
    color: "bg-blue-50 text-blue-600",
    borderColor: "hover:border-blue-400",
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-8 rounded-2xl" />
          </div>
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

function ContentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="mb-1 h-5 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function ContentPageSkeleton() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {/* Static header */}
      <div className="flex flex-none items-center justify-between bg-white pb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-8 pb-12">
          <ContentStatsSkeleton />
          <div>
            <Skeleton className="mb-4 h-5 w-36" />
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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[
        { label: "Sections", value: "8", icon: Globe },
        { label: "Published Jobs", value: published, icon: FolderOpen },
        { label: "Total Jobs", value: total, icon: Briefcase },
        { label: "Draft Jobs", value: total - published, icon: FileArchive },
      ].map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)]"
          >
            <div className="via-brand-blue/25 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                {stat.label}
              </p>
              <div className="bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:text-white">
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
                {stat.value}
              </p>
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
    <div className="relative flex h-full min-h-0 w-full flex-col">
      {/* Static Header */}
      <div className="flex flex-none items-center justify-between bg-white pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-brand-blue flex h-10 w-10 items-center justify-center rounded-xl">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-950">Website Content</h1>
            <p className="text-sm text-zinc-500">Manage your company website content</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 [scrollbar-width:none] overflow-y-auto [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="space-y-8 pb-12">
          {/* ---- Streamed Stats ---- */}
          <Suspense fallback={<ContentStatsSkeleton />}>
            <ContentStatsData />
          </Suspense>

          {/* Static Content Sections Grid */}
          <div>
            <h2 className="mb-4 text-lg font-bold tracking-tight text-zinc-900">
              Content Sections
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className={`group flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-md ${section.borderColor}`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div
                        className={`h-11 w-11 rounded-xl ${section.color} flex items-center justify-center transition-transform group-hover:scale-110`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-300 transition-all group-hover:translate-x-1 group-hover:text-zinc-600" />
                    </div>
                    <h3 className="mb-1 text-base font-bold text-zinc-900">{section.label}</h3>
                    <p className="text-sm leading-relaxed text-zinc-500">{section.description}</p>
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
