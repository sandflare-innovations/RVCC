import { cookies } from "next/headers";
import Link from "next/link";

import { describeDeadline } from "@repo/rfq";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorApiFetch } from "@/lib/vendor-api";

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
    const res = await vendorApiFetch("/requirements", { method: "GET", sessionToken: token });
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
                    href={`/portal/requirements/${row.id}`}
                    className="bg-brand-blue focus-visible:ring-brand-blue mt-3 inline-flex min-h-11 items-center rounded-md px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {row.quoteStatus === "SUBMITTED" ? "View quote" : "Open"}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">Project</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Your quote</th>
                  <th className="px-4 py-3 font-semibold">Closes</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => {
                  const deadline = describeDeadline(row.closesAt);
                  return (
                    <tr key={row.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-zinc-950">{row.project}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">
                          {row.scopeOfWork}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-zinc-600 tabular-nums">
                        {row.referenceNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{quoteLabel(row.quoteStatus)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        <span
                          className={
                            deadline.urgent ? "font-semibold text-zinc-950" : "text-zinc-700"
                          }
                        >
                          {deadline.urgent ? `Closing soon, ${deadline.label}` : deadline.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/portal/requirements/${row.id}`}
                          className="focus-visible:ring-brand-blue inline-flex min-h-11 items-center rounded-md border border-zinc-300 bg-white px-4 font-semibold text-zinc-700 transition-colors hover:border-zinc-400 focus-visible:ring-2 focus-visible:outline-none"
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
