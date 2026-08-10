"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AlertCircle } from "lucide-react";

import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { readApiError } from "@/lib/api/read-error";
import {
  EnquireField,
  enquireInputClass,
  enquireSelectClass,
  enquireTextareaClass,
} from "@/sections/enquire/EnquireField";

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

/** One item per line — simpler for staff than a repeating-field widget. */
function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
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
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CareerDraft>(key: K, value: CareerDraft[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        department: form.department,
        location: form.location,
        employmentType: form.employmentType,
        description: form.description,
        requirements: toLines(form.requirements),
        benefits: toLines(form.benefits),
        isRemote: form.isRemote,
        isPublished: form.isPublished,
      };

      const res = await fetch(form.id ? `/api/admin/careers/${form.id}` : "/api/admin/careers", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(await readApiError(res, "Could not save this posting."));
        return;
      }
      const data = await res.json().catch(() => ({}));
      router.push("/admin/content/careers");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  const ready =
    form.title.trim() && form.department && form.location.trim() && form.description.trim();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="max-w-3xl space-y-5"
    >
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border-l-4 border-zinc-900 bg-zinc-100 px-3.5 py-3 text-sm font-medium text-zinc-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <EnquireField label="Job title" required className="sm:col-span-2">
          <input
            className={enquireInputClass}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </EnquireField>

        <EnquireField
          label="URL slug"
          className="sm:col-span-2"
          hint="Leave blank to generate from the title."
        >
          <input
            className={enquireInputClass}
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            placeholder="senior-architect"
          />
        </EnquireField>

        <EnquireField label="Department" required>
          <select
            className={enquireSelectClass}
            value={form.department}
            onChange={(e) => set("department", e.target.value)}
            required
          >
            <option value="">Select…</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </EnquireField>

        <EnquireField label="Employment type" required>
          <select
            className={enquireSelectClass}
            value={form.employmentType}
            onChange={(e) => set("employmentType", e.target.value)}
            required
          >
            {employmentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </EnquireField>

        <EnquireField label="Location" required className="sm:col-span-2">
          <input
            className={enquireInputClass}
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Riyadh, Saudi Arabia"
            required
          />
        </EnquireField>

        <EnquireField label="Description" required className="sm:col-span-2">
          <textarea
            className={enquireTextareaClass}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            required
          />
        </EnquireField>

        <EnquireField label="Requirements" className="sm:col-span-2" hint="One per line.">
          <textarea
            className={enquireTextareaClass}
            value={form.requirements}
            onChange={(e) => set("requirements", e.target.value)}
            rows={5}
          />
        </EnquireField>

        <EnquireField label="Benefits" className="sm:col-span-2" hint="One per line.">
          <textarea
            className={enquireTextareaClass}
            value={form.benefits}
            onChange={(e) => set("benefits", e.target.value)}
            rows={5}
          />
        </EnquireField>
      </div>

      <div className="flex flex-wrap gap-5 border-t border-zinc-200 pt-5">
        <label className="flex items-center gap-2.5 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={form.isRemote}
            onChange={(e) => set("isRemote", e.target.checked)}
            className="accent-brand-blue h-4 w-4"
          />
          Remote friendly
        </label>
        <label className="flex items-center gap-2.5 text-sm text-zinc-800">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="accent-brand-blue h-4 w-4"
          />
          Published — visible on the public careers page
        </label>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-5 sm:flex-row">
        <InteractiveHoverButton
          type="button"
          variant="outline"
          className="sm:w-auto"
          fullWidth
          disabled={busy}
          onClick={() => router.push("/admin/content/careers")}
        >
          Cancel
        </InteractiveHoverButton>
        <InteractiveHoverButton
          type="submit"
          variant="solid"
          className="sm:w-auto"
          fullWidth
          pending={busy}
          disabled={!ready}
        >
          {busy ? "Saving…" : form.id ? "Save Changes" : "Create Posting"}
        </InteractiveHoverButton>
      </div>
    </form>
  );
}
