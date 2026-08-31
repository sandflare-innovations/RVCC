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
  Tag,
  UploadCloud,
  Users,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect,useState } from "react";

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

  return (
    <div className="relative">
      <input type="hidden" name={name} value={selected} />
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`${inputClass} flex items-center justify-between text-left`}
      >
        <span className={selected ? "text-zinc-900" : "text-zinc-400"}>
          {selected || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white py-2 shadow-xl">
          <button
            type="button"
            onClick={() => setSelected("")}
            className="w-full px-4 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-50"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelected(opt)}
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
        onChange={setDate}
        placeholder="Select deadline date"
        minDate="today"
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(null);

  // Set up pdfjs worker on client only (avoids DOMMatrix SSR crash)
  useEffect(() => {
    import("react-pdf").then(({ pdfjs }) => {
      pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    });
  }, []);

  // Track selected vendors to style the cards beautifully
  const [selectedVendors, setSelectedVendors] = useState<Set<string>>(
    new Set(initialData?.invitedVendorIds || [])
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfPreview(URL.createObjectURL(file));
    } else {
      setPdfPreview(null);
    }
  };

  const toggleVendor = (id: string) => {
    setSelectedVendors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function submit(event: React.FormEvent<HTMLFormElement>, post: boolean) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const vendorUserIds = Array.from(selectedVendors);

    const category = form.get("category");
    const scopeOfWork = form.get("scopeOfWork");
    const scopeWithCategory = category ? `${scopeOfWork}\n\nCategory: ${category}` : scopeOfWork;

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/requirements/${initialData.id}` : "/api/requirements";
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
      className="relative flex h-full min-h-0 w-full flex-col"
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white/95 px-6 py-4 backdrop-blur-sm">
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

      <div className="flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-8 p-6 pb-12 md:p-8">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-rose-200/50 bg-rose-50 p-5 text-sm font-medium text-rose-900"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Left Column: Core Details */}
            <div className="flex flex-col">
              <section className="flex h-full flex-col rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
                <h2 className="mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4 text-lg font-bold text-zinc-950">
                  <FileText className="text-brand-blue h-5 w-5" />
                  Project Details
                </h2>

                <div className="flex flex-1 flex-col gap-8 md:flex-row">
                  {/* Left Side: File Upload */}
                  <div className="flex w-full shrink-0 flex-col md:w-64">
                    <FieldWrapper label="Scope of Work Document" icon={FileText}>
                      <div className="mt-1 flex w-full items-center justify-center">
                        <label className="hover:border-brand-blue/50 group relative flex aspect-[3/4] w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:bg-white">
                          {pdfPreview ? (
                            <>
                              <div className="absolute inset-0 flex items-center justify-center bg-white p-2">
                                <Document
                                  file={pdfPreview}
                                  className="pointer-events-none flex h-full w-full items-center justify-center"
                                >
                                  <Page
                                    pageNumber={1}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    className="flex h-full w-full items-center justify-center drop-shadow-sm [&>canvas]:!h-auto [&>canvas]:max-h-full [&>canvas]:!w-auto [&>canvas]:max-w-full [&>canvas]:object-contain"
                                  />
                                </Document>
                              </div>
                              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100">
                                <div className="flex scale-95 flex-col items-center justify-center rounded-xl border border-zinc-200/50 bg-white px-4 py-3 shadow-sm transition-transform duration-200 group-hover:scale-100">
                                  <UploadCloud className="text-brand-blue mb-1.5 h-6 w-6" />
                                  <span className="text-sm font-bold text-zinc-900">
                                    Replace Document
                                  </span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 transition-transform group-hover:scale-110">
                                <UploadCloud className="text-brand-blue h-6 w-6" />
                              </div>
                              <p className="mb-2 text-sm leading-relaxed text-zinc-600">
                                <span className="text-brand-blue font-semibold">
                                  Click to upload
                                </span>
                                <br />
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

                  {/* Right Side: Name and Description */}
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
                          className={`${inputClass} h-full flex-1 resize-none [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300 [&::-webkit-scrollbar-track]:bg-transparent`}
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

          {/* Full Width: Suppliers Section */}
          <section className="space-y-6 rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold text-zinc-950">
                    <Users className="text-brand-blue h-5 w-5" />
                    Invite Suppliers
                  </h2>
                  {vendors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedVendors(new Set(vendors.map((v) => v.id)))}
                      className="text-brand-blue hover:text-brand-blue/80 text-xs font-semibold transition-colors"
                    >
                      Select All
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Select pre-approved vendors to participate in this requirement.
                </p>
              </div>
              <span className="bg-brand-blue/10 text-brand-blue rounded-full px-3 py-1 text-xs font-bold">
                {selectedVendors.size} Selected
              </span>
            </div>

            {vendors.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                No active suppliers available to invite. Please approve some vendor registrations
                first.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {vendors.map((v) => {
                  const isSelected = selectedVendors.has(v.id);
                  return (
                    <div
                      key={v.id}
                      onClick={() => toggleVendor(v.id)}
                      className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? "border-brand-blue bg-blue-50/30 shadow-[0_0_0_1px_rgba(0,111,238,1)]"
                          : "hover:border-brand-blue/50 border-zinc-200 bg-white hover:bg-zinc-50/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm font-semibold ${isSelected ? "text-brand-blue" : "text-zinc-900"}`}
                          >
                            {v.label.split(" (")[0]}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">
                            {v.label.includes("(")
                              ? v.label.split("(")[1].replace(")", "")
                              : v.label}
                          </p>
                        </div>
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            isSelected
                              ? "border-brand-blue bg-brand-blue text-white"
                              : "border-zinc-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </form>
  );
}
