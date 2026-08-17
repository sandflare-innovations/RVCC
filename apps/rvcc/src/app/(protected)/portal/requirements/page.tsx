import { cookies } from "next/headers";
import Link from "next/link";

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

function closesIn(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 24) return `${hours}h left`;
  return `${Math.floor(hours / 24)}d left`;
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
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/portal/requirements/${r.id}`}
                  className="text-base font-semibold text-zinc-950 underline-offset-2 hover:underline"
                >
                  {r.project}
                </Link>
                <span className="text-sm text-zinc-600 tabular-nums">{closesIn(r.closesAt)}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{r.scopeOfWork}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {r.referenceNumber ?? ""}
                {r.quoteStatus === "SUBMITTED"
                  ? " · Submitted"
                  : r.quoteStatus === "DRAFT"
                    ? " · Draft saved"
                    : " · Not quoted yet"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
