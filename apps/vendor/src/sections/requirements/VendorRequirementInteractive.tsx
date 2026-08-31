"use client";

import { useVendorLiveBidding } from "@/hooks/use-vendor-live-bidding";

import { LiveBiddingCockpit } from "./LiveBiddingCockpit";
import { QuoteForm, type QuoteFormRequirement } from "./QuoteForm";

export function VendorRequirementInteractive({
  requirement,
  action,
  closed,
}: {
  requirement: QuoteFormRequirement;
  action: string;
  closed: boolean;
}) {
  const { data, status, refresh } = useVendorLiveBidding(requirement.id);

  return (
    <div className="space-y-6">
      {/* Live Ranking Engine Cockpit */}
      <LiveBiddingCockpit data={data} status={status} currency={requirement.currency} />

      {/* Quote Submission & Revision Form */}
      {!closed && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 border-b border-zinc-100 pb-4">
            <h3 className="text-base font-bold text-zinc-950">
              {data?.myStatus === "SUBMITTED" ? "Manage Your Bid" : "Submit Your Proposal"}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Prices are evaluated in real time. Lowest offer leads the ranking.
            </p>
          </div>

          <QuoteForm requirement={requirement} action={action} onSubmitted={refresh} />
        </div>
      )}
    </div>
  );
}
