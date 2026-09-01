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
      <div className="rounded-3xl bg-white p-12 text-center shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]">
        <p className="text-lg font-bold text-zinc-950">Requirement Not Available</p>
        <p className="mt-1 text-sm text-zinc-400">This tender was not found or has been restricted.</p>
        <div className="mt-6">
          <Link
            href="/requirements"
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-blue px-6 py-3 text-xs font-bold text-white shadow-[0_4px_16px_rgba(0,115,188,0.25)] hover:opacity-90 transition-all"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all tenders
          </Link>
        </div>
      </div>
    );
  }

  const closed = new Date(detail.closesAt).getTime() <= Date.now() || detail.status !== "OPEN";
  const deadline = describeDeadline(detail.closesAt);

  return (
    <div className="space-y-8">
      {/* Top Navigation & Breadcrumb Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <BackButton label="Back to requirements" />
          {detail.referenceNumber && (
            <span className="font-mono rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700">
              {detail.referenceNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {closed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-bold text-zinc-700">
              <Clock className="h-3.5 w-3.5" /> Sourcing Closed
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-blue/10 px-4 py-1.5 text-xs font-bold text-brand-blue">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-blue opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-blue"></span>
              </span>
              Live Sourcing Open
            </span>
          )}
        </div>
      </div>

      {/* Main Requirement Title */}
      <div className="pb-1">
        <h1 className="text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
          {detail.project}
        </h1>
      </div>

      {/* Sourcing Outcome Status Alerts (Awarded / Evaluating) */}
      {closed && (
        <div className="space-y-4">
          {detail.isAwardedToMe || detail.endedStatus === "WON" ? (
            <div className="flex items-center gap-5 rounded-3xl bg-gradient-to-r from-brand-blue/15 via-brand-blue/10 to-white p-7 text-zinc-950 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white font-black text-2xl shadow-md">
                🏆
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-zinc-950">Congratulations! Tender Awarded to You</h2>
                <p className="mt-1 text-xs font-medium text-zinc-600">
                  RVCC Procurement has officially selected and awarded your commercial bid for this project.
                </p>
              </div>
            </div>
          ) : detail.endedStatus === "UNDER_EVALUATION" ? (
            <div className="flex items-center gap-5 rounded-3xl bg-zinc-50 p-7 text-zinc-950 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white font-black text-2xl shadow-md">
                ⏳
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-zinc-950">Sourcing Concluded · Under Commercial Evaluation</h2>
                <p className="mt-1 text-xs font-medium text-zinc-600">
                  The bidding window has closed. Procurement committees are currently reviewing all submitted proposals.
                </p>
              </div>
            </div>
          ) : (
            <div
              suppressHydrationWarning
              className="rounded-3xl bg-zinc-50 p-6 text-xs font-semibold text-zinc-600 shadow-[0_2px_12px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)]"
            >
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

