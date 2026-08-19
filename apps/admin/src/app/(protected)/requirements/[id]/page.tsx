import { notFound } from "next/navigation";

import { rankQuotes } from "@/lib/rfq";
import { BackButton } from "@/components/ui/back-button";

import { adminSessionJson } from "@/lib/admin-data";
import { AwardButton } from "@/sections/AwardButton";

export const dynamic = "force-dynamic";

function formatDateTime(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Payload = {
  requirement: {
    id: string;
    referenceNumber: string | null;
    scopeOfWork: string;
    project: string;
    sellingPrice: string | number | null;
    currency: string;
    closesAt: string;
    status: string;
    awardedAt: string | null;
    awardedQuoteId: string | null;
    awardedByAdmin: { email: string } | null;
  };
  quotes: Array<{
    id: string;
    newPrice: string | number;
    remarks: string | null;
    status: string;
    submittedAt: string | null;
    vendorUser: { email: string; name: string | null };
  }>;
  invites: Array<{
    id: string;
    emailStatus: string;
    vendorUser: { email: string };
  }>;
};

export default async function RequirementComparisonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await adminSessionJson<Payload>(`/requirements/${encodeURIComponent(id)}`);
  if (!result.ok) {
    if (result.status === 404) notFound();
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
        Could not load requirement ({result.status}).
      </p>
    );
  }

  const { requirement, quotes, invites } = result.data;

  const ranked = rankQuotes(
    quotes
      .filter((q) => q.status === "SUBMITTED")
      .map((q) => ({
      id: q.id,
      newPrice: String(q.newPrice),
      remarks: q.remarks,
      submittedAt: q.submittedAt ? new Date(q.submittedAt) : null,
      who: q.vendorUser.name || q.vendorUser.email,
      vendorEmail: q.vendorUser.email,
      }))
  );
  const drafts = quotes.filter((q) => q.status !== "SUBMITTED");

  const closed = new Date(requirement.closesAt).getTime() <= Date.now();

  return (
    <div className="space-y-6">
      <BackButton label="Back to requirements" />
      <div>
        <p className="font-mono text-xs text-zinc-500 tabular-nums">
          {requirement.referenceNumber ?? "— draft —"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">
          {requirement.project}
        </h1>
        <p className="mt-3 text-sm whitespace-pre-wrap text-zinc-700">{requirement.scopeOfWork}</p>

        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          <div>
            <dt className="text-zinc-500">Closes</dt>
            <dd className="text-zinc-950 tabular-nums">
              {formatDateTime(requirement.closesAt)}
              {closed ? " (closed)" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Selling price</dt>
            <dd className="text-zinc-950 tabular-nums">
              {requirement.sellingPrice != null
                ? `${String(requirement.sellingPrice)} ${requirement.currency}`
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="text-zinc-950">{requirement.status}</dd>
          </div>
        </dl>
      </div>

      {requirement.awardedAt ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
          Awarded on {formatDateTime(requirement.awardedAt)}
          {requirement.awardedByAdmin ? ` by ${requirement.awardedByAdmin.email}` : ""}.
        </p>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-950">Quotes</h2>
        {ranked.length === 0 ? (
          <div className="space-y-3">
            <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
              No submitted quotes yet.
            </p>
            {drafts.length > 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {drafts.length} draft {drafts.length === 1 ? "response is" : "responses are"} saved
                but not submitted yet.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.length > 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {drafts.length} draft {drafts.length === 1 ? "response remains" : "responses remain"}
                unsubmitted and is excluded from ranking.
              </p>
            ) : null}
            <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rank</th>
                  <th className="px-4 py-3 font-semibold">Participant</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Remarks</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Award</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {ranked.map((q) => (
                  <tr key={q.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-4 py-3 font-semibold text-zinc-950 tabular-nums">{q.rank}</td>
                    <td className="px-4 py-3 text-zinc-950">{q.who}</td>
                    <td className="px-4 py-3 font-medium text-zinc-950 tabular-nums">
                      {q.newPrice} {requirement.currency}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{q.remarks || "—"}</td>
                    <td className="px-4 py-3 text-zinc-600 tabular-nums">
                      {q.submittedAt
                        ? formatDateTime(
                            typeof q.submittedAt === "string"
                              ? q.submittedAt
                              : q.submittedAt.toISOString()
                          )
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {requirement.awardedQuoteId === q.id ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          Won
                        </span>
                      ) : requirement.awardedQuoteId ? null : (
                        <AwardButton
                          requirementId={requirement.id}
                          quoteId={q.id}
                          vendorLabel={q.vendorEmail}
                          price={q.newPrice}
                          currency={requirement.currency}
                          project={requirement.project}
                          closesAt={requirement.closesAt}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-zinc-950">Invited</h2>
        <ul className="space-y-1.5 text-sm">
          {invites.map((i) => (
            <li key={i.id} className="flex flex-wrap items-center gap-2 text-zinc-700">
              <span className="text-zinc-950">{i.vendorUser.email}</span>
              <span
                className={
                  i.emailStatus === "FAILED"
                    ? "rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700"
                    : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600"
                }
              >
                {i.emailStatus.toLowerCase()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
