"use client";

import {
  AlertCircle,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Globe,
  LayoutGrid,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Table as TableIcon,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";
import { AnimatedSearchInput } from "@/lib/ui";

export type CareerJobItem = {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType?: string;
  isRemote: boolean;
  isPublished: boolean;
  postedAt?: string;
  createdAt?: string;
  applicationCount?: number;
};

export function CareersPanel({
  initialJobs,
  canDelete = true,
}: {
  initialJobs: CareerJobItem[];
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState<CareerJobItem[]>(initialJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Quick toggle busy state
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  // Delete modal state
  const [jobToDelete, setJobToDelete] = useState<CareerJobItem | null>(null);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [deptOpen, setDeptOpen] = useState(false);

  // Extract unique departments
  const departments = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.department) set.add(j.department);
    });
    return ["ALL", ...Array.from(set)];
  }, [jobs]);

  const SEARCH_PLACEHOLDERS = [
    "Search by job title...",
    "Search by department...",
    "Search by location...",
    "Search by slug...",
  ];

  // Key metrics calculation
  const metrics = useMemo(() => {
    const total = jobs.length;
    const published = jobs.filter((j) => j.isPublished).length;
    const drafts = total - published;
    const remote = jobs.filter((j) => j.isRemote).length;
    const totalApps = jobs.reduce((acc, j) => acc + (j.applicationCount || 0), 0);
    return { total, published, drafts, remote, totalApps };
  }, [jobs]);

  // Filtering
  const filteredJobs = useMemo(() => {
    let list = [...jobs];

    if (selectedDepartment !== "ALL") {
      list = list.filter((j) => j.department === selectedDepartment);
    }

    if (selectedStatus === "PUBLISHED") {
      list = list.filter((j) => j.isPublished);
    } else if (selectedStatus === "DRAFT") {
      list = list.filter((j) => !j.isPublished);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.department.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.slug.toLowerCase().includes(q)
      );
    }

    return list;
  }, [jobs, selectedDepartment, selectedStatus, searchQuery]);

  // Quick toggle published status
  const togglePublish = async (job: CareerJobItem) => {
    setBusyJobId(job.id);
    const newStatus = !job.isPublished;

    // Optimistic update
    setJobs((prev) =>
      prev.map((item) => (item.id === job.id ? { ...item, isPublished: newStatus } : item))
    );

    try {
      const res = await fetch(`/api/careers/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublished: newStatus }),
      });

      if (!res.ok) {
        // Revert
        setJobs((prev) =>
          prev.map((item) => (item.id === job.id ? { ...item, isPublished: job.isPublished } : item))
        );
      } else {
        router.refresh();
      }
    } catch {
      // Revert
      setJobs((prev) =>
        prev.map((item) => (item.id === job.id ? { ...item, isPublished: job.isPublished } : item))
      );
    } finally {
      setBusyJobId(null);
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/careers/${jobToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        setDeleteError(await readApiError(res, "Could not delete this posting."));
        return;
      }

      setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
      setJobToDelete(null);
      setConfirmSlug("");
      router.refresh();
    } catch {
      setDeleteError("Network error — please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/content"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-2xs transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
            aria-label="Go back to Site Content"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0073bc]">
                <Briefcase className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                Careers & Openings
              </h1>

            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-3">
          <Link
            href="/content/careers/new"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0073bc] px-4 text-xs font-bold tracking-wide text-white shadow-xs transition-all hover:bg-[#005fa0] hover:shadow-md active:scale-98 sm:text-sm"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            New Posting
          </Link>
        </div>
      </div>

      {/* KPI Stats Overview Cards Matching Admin Standard Style */}
      <div className="mb-6 grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total Positions",
            value: metrics.total,
            statusVal: "ALL" as const,
            icon: <Briefcase className="h-4 w-4" />,
          },
          {
            label: "Live Published",
            value: metrics.published,
            statusVal: "PUBLISHED" as const,
            icon: <Check className="h-4 w-4" />,
          },
          {
            label: "Unpublished Drafts",
            value: metrics.drafts,
            statusVal: "DRAFT" as const,
            icon: <Clock className="h-4 w-4" />,
          },
          {
            label: "Remote Friendly",
            value: metrics.remote,
            statusVal: "ALL" as const,
            icon: <Globe className="h-4 w-4" />,
          },
        ].map((card, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setSelectedStatus(card.statusVal)}
            className="group focus-visible:ring-brand-blue/40 relative flex h-full min-h-0 cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-zinc-200 bg-white p-4 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.08)] focus-visible:ring-2 focus-visible:outline-none text-left"
          >
            <div className="via-brand-blue/25 pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-zinc-400 uppercase">
                {card.label}
              </p>
              <div className="bg-brand-blue/10 text-brand-blue group-hover:bg-brand-blue flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 group-hover:text-white">
                {card.icon}
              </div>
            </div>
            <div className="relative z-10 mt-3 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
                {card.value}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter Toolbar: Compact Search & Dropdowns in the SAME ROW */}
      <div className="mb-6 flex shrink-0 flex-wrap items-center justify-between gap-4">
        {/* Left: Small Search Bar matching Staff & Vendor pages */}
        <div className="flex w-full max-w-sm items-center gap-3">
          <AnimatedSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholders={SEARCH_PLACEHOLDERS}
            ariaLabel="Search careers"
          />
        </div>

        {/* Right: Department Dropdown, Status Switcher, View Toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department Dropdown in the Same Row */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setDeptOpen((prev) => !prev)}
              onBlur={() => setTimeout(() => setDeptOpen(false), 200)}
              className="focus-visible:ring-brand-blue/25 border-brand-blue text-brand-blue flex min-w-[165px] items-center justify-between gap-3 rounded-full border bg-white py-2.5 pr-4 pl-5 text-xs font-semibold shadow-2xs transition-shadow outline-none focus-visible:ring-[3px] cursor-pointer"
            >
              <span className="truncate max-w-[130px]">
                {selectedDepartment === "ALL" ? "All Departments" : selectedDepartment}
              </span>
              <ChevronDown className={`text-brand-blue h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${deptOpen ? "rotate-180" : ""}`} />
            </button>

            {deptOpen && (
              <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-xl max-h-60 overflow-y-auto">
                {departments.map((dept) => {
                  const count = dept === "ALL" ? jobs.length : jobs.filter((j) => j.department === dept).length;
                  const isSelected = selectedDepartment === dept;
                  return (
                    <button
                      key={dept}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setSelectedDepartment(dept);
                        setDeptOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-4 py-2 text-left text-xs transition-colors cursor-pointer ${isSelected
                          ? "text-brand-blue bg-blue-50/70 font-bold"
                          : "text-zinc-700 hover:bg-zinc-50 font-medium"
                        }`}
                    >
                      <span className="truncate">{dept === "ALL" ? "All Departments" : dept}</span>
                      <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status Toggle Switcher */}
          <div className="border-brand-blue flex items-center rounded-full border bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className={`flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${selectedStatus === "ALL"
                  ? "bg-brand-blue font-bold text-white shadow-2xs"
                  : "text-brand-blue hover:bg-brand-blue/5"
                }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("PUBLISHED")}
              className={`flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${selectedStatus === "PUBLISHED"
                  ? "bg-brand-blue font-bold text-white shadow-2xs"
                  : "text-brand-blue hover:bg-brand-blue/5"
                }`}
            >
              Published
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus("DRAFT")}
              className={`flex cursor-pointer items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${selectedStatus === "DRAFT"
                  ? "bg-brand-blue font-bold text-white shadow-2xs"
                  : "text-brand-blue hover:bg-brand-blue/5"
                }`}
            >
              Drafts
            </button>
          </div>

          {/* View Toggle */}
          <div className="border-brand-blue flex items-center rounded-full border bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${viewMode === "table"
                  ? "bg-brand-blue font-bold text-white shadow-2xs"
                  : "text-brand-blue hover:bg-brand-blue/5"
                }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Cards View"
              className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${viewMode === "grid"
                  ? "bg-brand-blue font-bold text-white shadow-2xs"
                  : "text-brand-blue hover:bg-brand-blue/5"
                }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Count & Current Filter Indicator */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        {(searchQuery || selectedDepartment !== "ALL" || selectedStatus !== "ALL") && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedDepartment("ALL");
              setSelectedStatus("ALL");
            }}
            className="font-semibold text-[#0073bc] hover:underline"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Content Area: Grid vs Table */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {/* Create New Role Card */}
          <Link
            href="/content/careers/new"
            className="group relative flex min-h-[260px] flex-col justify-between rounded-3xl border-2 border-dashed border-zinc-200/90 bg-zinc-50/50 p-6 shadow-2xs transition-all duration-200 hover:border-[#0073bc] hover:bg-blue-50/20 hover:shadow-md cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center text-center my-auto py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-zinc-400 shadow-xs ring-1 ring-zinc-200/80 transition-all duration-300 group-hover:scale-110 group-hover:bg-[#0073bc] group-hover:text-white group-hover:ring-transparent">
                <Plus className="h-7 w-7 stroke-[2.5]" />
              </div>
              <h3 className="mt-4 text-base font-bold text-zinc-800 transition-colors group-hover:text-[#0073bc]">
                Create New Job Posting
              </h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-[220px]">
                Define job scope, department, location, remote status, requirements & benefits.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-dashed border-zinc-200 pt-3.5">
              <span className="text-xs font-semibold text-zinc-400 group-hover:text-[#0073bc] transition-colors">
                + Open career opportunity
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1 text-xs font-bold text-zinc-700 shadow-2xs ring-1 ring-zinc-200/60 group-hover:bg-[#0073bc] group-hover:text-white group-hover:ring-transparent transition-all">
                Post Job
              </span>
            </div>
          </Link>

          {/* Job Cards */}
          {filteredJobs.map((job) => {
            const isBusy = busyJobId === job.id;
            return (
              <div
                key={job.id}
                onClick={() => router.push(`/content/careers/${job.id}`)}
                className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-2xs transition-all duration-200 hover:border-brand-blue/50 hover:shadow-md hover:ring-1 hover:ring-brand-blue/30 cursor-pointer"
              >
                <div>
                  {/* Top Bar: Department & Status Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#0073bc]">
                      <Building2 className="h-3 w-3" />
                      {job.department || "General"}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePublish(job);
                      }}
                      disabled={isBusy}
                      title={job.isPublished ? "Click to set as Draft" : "Click to Publish live"}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all cursor-pointer ${job.isPublished
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200"
                        }`}
                    >
                      {isBusy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${job.isPublished ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                            }`}
                        />
                      )}
                      {job.isPublished ? "Published" : "Draft"}
                    </button>
                  </div>

                  {/* Title & Slug */}
                  <div className="mt-3.5">
                    <h3 className="group-hover:text-brand-blue line-clamp-1 text-base font-bold text-zinc-950 transition-colors">
                      {job.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400 font-mono">
                      <span>/careers/{job.slug}</span>
                    </div>
                  </div>

                  {/* Attributes: Location & Remote */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 border border-zinc-100">
                      <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate max-w-[130px]">{job.location || "Riyadh"}</span>
                    </div>

                    {job.isRemote && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
                        <Globe className="h-3 w-3" />
                        Remote
                      </span>
                    )}

                    {job.employmentType && (
                      <span className="rounded-lg bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 border border-zinc-100">
                        {job.employmentType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Controls & Quick Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3.5">
                  <div className="flex items-center gap-2">
                    {/* View Applications */}
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 group-hover:text-brand-blue transition-colors">
                      <Users className="h-3.5 w-3.5 text-zinc-400" />
                      <span>
                        {job.applicationCount !== undefined ? `${job.applicationCount} Applicants` : "Candidates"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Direct link to public careers */}
                    <a
                      href={`/careers`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
                      title="View public career page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/content/careers/${job.id}`);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-blue-50 hover:text-[#0073bc] transition-colors cursor-pointer"
                      title="Edit posting"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Delete button */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteError(null);
                          setConfirmSlug("");
                          setJobToDelete(job);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete posting"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View Matching Staff & Admin Table Pattern */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)]">
          {/* Fixed Top Header */}
          <div className="bg-brand-blue mb-2 shrink-0 rounded-2xl px-6 py-3.5 text-white shadow-xs">
            <div className="grid grid-cols-12 items-center gap-3 text-xs font-semibold">
              <div className="col-span-3 min-w-0">Position & Slug</div>
              <div className="col-span-2 min-w-0">Department</div>
              <div className="col-span-2 min-w-0">Location</div>
              <div className="col-span-2 min-w-0">Remote Status</div>
              <div className="col-span-1 min-w-0 text-center">Status</div>
              <div className="col-span-1 min-w-0 text-center">Applicants</div>
              <div className="col-span-1 min-w-0 text-right">Actions</div>
            </div>
          </div>

          {/* Scrollable Rows */}
          <div
            data-lenis-prevent
            className="min-h-0 flex-1 [scrollbar-width:none] space-y-2 overflow-y-auto pr-1 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {filteredJobs.length === 0 ? (
              <div className="px-6 py-12 text-center text-zinc-500">
                No career postings match your search filters.
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isBusy = busyJobId === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/content/careers/${job.id}`)}
                    className="group hover:ring-brand-blue/40 grid cursor-pointer grid-cols-12 items-center gap-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-zinc-100 transition-all ring-inset hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)]"
                  >
                    {/* Position & Slug */}
                    <div className="col-span-3 min-w-0">
                      <div className="flex flex-col">
                        <span className="truncate text-sm font-bold text-zinc-950 group-hover:text-brand-blue transition-colors">
                          {job.title}
                        </span>
                        <span className="truncate font-mono text-xs text-zinc-400">
                          /careers/{job.slug}
                        </span>
                      </div>
                    </div>

                    {/* Department */}
                    <div className="col-span-2 min-w-0">
                      <span className="inline-flex items-center gap-1.5 truncate rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#0073bc]">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{job.department || "General"}</span>
                      </span>
                    </div>

                    {/* Location */}
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center gap-1.5 truncate text-xs font-semibold text-zinc-700">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{job.location || "Riyadh"}</span>
                        {job.employmentType && (
                          <span className="truncate text-[11px] text-zinc-400">
                            • {job.employmentType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remote Status (Dedicated Column) */}
                    <div className="col-span-2 min-w-0">
                      {job.isRemote ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700">
                          <Globe className="h-3 w-3 shrink-0" />
                          <span>Remote Friendly</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                          <span>On-site Only</span>
                        </span>
                      )}
                    </div>

                    {/* Status Toggle */}
                    <div className="col-span-1 min-w-0 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePublish(job);
                        }}
                        disabled={isBusy}
                        title={job.isPublished ? "Set to Draft" : "Publish live"}
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-all ${job.isPublished
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200"
                          }`}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${job.isPublished ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                              }`}
                          />
                        )}
                        <span>{job.isPublished ? "Published" : "Draft"}</span>
                      </button>
                    </div>

                    {/* Applicants */}
                    <div className="col-span-1 min-w-0 text-center">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 group-hover:bg-blue-50 group-hover:text-brand-blue transition-colors">
                        <Users className="h-3.5 w-3.5" />
                        <span>{job.applicationCount ?? 0}</span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 min-w-0 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/content/careers/${job.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-brand-blue flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-blue-50"
                          title="View details & edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteError(null);
                              setConfirmSlug("");
                              setJobToDelete(job);
                            }}
                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl p-1.5 text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                            title="Delete posting"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(jobToDelete)}
        onClose={() => setJobToDelete(null)}
        title="Delete Job Posting"
        description="This action removes the job position permanently from the system."
        footer={
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setJobToDelete(null)}
              disabled={isDeleting}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting || confirmSlug.trim() !== jobToDelete?.slug}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-40"
            >
              {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {deleteError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="rounded-xl bg-zinc-50 p-3 border border-zinc-200/80">
            <p className="text-xs font-bold text-zinc-900">{jobToDelete?.title}</p>
            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">/{jobToDelete?.slug}</p>
          </div>

          <p className="text-xs text-zinc-600 leading-relaxed">
            Deleting this position will permanently unpublish it and discard its settings. If you only want to hide it from public candidates, click cancel and set its status to <strong>Draft</strong> instead.
          </p>

          <div>
            <label className="block text-xs font-bold text-zinc-700">
              Please type <span className="font-mono text-red-600">{jobToDelete?.slug}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmSlug}
              onChange={(e) => setConfirmSlug(e.target.value)}
              placeholder={jobToDelete?.slug}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-mono font-medium focus:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-500/10"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
