import Link from "next/link";

import { Briefcase, Image as ImageIcon, Wrench, Info, UserCheck, FolderOpen, FileArchive, ShieldCheck, ArrowRight, Globe } from "lucide-react";

import { adminSessionJson } from "@/lib/admin-data";

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

export default async function ContentDashboardPage() {
  const result = await adminSessionJson<DashboardJobs>("/dashboard");
  const published = result.ok ? (result.data.publishedJobs ?? 0) : 0;
  const total = result.ok ? (result.data.totalJobs ?? published) : 0;

  return (
    <div className="flex flex-col min-h-0 w-full h-full relative">
      {/* Header */}
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

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors shadow-sm">
              <div>
                <p className="text-sm font-medium text-zinc-500">Sections</p>
                <p className="text-2xl font-semibold text-zinc-950 mt-1">8</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-brand-blue transition-transform group-hover:scale-110">
                <Globe className="h-6 w-6" />
              </div>
            </div>
            <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors shadow-sm">
              <div>
                <p className="text-sm font-medium text-zinc-500">Published Jobs</p>
                <p className="text-2xl font-semibold text-zinc-950 mt-1">{published}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                <FolderOpen className="h-6 w-6" />
              </div>
            </div>
            <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors shadow-sm">
              <div>
                <p className="text-sm font-medium text-zinc-500">Total Jobs</p>
                <p className="text-2xl font-semibold text-zinc-950 mt-1">{total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 transition-transform group-hover:scale-110">
                <Briefcase className="h-6 w-6" />
              </div>
            </div>
            <div className="bg-white border border-zinc-200/50 hover:border-brand-blue rounded-2xl p-4 flex items-center justify-between group transition-colors shadow-sm">
              <div>
                <p className="text-sm font-medium text-zinc-500">Draft Jobs</p>
                <p className="text-2xl font-semibold text-zinc-950 mt-1">{total - published}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 transition-transform group-hover:scale-110">
                <FileArchive className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Content Sections Grid */}
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
