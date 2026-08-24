import { cookies } from "next/headers";
import Link from "next/link";

import { describeDeadline } from "@/lib/rfq";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  referenceNumber: string | null;
  project: string;
  scopeOfWork: string;
  closesAt: string;
  quoteStatus: "DRAFT" | "SUBMITTED" | null;
};

function quoteLabel(status: Row["quoteStatus"]) {
  if (status === "SUBMITTED") return "Submitted";
  if (status === "DRAFT") return "Draft saved";
  return "Not quoted yet";
}

export default async function RequirementsPage() {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;

  let rows: Row[] = [];
  try {
    const res = await vendorWorkerFetch("/requirements", { method: "GET", sessionToken: token });
    if (res.ok) rows = (await res.json()) as Row[];
  } catch (err) {
    console.error("[vendor] requirements list failed", err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Requirements</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Work you have been invited to quote on. Your price is visible only to RVCC.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
          You have no open requirements at the moment. You will be emailed when RVCC invites you to
          quote.
        </p>
      ) : (
        <>
          <ul className="space-y-3 lg:hidden">
            {rows.map((row) => {
              const deadline = describeDeadline(row.closesAt);
              return (
                <li
                  key={row.id}
                  className={`rounded-lg border border-zinc-200 bg-white p-4 ${
                    deadline.urgent ? "border-l-brand-blue border-l-4" : ""
                  }`}
                >
                  <p className="text-base font-semibold text-zinc-950">{row.project}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{row.scopeOfWork}</p>
                  <p className="mt-2 text-xs text-zinc-600">
                    {row.referenceNumber ?? "No reference"} · {quoteLabel(row.quoteStatus)} ·{" "}
                    {deadline.label}
                  </p>
                  <Link
                    href={`/requirements/${row.id}`}
                    className="bg-brand-blue focus-visible:ring-brand-blue mt-3 inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {row.quoteStatus === "SUBMITTED" ? "View quote" : "Open"}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto rounded-3xl border border-zinc-100/80 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] lg:block">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-brand-blue text-white">
                  <th className="px-6 py-3.5 font-semibold rounded-l-2xl">Project</th>
                  <th className="px-6 py-3.5 font-semibold">Reference</th>
                  <th className="px-6 py-3.5 font-semibold">Your quote</th>
                  <th className="px-6 py-3.5 font-semibold">Closes</th>
                  <th className="px-6 py-3.5 font-semibold rounded-r-2xl">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const deadline = describeDeadline(row.closesAt);
                  return (
                    <tr key={row.id} className="bg-white ring-1 ring-inset ring-zinc-100 rounded-2xl transition-all hover:ring-brand-blue/40 hover:shadow-[0_8px_24px_-16px_rgba(0,115,188,0.45)] group">
                      <td className="px-6 py-4 rounded-l-2xl">
                        <p className="font-medium text-zinc-950">{row.project}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                          {row.scopeOfWork}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-600 tabular-nums">
                        {row.referenceNumber ?? "—"}
                      </td>
                      <td className="px-6 py-4 text-zinc-700">{quoteLabel(row.quoteStatus)}</td>
                      <td className="px-6 py-4 tabular-nums">
                        <span
                          className={
                            deadline.urgent ? "font-semibold text-zinc-950" : "text-zinc-700"
                          }
                        >
                          {deadline.urgent ? `Closing soon, ${deadline.label}` : deadline.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right rounded-r-2xl">
                        <Link
                          href={`/requirements/${row.id}`}
                          className="focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-full border border-brand-blue/20 bg-white px-4 font-semibold text-brand-blue transition-colors hover:bg-brand-blue/5 focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {row.quoteStatus === "SUBMITTED" ? "View" : "Open"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
