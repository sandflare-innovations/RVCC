import { cookies } from "next/headers";

import { QuoteForm, type QuoteFormRequirement } from "@/lib/rfq/quote-form";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

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
    if (res.ok) detail = (await res.json()) as Detail;
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

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs text-zinc-500 tabular-nums">{detail.referenceNumber}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
          {detail.project}
        </h1>
        <p className="mt-3 text-sm whitespace-pre-wrap text-zinc-700">{detail.scopeOfWork}</p>
      </div>

      {closed ? (
        // Not a 404: a closed requirement is a normal outcome, and a missing
        // page reads as a broken system.
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          This requirement closed on{" "}
          {new Date(detail.closesAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
          .
        </p>
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <QuoteForm requirement={detail} action={`/api/requirements/${detail.id}/quote`} />
        </div>
      )}
    </div>
  );
}
