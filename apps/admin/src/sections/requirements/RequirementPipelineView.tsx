"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, Trophy } from "lucide-react";

import { BidCountdown } from "@/components/ui/bid-countdown";
import { Modal, SubmitLoader } from "@/components/ui";
import {
  composeRiyadhIso,
  riyadhWindowDuration,
  splitRiyadhParts,
} from "@/lib/riyadh-datetime";
import { formatMoney, statusBadgeClass, statusLabel } from "@/lib/rfq/status";

type TabId =
  | "overview"
  | "quotations"
  | "bidding"
  | "comparison"
  | "documents"
  | "evaluation"
  | "shortlist"
  | "activity";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "quotations", label: "Supplier Quotations" },
  { id: "bidding", label: "Bidding" },
  { id: "comparison", label: "Comparison" },
  { id: "documents", label: "Documents" },
  { id: "evaluation", label: "Evaluation" },
  { id: "shortlist", label: "Shortlist" },
  { id: "activity", label: "Activity Log" },
];

type PipelinePayload = {
  requirement: Record<string, any>;
  quotes: any[];
  invites: any[];
  manualQuotations: any[];
  quotationStats: { count: number; lowest: number | null; highest: number | null; average: number | null };
};

export function RequirementPipelineView({ data }: { data: PipelinePayload }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    vendorUserId: "",
    supplierName: "",
    email: "",
    phone: "",
    contactPerson: "",
    unitPrice: "",
    quantity: "1",
    vatRate: "0",
    source: "WHATSAPP",
    remarks: "",
  });
  const [quoteFile, setQuoteFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [vendorOptions, setVendorOptions] = useState<{ id: string; label: string; email: string }[]>([]);
  const [targetPrice, setTargetPrice] = useState(data.requirement.targetPrice || "");
  const openParts = splitRiyadhParts(data.requirement.opensAt);
  const closeParts = splitRiyadhParts(data.requirement.closesAt);
  const [openDate, setOpenDate] = useState(openParts.date);
  const [openTime, setOpenTime] = useState(openParts.time);
  const [closeDate, setCloseDate] = useState(closeParts.date);
  const [closeTime, setCloseTime] = useState(closeParts.time);
  const [revealTargetPrice, setRevealTargetPrice] = useState(data.requirement.revealTargetPrice !== false);
  const [awardTarget, setAwardTarget] = useState<any | null>(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/vendors")
      .then((res) => res.json())
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : [];
        setVendorOptions(
          list
            .filter((v: any) => v.isActive)
            .map((v: any) => ({
              id: v.id,
              label: v.companyName ? `${v.companyName} (${v.email})` : v.email,
              email: v.email || "",
            }))
        );
      })
      .catch(() => setVendorOptions([]));
  }, []);

  const req = data.requirement;
  const currency = req.currency || "SAR";

  async function post(path: string, body?: unknown) {
    setBusy(path);
    setError(null);
    try {
      const res = await fetch(`/api/requirements/${req.id}/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : "{}",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Action failed.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Could not reach the server.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function uploadMultipart(path: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/requirements/${req.id}/${path}`, { method: "POST", body: form });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Upload failed.");
  }

  function fileHref(attachment: { downloadPath?: string; url?: string; fileUrl?: string }) {
    const href = attachment.downloadPath || attachment.url || attachment.fileUrl || "";
    if (!href || href === "#") return "";
    return href;
  }

  function FileLink({
    attachment,
    children,
  }: {
    attachment: { downloadPath?: string; url?: string; fileUrl?: string; fileName?: string; name?: string };
    children: ReactNode;
  }) {
    const href = fileHref(attachment);
    if (!href) return <span className="text-zinc-500">{children}</span>;
    return (
      <a className="text-brand-blue underline" href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }

  const submittedQuotes = useMemo(
    () => data.quotes.filter((q) => q.status === "SUBMITTED"),
    [data.quotes]
  );
  const shortlisted = submittedQuotes.filter((q) => q.evaluationStatus === "SHORTLISTED");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-none items-center justify-between bg-white px-6 pt-4 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/requirements"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900">{req.title || req.project}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(req.status)}`}>
                {statusLabel(req.status, req.closesAt, req.opensAt)}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{req.referenceNumber || req.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {req.status === "DRAFT" && (
            <button className={btnClass} onClick={() => post("collect-quotations")} disabled={!!busy}>
              Start quotation collection
            </button>
          )}
          {(req.status === "DRAFT" || req.status === "QUOTATION_COLLECTION") && (
            <button className={btnClass} onClick={() => post("submit")} disabled={!!busy}>
              Submit to Admin
            </button>
          )}
          {(req.status === "SUBMITTED_TO_ADMIN" || req.status === "PENDING") && (
            <button className={primaryBtn} onClick={() => setOpenConfirm(true)} disabled={!!busy}>
              Open bidding
            </button>
          )}
          {req.status === "OPEN" && (
            <button className={btnClass} onClick={() => post("close")} disabled={!!busy}>
              Close bidding
            </button>
          )}
          {req.status === "BIDDING_CLOSED" && (
            <button className={btnClass} onClick={() => post("evaluate")} disabled={!!busy}>
              Start evaluation
            </button>
          )}
        </div>
      </div>

      {error && <p className="mx-6 mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</p>}

      <div className="flex gap-2 overflow-x-auto border-b border-zinc-200 px-6">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`border-b-2 px-3 py-2 text-sm font-semibold whitespace-nowrap ${
              tab === item.id ? "border-brand-blue text-brand-blue" : "border-transparent text-zinc-500"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        {tab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card title="Requirement">
                <Row label="Product / service" value={req.productServiceName || req.title} />
                <Row label="Category" value={req.category} />
                <Row label="Description" value={req.description || req.scopeOfWork} />
                <Row label="Specifications" value={req.specifications || "—"} />
                <Row label="Quantity" value={`${req.quantity} ${req.unit}`} />
                <Row label="Delivery location" value={req.deliveryLocation || "—"} />
                <Row label="Department" value={req.requestingDepartment || "—"} />
                <Row label="Priority" value={req.priority} />
              </Card>
            </div>
            <div className="space-y-4">
              <BidCountdown closesAt={req.closesAt} opensAt={req.opensAt} status={req.status} />
              <Card title="Confidential target">
                <p className="text-2xl font-bold tabular-nums text-zinc-900">
                  {req.targetPrice ? formatMoney(req.targetPrice, currency) : "Not set"}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {req.revealTargetPrice
                    ? "Shown to invited vendors during this negotiation."
                    : "Hidden from vendors until you enable reveal on the Bidding tab."}
                </p>
              </Card>
              <Card title="Quotation snapshot">
                <Row label="Count" value={String(data.quotationStats?.count ?? 0)} />
                <Row label="Lowest" value={formatMoney(data.quotationStats?.lowest, currency)} />
                <Row label="Highest" value={formatMoney(data.quotationStats?.highest, currency)} />
                <Row label="Average" value={formatMoney(data.quotationStats?.average, currency)} />
              </Card>
            </div>
          </div>
        )}

        {tab === "quotations" && (
          <div className="space-y-4">
            {(req.status === "DRAFT" || req.status === "QUOTATION_COLLECTION") && (
              <Card title="Capture supplier quotation">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <select
                    className={inputClass}
                    value={quoteForm.vendorUserId}
                    onChange={(e) => {
                      const vendor = vendorOptions.find((v) => v.id === e.target.value);
                      setQuoteForm({
                        ...quoteForm,
                        vendorUserId: e.target.value,
                        supplierName: vendor?.label.split(" (")[0] || quoteForm.supplierName,
                        email: vendor?.email || quoteForm.email,
                      });
                    }}
                  >
                    <option value="">Select registered supplier</option>
                    {vendorOptions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                  <input className={inputClass} placeholder="Supplier name" value={quoteForm.supplierName} onChange={(e) => setQuoteForm({ ...quoteForm, supplierName: e.target.value })} />
                  <input className={inputClass} placeholder="Contact person" value={quoteForm.contactPerson} onChange={(e) => setQuoteForm({ ...quoteForm, contactPerson: e.target.value })} />
                  <input className={inputClass} placeholder="Phone" value={quoteForm.phone} onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })} />
                  <input className={inputClass} placeholder="Email" value={quoteForm.email} onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })} />
                  <input className={inputClass} placeholder="Unit price" value={quoteForm.unitPrice} onChange={(e) => setQuoteForm({ ...quoteForm, unitPrice: e.target.value })} />
                  <input className={inputClass} placeholder="Quantity" value={quoteForm.quantity} onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })} />
                  <input className={inputClass} placeholder="VAT %" value={quoteForm.vatRate} onChange={(e) => setQuoteForm({ ...quoteForm, vatRate: e.target.value })} />
                  <select className={inputClass} value={quoteForm.source} onChange={(e) => setQuoteForm({ ...quoteForm, source: e.target.value })}>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="PHYSICAL">Physical</option>
                    <option value="PHONE">Phone</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input className={`${inputClass} sm:col-span-2`} placeholder="Remarks" value={quoteForm.remarks} onChange={(e) => setQuoteForm({ ...quoteForm, remarks: e.target.value })} />
                  <input
                    className={inputClass}
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => setQuoteFile(e.target.files?.[0] || null)}
                  />
                </div>
                <button
                  className={`${primaryBtn} mt-3`}
                  disabled={!!busy || !quoteForm.vendorUserId}
                  onClick={async () => {
                    setBusy("manual-quotes");
                    setError(null);
                    try {
                      const res = await fetch(`/api/requirements/${req.id}/manual-quotes`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          ...quoteForm,
                          unitPrice: Number(quoteForm.unitPrice),
                          quantity: Number(quoteForm.quantity || 1),
                          vatRate: Number(quoteForm.vatRate || 0),
                        }),
                      });
                      const json = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setError(json.error || "Could not save quotation.");
                        return;
                      }
                      if (quoteFile && json.quotation?.id) {
                        await uploadMultipart(`manual-quotes/${json.quotation.id}/attachments`, quoteFile);
                        setQuoteFile(null);
                      }
                      router.refresh();
                    } catch (err: any) {
                      setError(err.message || "Could not reach the server.");
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {busy ? <SubmitLoader /> : "Add quotation"}
                </button>
              </Card>
            )}
            <Card title="Collected quotations">
              {data.manualQuotations?.length ? (
                <table className="w-full text-sm">
                  <thead className="bg-brand-blue text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Supplier</th>
                      <th className="px-3 py-2 text-left">Linked vendor</th>
                      <th className="px-3 py-2 text-left">Source</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-left">File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.manualQuotations.map((q) => (
                      <tr key={q.id} className="border-b border-zinc-100">
                        <td className="px-3 py-2">{q.supplierName}</td>
                        <td className="px-3 py-2">
                          {(req.status === "DRAFT" || req.status === "QUOTATION_COLLECTION") ? (
                            <select
                              className={inputClass}
                              value={q.vendorUserId || ""}
                              onChange={async (e) => {
                                setBusy(`relink-${q.id}`);
                                setError(null);
                                const res = await fetch(`/api/requirements/${req.id}/manual-quotes/${q.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ vendorUserId: e.target.value }),
                                });
                                if (!res.ok) {
                                  const json = await res.json().catch(() => ({}));
                                  setError(json.error || "Could not relink supplier.");
                                } else {
                                  router.refresh();
                                }
                                setBusy(null);
                              }}
                            >
                              {vendorOptions.map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            q.vendorUser?.name || q.vendorUser?.email || "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{q.source}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(q.totalPrice, q.currency)}</td>
                        <td className="px-3 py-2">
                          {q.attachments?.[0] ? (
                            <FileLink attachment={q.attachments[0]}>{q.attachments[0].fileName}</FileLink>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-zinc-500">No offline quotations captured yet.</p>
              )}
            </Card>
          </div>
        )}

        {tab === "bidding" && (
          <div className="space-y-4">
            <BidCountdown closesAt={req.closesAt} opensAt={req.opensAt} status={req.status} />
            {(req.status === "SUBMITTED_TO_ADMIN" || req.status === "PENDING" || req.status === "OPEN") && (
              <Card title="Configure bidding">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Target price</span>
                    <input className={inputClass} placeholder="Target price" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} />
                  </label>
                  <label className="flex items-end gap-2 pb-1">
                    <input
                      type="checkbox"
                      checked={revealTargetPrice}
                      onChange={(e) => setRevealTargetPrice(e.target.checked)}
                    />
                    <span className="text-sm text-zinc-700">Show target price to invited vendors</span>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Opens date (Riyadh)</span>
                    <input className={inputClass} type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Opens time</span>
                    <input className={inputClass} type="time" step="1800" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Closes date (Riyadh)</span>
                    <input className={inputClass} type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">Closes time</span>
                    <input className={inputClass} type="time" step="1800" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
                  </label>
                </div>
                <p className="mt-2 text-xs font-medium text-zinc-500">
                  Window length: {riyadhWindowDuration(openDate, openTime, closeDate, closeTime) || "set both start and end"}
                </p>
                <button
                  className={`${primaryBtn} mt-3`}
                  disabled={!!busy}
                  onClick={() =>
                    post("bid-config", {
                      targetPrice: Number(targetPrice),
                      opensAt: composeRiyadhIso(openDate, openTime),
                      closesAt: composeRiyadhIso(closeDate, closeTime),
                      rankingStrategy: "LOWEST_PRICE",
                      revealTargetPrice,
                    })
                  }
                >
                  Save bidding window
                </button>
              </Card>
            )}
            <Card title="Invited suppliers">
              {data.invites.length ? (
                <ul className="space-y-2 text-sm">
                  {data.invites.map((i) => (
                    <li key={i.id} className="flex justify-between rounded-xl border border-zinc-100 px-3 py-2">
                      <span>{i.name || i.email}</span>
                      <span className="text-xs font-semibold text-zinc-500">{i.inviteStatus || i.emailStatus}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-zinc-500">No suppliers invited yet.</p>
              )}
              <InviteForm requirementId={req.id} onDone={() => router.refresh()} />
            </Card>
            <Card title="Online bids">
              {submittedQuotes.length ? (
                <table className="w-full text-sm">
                  <thead className="bg-brand-blue text-white">
                    <tr>
                      <th className="px-3 py-2 text-left">Supplier</th>
                      <th className="px-3 py-2 text-right">Bid</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedQuotes.map((q) => (
                      <tr key={q.id} className="border-b border-zinc-100">
                        <td className="px-3 py-2">{q.participantName || q.vendorUser?.name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatMoney(q.totalPrice || q.newPrice, currency)}</td>
                        <td className="px-3 py-2">{q.evaluationStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-zinc-500">No online bids submitted yet.</p>
              )}
            </Card>
          </div>
        )}

        {tab === "comparison" && (
          <Card title="Supplier comparison">
            <table className="w-full text-sm">
              <thead className="bg-brand-blue text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Supplier</th>
                  <th className="px-3 py-2 text-right">Original quotation</th>
                  <th className="px-3 py-2 text-right">Bid</th>
                  <th className="px-3 py-2 text-right">Reduction</th>
                </tr>
              </thead>
              <tbody>
                {submittedQuotes.map((q) => {
                  const original = data.manualQuotations.find(
                    (m) => m.vendorUserId && q.vendorUserId && m.vendorUserId === q.vendorUserId
                  );
                  const bid = Number(q.totalPrice || q.newPrice || 0);
                  const originalAmt = Number(original?.totalPrice || 0);
                  const reduction =
                    originalAmt > 0 && bid > 0
                      ? (((originalAmt - bid) / originalAmt) * 100).toFixed(1)
                      : null;
                  return (
                    <tr key={q.id} className="border-b border-zinc-100">
                      <td className="px-3 py-2">{q.participantName || q.vendorUser?.name}</td>
                      <td className="px-3 py-2 text-right">{formatMoney(original?.totalPrice, currency)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatMoney(q.totalPrice || q.newPrice, currency)}</td>
                      <td className="px-3 py-2 text-right">{reduction != null ? `${reduction}%` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "documents" && (
          <Card title="Documents">
            {(req.status === "DRAFT" || req.status === "QUOTATION_COLLECTION" || req.status === "SUBMITTED_TO_ADMIN" || req.status === "PENDING" || req.status === "OPEN") && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <input
                  className={inputClass}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                />
                <button
                  className={primaryBtn}
                  disabled={!docFile || !!busy}
                  onClick={async () => {
                    if (!docFile) return;
                    setBusy("attachments");
                    setError(null);
                    try {
                      await uploadMultipart("attachments", docFile);
                      setDocFile(null);
                      router.refresh();
                    } catch (err: any) {
                      setError(err.message || "Upload failed.");
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  Upload requirement file
                </button>
              </div>
            )}
            <ul className="space-y-2 text-sm">
              {(req.attachments || []).map((a: any) => (
                <li key={a.id}>
                  <FileLink attachment={a}>{a.name || a.fileName}</FileLink>
                </li>
              ))}
              {data.manualQuotations.flatMap((q) =>
                (q.attachments || []).map((a: any) => (
                  <li key={a.id}>
                    <FileLink attachment={a}>
                      {q.supplierName}: {a.fileName}
                    </FileLink>
                  </li>
                ))
              )}
              {data.quotes.flatMap((q) =>
                (q.attachments || []).map((a: any) => (
                  <li key={a.id}>
                    <FileLink attachment={a}>
                      {q.participantName}: {a.fileName}
                    </FileLink>
                  </li>
                ))
              )}
              {!req.attachments?.length && !data.quotes.some((q) => q.attachments?.length) && !data.manualQuotations.some((q) => q.attachments?.length) && (
                <p className="text-zinc-500">No documents uploaded yet.</p>
              )}
            </ul>
          </Card>
        )}

        {tab === "evaluation" && (
          <Card title="Bid evaluation">
            <p className="mb-3 text-xs text-zinc-500">Ranking supports Admin decision-making. It does not award automatically.</p>
            <table className="w-full text-sm">
              <thead className="bg-brand-blue text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Supplier</th>
                  <th className="px-3 py-2 text-right">Bid</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submittedQuotes.map((q) => (
                  <tr key={q.id} className="border-b border-zinc-100">
                    <td className="px-3 py-2">{q.participantName || q.vendorUser?.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatMoney(q.totalPrice || q.newPrice, currency)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {["SHORTLISTED", "REJECTED", "CLARIFICATION", "NEGOTIATION"].map((action) => (
                          <button
                            key={action}
                            className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] font-semibold"
                            onClick={() => post(`quotes/${q.id}/action`, { action, note: "" })}
                          >
                            {action.replace("_", " ")}
                          </button>
                        ))}
                        <button className="rounded-md bg-brand-blue px-2 py-1 text-[11px] font-semibold text-white" onClick={() => setAwardTarget(q)}>
                          Award
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === "shortlist" && (
          <Card title="Shortlisted suppliers">
            {shortlisted.length ? (
              <ul className="space-y-2">
                {shortlisted.map((q) => (
                  <li key={q.id} className="rounded-xl border border-zinc-100 px-4 py-3">
                    <p className="font-semibold">{q.participantName || q.vendorUser?.name}</p>
                    <p className="text-sm text-zinc-500">{formatMoney(q.totalPrice || q.newPrice, currency)}</p>
                    {q.evaluationNote && <p className="mt-1 text-sm">{q.evaluationNote}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">No suppliers shortlisted yet.</p>
            )}
          </Card>
        )}

        {tab === "activity" && <ActivityPanel requirementId={req.id} />}
      </div>

      <Modal open={openConfirm} onClose={() => setOpenConfirm(false)} title="Publish live negotiation" maxWidth="sm">
        <div className="p-6">
          <p className="text-sm text-zinc-700">
            Open bidding for <strong>{req.title || req.project}</strong>? Invited suppliers can bid only between the start and end times.
          </p>
          <ul className="mt-4 space-y-1 text-sm text-zinc-600">
            <li>Target: {formatMoney(targetPrice || req.targetPrice, currency)}</li>
            <li>Opens: {openDate} {openTime} (Riyadh)</li>
            <li>Closes: {closeDate} {closeTime} (Riyadh)</li>
            <li>Duration: {riyadhWindowDuration(openDate, openTime, closeDate, closeTime) || "not set"}</li>
            <li>Target visible to vendors: {revealTargetPrice ? "Yes" : "No"}</li>
          </ul>
          <div className="mt-5 flex justify-end gap-2">
            <button className={btnClass} onClick={() => setOpenConfirm(false)} disabled={!!busy}>Cancel</button>
            <button
              className={primaryBtn}
              disabled={!!busy}
              onClick={async () => {
                const saved = await post("bid-config", {
                  targetPrice: Number(targetPrice),
                  opensAt: composeRiyadhIso(openDate, openTime),
                  closesAt: composeRiyadhIso(closeDate, closeTime),
                  rankingStrategy: "LOWEST_PRICE",
                  revealTargetPrice,
                });
                if (!saved) return;
                const opened = await post("open");
                if (opened) setOpenConfirm(false);
              }}
            >
              {busy === "open" ? "Publishing…" : "Confirm and open"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!awardTarget} onClose={() => setAwardTarget(null)} title="Award Procurement" maxWidth="sm">
        {awardTarget && (
          <div className="p-6">
            <Trophy className="text-brand-blue mx-auto mb-3 h-8 w-8" />
            <p className="text-center text-sm">
              Award to <strong>{awardTarget.participantName || awardTarget.vendorUser?.name}</strong> at{" "}
              <strong>{formatMoney(awardTarget.totalPrice || awardTarget.newPrice, currency)}</strong>
              {req.targetPrice ? ` vs target ${formatMoney(req.targetPrice, currency)}` : ""}.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button className={btnClass} onClick={() => setAwardTarget(null)}>Cancel</button>
              <button
                className={primaryBtn}
                onClick={async () => {
                  setBusy("award");
                  const res = await fetch(`/api/requirements/${req.id}/award`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ quoteId: awardTarget.id }),
                  });
                  if (res.ok) {
                    setAwardTarget(null);
                    router.refresh();
                  } else {
                    const json = await res.json().catch(() => ({}));
                    setError(json.error || "Award failed.");
                  }
                  setBusy(null);
                }}
              >
                Award Procurement
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ActivityPanel({ requirementId }: { requirementId: string }) {
  const [logs, setLogs] = useState<any[] | null>(null);
  useEffect(() => {
    fetch(`/api/requirements/${requirementId}/activity`)
      .then((r) => r.json())
      .then((d) => setLogs(Array.isArray(d) ? d : []))
      .catch(() => setLogs([]));
  }, [requirementId]);

  if (!logs) return <p className="text-sm text-zinc-500">Loading activity…</p>;
  if (!logs.length) return <p className="text-sm text-zinc-500">No activity recorded yet.</p>;
  return (
    <ol className="space-y-3">
      {logs.map((log) => (
        <li key={log.id} className="rounded-2xl border border-zinc-100 px-4 py-3">
          <p className="text-sm font-semibold text-zinc-900">{log.action}</p>
          <p className="text-xs text-zinc-500">
            {log.actorName} · {log.actorRole} · {new Date(log.createdAt).toLocaleString("en-GB")}
          </p>
        </li>
      ))}
    </ol>
  );
}

function InviteForm({ requirementId, onDone }: { requirementId: string; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      <input className={inputClass} placeholder="New supplier name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className={inputClass} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <button
        className={btnClass}
        disabled={busy || !name || !email}
        onClick={async () => {
          setBusy(true);
          await fetch(`/api/requirements/${requirementId}/invites`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newSuppliers: [{ name, email }], sendEmail: true }),
          });
          setName("");
          setEmail("");
          setBusy(false);
          onDone();
        }}
      >
        Invite supplier
      </button>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 text-sm font-bold">{title}</div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col border-b border-zinc-50 py-2 last:border-0 sm:flex-row">
      <dt className="w-40 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">{label}</dt>
      <dd className="text-sm text-zinc-900">{value || "—"}</dd>
    </div>
  );
}

const inputClass =
  "h-10 rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-brand-blue";
const btnClass =
  "rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50";
const primaryBtn =
  "rounded-xl bg-brand-blue px-3 py-2 text-xs font-semibold text-white hover:opacity-95";
