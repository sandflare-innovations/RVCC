"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileText, UploadCloud, Users, Calendar, DollarSign, Tag, Check, Briefcase, ChevronLeft, ChevronDown } from "lucide-react";
import { SubmitLoader } from "@/components/ui";
import { DatePicker } from "@/components/ui/date-picker";
import dynamic from "next/dynamic";

const Document = dynamic(() => import("react-pdf").then(mod => mod.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then(mod => mod.Page), { ssr: false });


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

function FieldWrapper({ label, hint, required, icon: Icon, children, className = "" }: { label: string; hint?: string; required?: boolean; icon?: any; children: React.ReactNode; className?: string }) {
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

const inputClass = "w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 transition-colors focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-[3px] focus:ring-brand-blue/20 placeholder:text-zinc-400";

function CustomSelect({ name, options, placeholder, defaultValue }: { name: string; options: string[]; placeholder: string; defaultValue?: string }) {
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
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white py-2 shadow-xl">
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
              className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 ${selected === opt ? "bg-brand-blue/5 font-semibold text-brand-blue" : "text-zinc-700"}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CustomDatePickerInput({ name, required, defaultValue }: { name: string; required?: boolean; defaultValue?: string }) {
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
    setSelectedVendors(prev => {
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
    <form onSubmit={(e) => submit(e, true)} className="flex flex-col min-h-0 w-full h-full relative">
      {/* Fixed Sticky Header */}
      <div className="flex-none flex items-center justify-between bg-white px-6 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue"
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
                submit({ preventDefault() { }, currentTarget: form } as any, false);
              }
            }}
            className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-blue px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-blue/90 hover:shadow-md focus:ring-[3px] focus:ring-brand-blue/30 disabled:opacity-50"
          >
            {busy ? <SubmitLoader text={initialData ? "Updating..." : "Publishing..."} /> : (
              <>
                <UploadCloud className="h-4 w-4" />
                {initialData ? "Update Requirement" : "Post Requirement"}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full pb-12">
          {error && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl bg-rose-50 p-5 text-sm font-medium text-rose-900 border border-rose-200/50">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* Left Column: Core Details */}
            <div className="flex flex-col">
              <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm flex flex-col h-full">
                <h2 className="text-lg font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-4 mb-6">
                  <FileText className="h-5 w-5 text-brand-blue" />
                  Project Details
                </h2>

                <div className="flex flex-col md:flex-row gap-8 flex-1">
                  {/* Left Side: File Upload */}
                  <div className="w-full md:w-64 shrink-0 flex flex-col">
                    <FieldWrapper label="Scope of Work Document" icon={FileText}>
                      <div className="flex justify-center items-center w-full mt-1">
                        <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-zinc-200 border-dashed rounded-xl cursor-pointer bg-zinc-50 hover:bg-white hover:border-brand-blue/50 transition-colors group relative overflow-hidden">
                          {pdfPreview ? (
                            <>
                              <div className="absolute inset-0 bg-white flex items-center justify-center p-2">
                                <Document file={pdfPreview} className="flex items-center justify-center w-full h-full pointer-events-none">
                                  <Page 
                                    pageNumber={1} 
                                    renderTextLayer={false} 
                                    renderAnnotationLayer={false}
                                    className="w-full h-full flex items-center justify-center drop-shadow-sm [&>canvas]:!w-auto [&>canvas]:!h-auto [&>canvas]:max-w-full [&>canvas]:max-h-full [&>canvas]:object-contain"
                                  />
                                </Document>
                              </div>
                              <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                                <div className="flex flex-col items-center justify-center bg-white px-4 py-3 rounded-xl shadow-sm border border-zinc-200/50 scale-95 group-hover:scale-100 transition-transform duration-200">
                                  <UploadCloud className="w-6 h-6 text-brand-blue mb-1.5" />
                                  <span className="text-zinc-900 font-bold text-sm">Replace Document</span>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-6 text-center">
                              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-6 h-6 text-brand-blue" />
                              </div>
                              <p className="mb-2 text-sm text-zinc-600 leading-relaxed"><span className="font-semibold text-brand-blue">Click to upload</span><br />or drag and drop</p>
                              <p className="text-xs text-zinc-400 mt-2">PDF, DOCX up to 10MB</p>
                            </div>
                          )}
                          <input type="file" name="scopeDocument" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                        </label>
                      </div>
                    </FieldWrapper>
                  </div>

                  {/* Right Side: Name and Description */}
                  <div className="flex-1 space-y-6 flex flex-col">
                    <FieldWrapper label="Project Title" icon={Briefcase} required>
                      <input
                        name="project"
                        required
                        defaultValue={initialData?.project}
                        className={inputClass}
                        placeholder="e.g. Q3 Server Refresh or Office Renovation"
                      />
                    </FieldWrapper>

                    <div className="flex-1 flex flex-col mt-6">
                      <FieldWrapper label="Scope of Work" required className="flex-1 h-full">
                        <textarea
                          name="scopeOfWork"
                          required
                          defaultValue={initialData?.scopeOfWork}
                          className={`${inputClass} resize-none h-full flex-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-200 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300`}
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
              <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm flex flex-col h-full space-y-6">
                <h2 className="text-lg font-bold text-zinc-950 flex items-center gap-2 border-b border-zinc-100 pb-4">
                  <Calendar className="h-5 w-5 text-brand-blue" />
                  Scheduling & Budget
                </h2>

                <FieldWrapper label="Closes at (Deadline)" required>
                  <CustomDatePickerInput name="closesAt" required defaultValue={initialData?.closesAt} />
                </FieldWrapper>

                <FieldWrapper label="Category" icon={Tag}>
                  <CustomSelect
                    name="category"
                    placeholder="Select a category (optional)"
                    options={["IT & Hardware", "Software Services", "Consulting", "Logistics", "Maintenance"]}
                    defaultValue={initialData?.category}
                  />
                </FieldWrapper>

                <div className="space-y-6 flex-1">
                  <FieldWrapper label="Currency">
                    <input name="currency" defaultValue={initialData?.currency || "SAR"} className={inputClass} />
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
          <section className="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-end justify-between border-b border-zinc-100 pb-4">
              <div>
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-blue" />
                    Invite Suppliers
                  </h2>
                  {vendors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedVendors(new Set(vendors.map(v => v.id)))}
                      className="text-xs font-semibold text-brand-blue hover:text-brand-blue/80 transition-colors"
                    >
                      Select All
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  Select pre-approved vendors to participate in this requirement.
                </p>
              </div>
              <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-3 py-1 rounded-full">
                {selectedVendors.size} Selected
              </span>
            </div>

            {vendors.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                No active suppliers available to invite. Please approve some vendor registrations first.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {vendors.map((v) => {
                  const isSelected = selectedVendors.has(v.id);
                  return (
                    <div
                      key={v.id}
                      onClick={() => toggleVendor(v.id)}
                      className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 ${isSelected
                        ? "border-brand-blue bg-blue-50/30 shadow-[0_0_0_1px_rgba(0,111,238,1)]"
                        : "border-zinc-200 bg-white hover:border-brand-blue/50 hover:bg-zinc-50/50"
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? "text-brand-blue" : "text-zinc-900"}`}>
                            {v.label.split(' (')[0]}
                          </p>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {v.label.includes('(') ? v.label.split('(')[1].replace(')', '') : v.label}
                          </p>
                        </div>
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${isSelected
                          ? "border-brand-blue bg-brand-blue text-white"
                          : "border-zinc-300 bg-white"
                          }`}>
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
