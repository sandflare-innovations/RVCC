"use client";

import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Info,
  ListPlus,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";

import { CustomSelect } from "@/components/ui/custom-select";
import { Modal } from "@/components/ui/modal";
import { readApiError } from "@/lib/read-error";

export type CareerDraft = {
  id: string | null;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  requirements: string;
  benefits: string;
  isRemote: boolean;
  isPublished: boolean;
};

/** Convert multi-line strings into cleaned array of trimmed items */
function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Generate a clean URL slug from a title */
function slugifyTitle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function CareerEditor({
  initial,
  departments,
  employmentTypes,
}: {
  initial: CareerDraft;
  departments: readonly string[];
  employmentTypes: readonly string[];
}) {
  const router = useRouter();
  const isEditing = Boolean(initial.id);
  const [form, setForm] = useState<CareerDraft>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live item inputs for requirements and benefits
  const [requirementInput, setRequirementInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  // Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // Auto-generate slug if user hasn't explicitly customized it
  const [slugModifiedManually, setSlugModifiedManually] = useState(Boolean(initial.slug));

  const set = <K extends keyof CareerDraft>(key: K, value: CareerDraft[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Handle title change with auto slugging
  const handleTitleChange = (val: string) => {
    set("title", val);
    if (!slugModifiedManually) {
      set("slug", slugifyTitle(val));
    }
  };

  // Requirements as array
  const requirementList = useMemo(() => toLines(form.requirements), [form.requirements]);

  const addRequirement = () => {
    if (!requirementInput.trim()) return;
    const lines = toLines(form.requirements);
    lines.push(requirementInput.trim());
    set("requirements", lines.join("\n"));
    setRequirementInput("");
  };

  const removeRequirement = (index: number) => {
    const lines = toLines(form.requirements);
    lines.splice(index, 1);
    set("requirements", lines.join("\n"));
  };

  // Benefits as array
  const benefitList = useMemo(() => toLines(form.benefits), [form.benefits]);

  const addBenefit = () => {
    if (!benefitInput.trim()) return;
    const lines = toLines(form.benefits);
    lines.push(benefitInput.trim());
    set("benefits", lines.join("\n"));
    setBenefitInput("");
  };

  const removeBenefit = (index: number) => {
    const lines = toLines(form.benefits);
    lines.splice(index, 1);
    set("benefits", lines.join("\n"));
  };

  const save = async (targetPublishState?: boolean) => {
    if (!form.title.trim()) {
      setError("Please specify a job title.");
      return;
    }
    if (!form.department) {
      setError("Please choose a department.");
      return;
    }
    if (!form.location.trim()) {
      setError("Please specify a job location.");
      return;
    }
    if (!form.description.trim()) {
      setError("Please provide a job overview / description.");
      return;
    }

    setBusy(true);
    setError(null);

    const isPub = targetPublishState !== undefined ? targetPublishState : form.isPublished;

    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || slugifyTitle(form.title),
        department: form.department,
        location: form.location.trim(),
        employmentType: form.employmentType,
        description: form.description.trim(),
        requirements: toLines(form.requirements),
        benefits: toLines(form.benefits),
        isRemote: form.isRemote,
        isPublished: isPub,
      };

      const res = await fetch(form.id ? `/api/careers/${form.id}` : "/api/careers", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        setError(await readApiError(res, "Could not save this posting."));
        return;
      }

      router.push("/content/careers");
      router.refresh();
    } catch {
      setError("Network error — please verify your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const isFormReady = Boolean(
    form.title.trim() && form.department && form.location.trim() && form.description.trim()
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="space-y-6"
    >
      {/* Sticky Action Toolbar */}
      <div className="sticky top-0 z-30 -mx-4 -mt-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/95 px-5 py-3 backdrop-blur-md sm:-mx-6 sm:-mt-6 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Link
            href="/content/careers"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 shadow-2xs transition-all hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="Back to Careers list"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-950 sm:text-base">
              {isEditing ? `Edit: ${initial.title}` : "Create New Role"}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                form.isPublished
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}
            >
              {form.isPublished ? "Live Published" : "Draft Mode"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Preview Button */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/50 px-3.5 py-2 text-xs font-semibold text-[#0073bc] shadow-2xs transition-all hover:border-[#0073bc] hover:bg-blue-50"
          >
            <Eye className="h-3.5 w-3.5 text-[#0073bc]" />
            Preview
          </button>

          {/* Save as Draft */}
          <button
            type="button"
            disabled={busy || !isFormReady}
            onClick={() => save(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition-all hover:bg-zinc-50 disabled:opacity-50"
          >
            {busy && !form.isPublished ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save Draft
          </button>

          {/* Publish / Save Changes */}
          <button
            type="button"
            disabled={busy || !isFormReady}
            onClick={() => save(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0073bc] px-4.5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#005fa0] active:scale-98 disabled:opacity-50"
          >
            {busy && form.isPublished ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            )}
            <span>{isEditing ? "Save & Publish" : "Publish Posting"}</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 sm:text-sm"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600 sm:h-5 sm:w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left / Main Column: Job Information */}
        <div className="space-y-6 lg:col-span-8">
          {/* General Overview Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-zinc-100 pb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-[#0073bc]">
                <Briefcase className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-950 sm:text-base">Role Overview</h2>
                <p className="text-xs text-zinc-500">
                  Core position title, public URL identifier, and department classification.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Job Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-700">
                  Job Position Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Senior Project Architect"
                  className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-xs font-medium text-zinc-900 shadow-2xs placeholder:text-zinc-400 transition-all focus:border-[#0073bc] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10 sm:text-sm"
                />
              </div>

              {/* URL Slug Generator */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-zinc-700">
                    Public URL Slug
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSlugModifiedManually(false);
                      set("slug", slugifyTitle(form.title));
                    }}
                    className="text-[11px] font-semibold text-[#0073bc] hover:underline"
                  >
                    Regenerate from title
                  </button>
                </div>
                <div className="mt-1.5 flex items-center rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-1.5 shadow-2xs focus-within:border-[#0073bc] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0073bc]/10">
                  <span className="font-mono text-xs text-zinc-400 select-none">
                    rvcc.sa/careers/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugModifiedManually(true);
                      set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }}
                    placeholder="senior-project-architect"
                    className="w-full bg-transparent px-1 font-mono text-xs font-medium text-zinc-800 outline-hidden"
                  />
                </div>
                <p className="mt-1 text-[11px] text-zinc-400">
                  This permanent link is used by job boards and applicant tracking links.
                </p>
              </div>

              {/* Department & Employment Type */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={form.department}
                    onChange={(val) => set("department", val)}
                    options={departments}
                    placeholder="Choose department…"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    Employment Type <span className="text-red-500">*</span>
                  </label>
                  <CustomSelect
                    value={form.employmentType}
                    onChange={(val) => set("employmentType", val)}
                    options={employmentTypes}
                    placeholder="Choose employment type…"
                  />
                </div>
              </div>

              {/* Location & Remote toggle */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-1">
                <div>
                  <label className="block text-xs font-bold text-zinc-700">
                    Location <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      required
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="e.g. Riyadh, Saudi Arabia"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-zinc-900 shadow-2xs placeholder:text-zinc-400 transition-all focus:border-[#0073bc] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <div className="flex h-[42px] items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/50 px-4">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-bold text-zinc-800">Remote Friendly</span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={form.isRemote}
                        onChange={(e) => set("isRemote", e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="peer h-5 w-9 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-purple-600 peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Job Description Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-950 sm:text-base">
                  Job Description & Scope <span className="text-red-500">*</span>
                </h2>
                <p className="text-xs text-zinc-500">
                  Introduce the department, mission, day-to-day responsibilities, and team dynamic.
                </p>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">
                {form.description.length} chars
              </span>
            </div>

            <textarea
              required
              rows={6}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="We are looking for an experienced Project Architect to lead complex structural and architectural projects across Riyadh and GCC..."
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 text-xs font-medium text-zinc-900 leading-relaxed placeholder:text-zinc-400 transition-all focus:border-[#0073bc] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10 sm:text-sm"
            />
          </div>

          {/* Requirements & Candidate Qualifications Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-950 sm:text-base">
                  Requirements & Qualifications
                </h2>
                <p className="text-xs text-zinc-500">
                  Key qualifications, technical software proficiency, and experience prerequisites.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#0073bc]">
                {requirementList.length} items
              </span>
            </div>

            {/* Quick Add Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRequirement();
                  }
                }}
                placeholder="Add a requirement (e.g. 5+ years Revit & AutoCAD proficiency)..."
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-[#0073bc] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10"
              />
              <button
                type="button"
                onClick={addRequirement}
                disabled={!requirementInput.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-[#0073bc] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#005fa0] transition-all disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            {/* Chips List */}
            {requirementList.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {requirementList.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-2.5 text-xs text-zinc-800 transition-colors hover:bg-zinc-100/60"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0073bc]/10 font-mono text-[10px] font-bold text-[#0073bc]">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{req}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRequirement(idx)}
                      className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Remove requirement"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400">
                No specific requirements listed yet. Add items above or paste multi-line text below.
              </div>
            )}

            {/* Bulk Textarea toggle / fallback */}
            <details className="pt-1 text-xs text-zinc-500">
              <summary className="cursor-pointer font-semibold text-zinc-600 hover:text-[#0073bc]">
                Toggle bulk multiline text editor
              </summary>
              <div className="mt-2">
                <textarea
                  rows={4}
                  value={form.requirements}
                  onChange={(e) => set("requirements", e.target.value)}
                  placeholder="One requirement per line..."
                  className="w-full rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-800"
                />
              </div>
            </details>
          </div>

          {/* Benefits & Perks Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-950 sm:text-base">Benefits & Perks</h2>
                <p className="text-xs text-zinc-500">
                  Health coverage, transportation allowance, performance bonuses, and career growth.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                {benefitList.length} perks
              </span>
            </div>

            {/* Quick Add Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
                placeholder="Add a perk (e.g. Comprehensive medical insurance for family)..."
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:border-[#0073bc] focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0073bc]/10"
              />
              <button
                type="button"
                onClick={addBenefit}
                disabled={!benefitInput.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-[#0073bc] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-[#005fa0] transition-all disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </button>
            </div>

            {/* Chips List */}
            {benefitList.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {benefitList.map((ben, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-2.5 text-xs text-zinc-800 transition-colors hover:bg-zinc-100/60"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-mono text-[10px] font-bold text-emerald-700">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{ben}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBenefit(idx)}
                      className="rounded-lg p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Remove perk"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-center text-xs text-zinc-400">
                No specific benefits added yet.
              </div>
            )}

            {/* Bulk Textarea toggle / fallback */}
            <details className="pt-1 text-xs text-zinc-500">
              <summary className="cursor-pointer font-semibold text-zinc-600 hover:text-[#0073bc]">
                Toggle bulk multiline text editor
              </summary>
              <div className="mt-2">
                <textarea
                  rows={4}
                  value={form.benefits}
                  onChange={(e) => set("benefits", e.target.value)}
                  placeholder="One benefit per line..."
                  className="w-full rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs text-zinc-800"
                />
              </div>
            </details>
          </div>
        </div>

        {/* Right Column: Publishing Controls & Role Summary */}
        <div className="space-y-6 lg:col-span-4">
          {/* Publication Control Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-950">Publication Settings</h3>

            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-900">Publish Live</span>
                  <p className="text-[11px] text-zinc-500">
                    Visible immediately on rvcc.sa/careers
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => set("isPublished", e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-zinc-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-emerald-600 peer-checked:after:translate-x-full" />
                </label>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                disabled={busy || !isFormReady}
                onClick={() => save(true)}
                className="w-full rounded-xl bg-[#0073bc] py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#005fa0] active:scale-98 disabled:opacity-50"
              >
                {isEditing ? "Save & Publish" : "Publish Posting Live"}
              </button>

              <button
                type="button"
                disabled={busy || !isFormReady}
                onClick={() => save(false)}
                className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-bold text-zinc-700 shadow-2xs transition-all hover:bg-zinc-50 disabled:opacity-50"
              >
                Save as Unpublished Draft
              </button>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-zinc-950">Posting Summary</h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Status</span>
                <span
                  className={`font-bold ${form.isPublished ? "text-emerald-600" : "text-amber-600"}`}
                >
                  {form.isPublished ? "Published" : "Draft"}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Department</span>
                <span className="font-semibold text-zinc-900">{form.department || "—"}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Employment</span>
                <span className="font-semibold text-zinc-900">{form.employmentType || "—"}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Location</span>
                <span className="font-semibold text-zinc-900">{form.location || "—"}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-100">
                <span className="text-zinc-500">Work Mode</span>
                <span className="font-semibold text-zinc-900">
                  {form.isRemote ? "Remote Friendly" : "On-site"}
                </span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-zinc-500">Requirements</span>
                <span className="font-semibold text-zinc-900">{requirementList.length} items</span>
              </div>
            </div>
          </div>

          {/* Help & Best Practice Tip */}
          <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-5 text-xs text-[#0073bc] space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Sparkles className="h-4 w-4" />
              <span>Hiring Tip</span>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              Clear requirements with specific tools (e.g. AutoCAD, SAP, BIM) help candidates self-qualify and drastically reduce unqualified applicant submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Public Posting Preview"
        description="This is how this career opportunity appears to candidates on the public portal."
        maxWidth="3xl"
        footer={
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="rounded-xl bg-[#0073bc] px-5 py-2 text-xs font-bold text-white hover:bg-[#005fa0] transition-colors"
          >
            Close Preview
          </button>
        }
      >
        <div className="space-y-6 py-2">
          {/* Header Banner */}
          <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50 p-6 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0073bc]">
                {form.department || "Department"}
              </span>
              <span className="rounded-lg bg-zinc-200/70 px-2.5 py-1 text-xs font-medium text-zinc-700">
                {form.employmentType || "Full-time"}
              </span>
              {form.isRemote && (
                <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
                  Remote Friendly
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-zinc-950 sm:text-2xl">
              {form.title || "Job Title"}
            </h1>

            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <MapPin className="h-4 w-4 text-zinc-400" />
              <span>{form.location || "Location not set"}</span>
            </div>
          </div>

          {/* Role Overview */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              About the Role
            </h3>
            <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
              {form.description || "No description specified yet."}
            </p>
          </div>

          {/* Requirements */}
          {requirementList.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                What We Look For
              </h3>
              <ul className="space-y-1.5 text-xs text-zinc-700">
                {requirementList.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#0073bc] shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Benefits */}
          {benefitList.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Perks & Benefits
              </h3>
              <ul className="space-y-1.5 text-xs text-zinc-700">
                {benefitList.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </form>
  );
}
