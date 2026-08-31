import { cookies } from "next/headers";

import { BackButton } from "@/components/ui/back-button";
import { VENDOR_COOKIE } from "@/lib/constants";
import { describeDeadline } from "@/lib/rfq";
import { vendorWorkerFetch } from "@/lib/vendor-api";
import { type QuoteFormRequirement } from "@/sections/requirements/QuoteForm";
import { VendorRequirementInteractive } from "@/sections/requirements/VendorRequirementInteractive";

export const dynamic = "force-dynamic";

type Detail = QuoteFormRequirement & { status: string };

export default async function RequirementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;

  let detail: Detail | null = null;
  try {
    const res = await vendorWorkerFetch(`/requirements/${encodeURIComponent(id)}`, {
      method: "GET",
      sessionToken: token,
    });
    if (res.ok) {
      const data = await res.json();
      detail = (data?.requirement ?? data) as Detail;
    }
  } catch (err) {
    console.error("[vendor] requirement fetch failed", err);
  }

  if (!detail) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        This requirement is not available to you.
      </p>
    );
  }

  const closed = new Date(detail.closesAt).getTime() <= Date.now() || detail.status !== "OPEN";
  const deadline = describeDeadline(detail.closesAt);
  const submitted = detail.quoteStatus === "SUBMITTED";
  const quoteState = submitted
    ? "Submitted"
    : detail.quoteStatus === "DRAFT"
      ? "Draft saved, not submitted"
      : "Not started";

  return (
    <div className="space-y-6">
      <BackButton label="Back to requirements" />
      <div>
        <p className="font-mono text-xs text-zinc-500 tabular-nums">{detail.referenceNumber}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
          {detail.project}
        </h1>
        <p className="mt-3 text-sm whitespace-pre-wrap text-zinc-700">{detail.scopeOfWork}</p>
      </div>

      <div
        className={`rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm ${
          deadline.urgent && !submitted && !closed ? "border-l-brand-blue border-l-4" : ""
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">
              {closed ? "Closed" : "Closes"}
            </p>
            <p className="mt-1 text-lg font-bold text-zinc-950 tabular-nums">
              {closed ? "This requirement has closed" : deadline.label}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-semibold tracking-[0.12em] text-zinc-600 uppercase">
              Your Quote Status
            </p>
            <p className="mt-1 text-sm font-bold text-zinc-950">{quoteState}</p>
          </div>
        </div>
        {deadline.urgent && !submitted && !closed ? (
          <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-sm font-semibold text-amber-700">
            Closing soon. Submit your price before the deadline.
          </p>
        ) : null}
      </div>

      {closed && (
        <p className="rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm text-zinc-600">
          This requirement closed on{" "}
          {new Date(detail.closesAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </p>
      )}

      {/* Live Bidding & Interactive Quote Form */}
      <VendorRequirementInteractive
        requirement={detail}
        action={`/api/requirements/${detail.id}/quote`}
        closed={closed}
      />
    </div>
  );
}
