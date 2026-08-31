"use client";

import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  DollarSign,
  FileText,
  Globe,
  Search,
  Tag,
  UploadCloud,
  UserCheck,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SubmitLoader } from "@/components/ui";
import { DatePicker } from "@/components/ui/date-picker";

const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false });

export type ParticipantOption = { id: string; label: string };

export type RequirementInitialData = {
  id: string;
  project: string;
  scopeOfWork: string;
  category: string;
  currency: string;
  sellingPrice: string;
  closesAt: string;
  invitedVendorIds: string[];
};

function FieldWrapper({
  label,
  hint,
  required,
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  required?: boolean;
  icon?: any;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
        {Icon && <Icon className="h-4 w-4 text-zinc-400" />}
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 transition-colors focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-brand-blue/20 placeholder:text-zinc-400";

function CustomSelect({
  name,
  options,
  placeholder,
  defaultValue,
}: {
  name: string;
  options: string[];
  placeholder: string;
  defaultValue?: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue || "");

  useEffect(() => {
    if (defaultValue) setSelected(defaultValue);
  }, [defaultValue]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span className={selected ? "font-medium text-zinc-900" : "text-zinc-400"}>
          {selected || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-30 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white py-2 shadow-xl">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setSelected("");
              setOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-50"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setSelected(opt);
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 ${selected === opt ? "bg-brand-blue/5 text-brand-blue font-semibold" : "text-zinc-700"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomDatePickerInput({
  name,
  required,
  defaultValue,
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const [date, setDate] = useState(defaultValue ? new Date(defaultValue).toISOString() : "");

  return (
    <div className="relative">
      <input type="hidden" name={name} value={date} required={required} />
      <DatePicker
        value={date}
        onChange={(iso) => setDate(iso)}
        placeholder="Select a closing deadline"
        className="w-full"
      />
    </div>
  );
}

export function PostRequirementForm({
  vendors,
  initialData,
}: {
  vendors: ParticipantOption[];
  initialData?: RequirementInitialData;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Invite distribution target: "ALL" vs "CUSTOM"
  const [inviteTarget, setInviteTarget] = useState<"ALL" | "CUSTOM">(() => {
    if (initialData?.invitedVendorIds && initialData.invitedVendorIds.length > 0) {
      if (initialData.invitedVendorIds.length === vendors.length && vendors.length > 0) {
        return "ALL";
      }
      return "CUSTOM";
    }
    return "ALL";
  });

  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(() => {
    if (initialData?.invitedVendorIds) {
      return new Set(initialData.invitedVendorIds);
    }
    return new Set(vendors.map((v) => v.id));
  });

  const [vendorSearch, setVendorSearch] = useState("");

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredVendors = vendors.filter((v) =>
    v.label.toLowerCase().includes(vendorSearch.toLowerCase().trim())
  );

  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  async function submit(e: React.FormEvent<HTMLFormElement>, post: boolean) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(e.currentTarget);
    const category = form.get("category");

    // Clean scope of work and append category properly without duplicates
    let rawScope = String(form.get("scopeOfWork") || "").trim();
    if (rawScope.includes("\n\nCategory: ")) {
      rawScope = rawScope.split("\n\nCategory: ")[0].trim();
    }
    const scopeWithCategory = category ? `${rawScope}\n\nCategory: ${category}` : rawScope;

    // Determine final invited vendor IDs based on selection mode
    let vendorUserIds: string[] = [];
    if (inviteTarget === "ALL") {
      vendorUserIds = vendors.map((v) => v.id);
    } else {
      vendorUserIds = Array.from(selectedVendors);
    }

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit
        ? `/api/requirements/${initialData.id}?post=${post}`
        : `/api/requirements?post=${post}`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopeOfWork: scopeWithCategory,
          project: form.get("project"),
          sellingPrice: form.get("sellingPrice") || null,
          currency: form.get("currency") || "SAR",
          closesAt: new Date(String(form.get("closesAt"))).toISOString(),
          vendorUserIds,
          post,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(body.error ?? "Could not save the requirement.");
        return;
      }

      router.push("/requirements");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(e) => submit(e, true)}
      className="relative min-h-full w-full"
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white/95 px-6 py-4 backdrop-blur-sm shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="focus-visible:ring-brand-blue flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:outline-none"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-zinc-950">
            {initialData ? "Edit Requirement" : "Post a Requirement"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              const form = e.currentTarget.closest("form");
              if (form) {
                submit({ preventDefault() {}, currentTarget: form } as any, false);
              }
            }}
            className="focus:ring-brand-blue/20 inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus:ring-2 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={busy}
            className="bg-brand-blue hover:bg-brand-blue/90 focus:ring-brand-blue/30 inline-flex h-10 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md focus:ring-[3px] disabled:opacity-50"
          >
            {busy ? (
              <SubmitLoader text={initialData ? "Updating..." : "Publishing..."} />
            ) : (
              <>
                <UploadCloud className="h-4 w-4" />
                {initialData ? "Update Requirement" : "Post Requirement"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="mx-auto w-full max-w-6xl space-y-8 p-6 pb-20 md:p-8">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-rose-200/50 bg-rose-50 p-5 text-sm font-medium text-rose-900"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
            {/* Left Column: Scope & Project Title */}
            <div className="flex flex-col">
              <section className="flex h-full flex-col rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 border-b border-zinc-100 pb-4 text-lg font-bold text-zinc-950">
                  <FileText className="text-brand-blue h-5 w-5" />
                  Scope of Work
                </h2>

                <div className="mt-6 flex flex-1 flex-col gap-6 lg:flex-row">
                  {/* File Upload Box */}
                  <div className="flex w-full flex-col lg:w-48 lg:shrink-0">
                    <FieldWrapper label="Scope Document" hint="Optional attachment.">
                      <div className="h-full">
                        <label className="hover:border-brand-blue/50 flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-4 text-center transition-colors hover:bg-zinc-50">
                          {file ? (
                            <div className="flex flex-col items-center">
                              <FileText className="text-brand-blue mb-2 h-8 w-8" />
                              <span className="line-clamp-2 text-xs font-semibold text-zinc-900">
                                {file.name}
                              </span>
                              <span className="mt-1 text-[10px] text-zinc-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <div className="bg-brand-blue/5 text-brand-blue mb-3 flex h-10 w-10 items-center justify-center rounded-xl">
                                <UploadCloud className="h-5 w-5" />
                              </div>
                              <p className="text-xs font-medium text-zinc-600">
                                <span className="text-brand-blue font-semibold">Upload file</span>{" "}
                                or drag and drop
                              </p>
                              <p className="mt-2 text-xs text-zinc-400">PDF, DOCX up to 10MB</p>
                            </div>
                          )}
                          <input
                            type="file"
                            name="scopeDocument"
                            className="hidden"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    </FieldWrapper>
                  </div>

                  {/* Name and Description */}
                  <div className="flex flex-1 flex-col space-y-6">
                    <FieldWrapper label="Project Title" icon={Briefcase} required>
                      <input
                        name="project"
                        required
                        defaultValue={initialData?.project}
                        className={inputClass}
                        placeholder="e.g. Q3 Server Refresh or Office Renovation"
                      />
                    </FieldWrapper>

                    <div className="mt-6 flex flex-1 flex-col">
                      <FieldWrapper label="Scope of Work" required className="h-full flex-1">
                        <textarea
                          name="scopeOfWork"
                          required
                          defaultValue={initialData?.scopeOfWork}
                          className={`${inputClass} min-h-[180px] h-full flex-1 resize-y`}
                          placeholder="Describe the full requirements, deliverables, and expectations in detail..."
                        />
                      </FieldWrapper>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column: Metadata & Deadlines */}
            <div className="flex flex-col">
              <section className="flex h-full flex-col space-y-6 rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 border-b border-zinc-100 pb-4 text-lg font-bold text-zinc-950">
                  <Calendar className="text-brand-blue h-5 w-5" />
                  Scheduling & Budget
                </h2>

                <FieldWrapper label="Closes at (Deadline)" required>
                  <CustomDatePickerInput
                    name="closesAt"
                    required
                    defaultValue={initialData?.closesAt}
                  />
                </FieldWrapper>

                <FieldWrapper label="Category" icon={Tag}>
                  <CustomSelect
                    name="category"
                    placeholder="Select a category (optional)"
                    options={[
                      "IT & Hardware",
                      "Software Services",
                      "Consulting",
                      "Logistics",
                      "Maintenance",
                      "General Supplies",
                      "Construction & Civil",
                    ]}
                    defaultValue={initialData?.category}
                  />
                </FieldWrapper>

                <div className="flex-1 space-y-6">
                  <FieldWrapper label="Currency">
                    <input
                      name="currency"
                      defaultValue={initialData?.currency || "SAR"}
                      className={inputClass}
                    />
                  </FieldWrapper>

                  <FieldWrapper label="Selling Price" icon={DollarSign} hint="Internal use only.">
                    <input
                      name="sellingPrice"
                      inputMode="decimal"
                      defaultValue={initialData?.sellingPrice || ""}
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </FieldWrapper>
                </div>
              </section>
            </div>
          </div>

          {/* Full Width: Suppliers & Distribution Mode */}
          <section className="space-y-6 rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
            <div className="border-b border-zinc-100 pb-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-950">
                    <Users className="text-brand-blue h-5 w-5" />
                    Supplier Bidding Distribution
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Choose whether this requirement is open to the entire supplier network or restricted to selected vendors.
                  </p>
                </div>

                {/* Segmented Radio Options */}
                <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setInviteTarget("ALL");
                      setSelectedVendors(new Set(vendors.map((v) => v.id)));
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all ${
                      inviteTarget === "ALL"
                        ? "bg-white text-brand-blue shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Send to All Suppliers
                  </button>

                  <button
                    type="button"
                    onClick={() => setInviteTarget("CUSTOM")}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all ${
                      inviteTarget === "CUSTOM"
                        ? "bg-white text-brand-blue shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Select Specific Suppliers
                  </button>
                </div>
              </div>
            </div>

            {inviteTarget === "ALL" ? (
              <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-6 text-zinc-800">
                <div className="bg-brand-blue/10 text-brand-blue flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-950">Open Tender (All Approved Suppliers)</h3>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    All <strong>{vendors.length}</strong> active, pre-approved suppliers in the RVCC portal will be invited and have full access to participate in live blind bidding.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Control bar for custom selection */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Filter suppliers by name..."
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-1.5 pr-3 pl-9 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-brand-blue focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedVendors(new Set(vendors.map((v) => v.id)))}
                      className="text-brand-blue hover:text-brand-blue/80 text-xs font-bold transition-colors"
                    >
                      Select All ({vendors.length})
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedVendors(new Set())}
                      className="text-zinc-500 hover:text-zinc-800 text-xs font-bold transition-colors"
                    >
                      Deselect All
                    </button>
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-0.5 text-xs font-bold text-brand-blue">
                      {selectedVendors.size} Selected
                    </span>
                  </div>
                </div>

                {vendors.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                    No active suppliers available to invite. Please approve vendor registrations first.
                  </div>
                ) : filteredVendors.length === 0 ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-xs text-zinc-500">
                    No suppliers match "{vendorSearch}".
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-h-72 overflow-y-auto pr-1">
                    {filteredVendors.map((v) => {
                      const isSelected = selectedVendors.has(v.id);
                      return (
                        <div
                          key={v.id}
                          onClick={() => toggleVendor(v.id)}
                          className={`relative cursor-pointer rounded-xl border p-3.5 transition-all duration-200 ${
                            isSelected
                              ? "border-brand-blue bg-blue-50/40 shadow-xs ring-1 ring-brand-blue/40"
                              : "hover:border-brand-blue/40 border-zinc-200 bg-white hover:bg-zinc-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="min-w-0 flex-1">
                              <p
                                className={`truncate text-xs font-bold ${isSelected ? "text-brand-blue" : "text-zinc-900"}`}
                              >
                                {v.label.split(" (")[0]}
                              </p>
                              <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                                {v.label.includes("(")
                                  ? v.label.split("(")[1].replace(")", "")
                                  : v.label}
                              </p>
                            </div>
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                isSelected
                                  ? "border-brand-blue bg-brand-blue text-white"
                                  : "border-zinc-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </form>
  );
}
