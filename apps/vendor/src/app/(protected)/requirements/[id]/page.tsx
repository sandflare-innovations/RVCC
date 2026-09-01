import { cookies } from "next/headers";
import { ArrowLeft, Clock, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

import { BackButton } from "@/components/ui/back-button";
import { VENDOR_COOKIE } from "@/lib/constants";
import { describeDeadline } from "@/lib/rfq";
import { vendorWorkerFetch } from "@/lib/vendor-api";
import { type VendorRequirementDetail, VendorRequirementInteractive } from "@/sections/requirements/VendorRequirementInteractive";

export const dynamic = "force-dynamic";

export default async function RequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;

  let detail: VendorRequirementDetail | null = null;
  try {
    const res = await vendorWorkerFetch(`/requirements/${encodeURIComponent(id)}`, {
      method: "GET",
      sessionToken: token,
    });
    if (res.ok) {
      const data = await res.json();
      detail = (data?.requirement ?? data) as VendorRequirementDetail;
    }
  } catch (err) {
    console.error("[vendor] requirement fetch failed", err);
  }

  if (!detail) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-xs">
        <p className="text-base font-bold text-zinc-900">Requirement Not Available</p>
        <p className="mt-1 text-sm text-zinc-500">This tender was not found or is restricted.</p>
        <div className="mt-5">
          <Link
            href="/requirements"
            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-blue px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to all tenders
          </Link>
        </div>
      </div>
    );
  }

  const closed = new Date(detail.closesAt).getTime() <= Date.now() || detail.status !== "OPEN";
  const deadline = describeDeadline(detail.closesAt);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton label="Back to requirements" />
          {detail.referenceNumber && (
            <span className="font-mono rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-bold text-zinc-600">
              {detail.referenceNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {closed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700">
              <Clock className="h-3.5 w-3.5" /> Sourcing Closed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Live Sourcing Open
            </span>
          )}
        </div>
      </div>

      {/* Main Requirement Title & Header Info */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
          {detail.project}
        </h1>
      </div>

      {/* Sourcing Outcome Status Alerts (Awarded / Evaluating) */}
      {closed && (
        <div className="space-y-3">
          {detail.isAwardedToMe || detail.endedStatus === "WON" ? (
            <div className="flex items-center gap-4 rounded-3xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 p-6 text-emerald-950 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black text-2xl shadow-sm">
                🏆
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Congratulations! Tender Awarded to You</h2>
                <p className="mt-0.5 text-xs text-emerald-800">
                  RVCC Procurement has officially selected and awarded your commercial bid for this project.
                </p>
              </div>
            </div>
          ) : detail.endedStatus === "UNDER_EVALUATION" ? (
            <div className="flex items-center gap-4 rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50/60 p-6 text-amber-950 shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white font-black text-2xl shadow-sm">
                ⏳
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">Sourcing Concluded · Under Commercial Evaluation</h2>
                <p className="mt-0.5 text-xs text-amber-800">
                  The bidding window has closed. Procurement committees are currently reviewing all submitted proposals.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/90 px-5 py-4 text-xs font-semibold text-zinc-600">
              This requirement concluded on{" "}
              {new Date(detail.closesAt).toLocaleString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              .
            </div>
          )}
        </div>
      )}

      {/* Grid-Based Interactive Procurement Workspace */}
      <VendorRequirementInteractive
        requirement={detail}
        action={`/api/requirements/${detail.id}/quote`}
        closed={closed}
      />
    </div>
  );
}
