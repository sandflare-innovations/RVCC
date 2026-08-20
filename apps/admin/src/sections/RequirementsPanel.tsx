"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Link from "next/link";

import { RefreshCw } from "lucide-react";

import { fetchTableJson } from "@/lib/table-fetch";
import { readVendorCache, writeVendorCache, type CachedVendorRow } from "@/lib/vendor-cache";
import {
  readRequirementsCache,
  writeRequirementsCache,
  type CachedRequirementRow,
} from "@/lib/requirements-cache";
import { CreateRequirementForm, type ParticipantOption } from "@/sections/CreateRequirementForm";

type RequirementRow = CachedRequirementRow;

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

function statusLabel(status: string, closesAt: string | null) {
  if (status === "OPEN" && closesAt) {
    const date = new Date(closesAt);
    if (!isNaN(date.getTime()) && date.getTime() <= Date.now()) {
      return "Closed";
    }
  }
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function RequirementsPanel() {
  const [allRows, setAllRows] = useState<RequirementRow[]>(() => readRequirementsCache() ?? []);
  const [vendors, setVendors] = useState<CachedVendorRow[]>(() => readVendorCache() ?? []);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(() => !readRequirementsCache());
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  const vendorOptions = useMemo((): ParticipantOption[] => {
    return vendors
      .filter((v) => v.isActive && v.portalAccess === "RELEASED")
      .map((v) => ({
        id: v.id,
        label: v.name ? `${v.name} (${v.email})` : v.email,
      }));
  }, [vendors]);

  const fetchRequirements = useCallback(async (opts?: { background?: boolean }) => {
    const id = ++requestId.current;
    const background = opts?.background ?? false;

    if (!background) setRefreshing(true);
    if (!background && allRows.length === 0) setInitialLoad(true);
    setLoadError(null);

    try {
      const result = await fetchTableJson<RequirementRow>("/api/requirements");

      if (id !== requestId.current) return;

      if (!result.ok) {
        if (allRows.length === 0) setLoadError(result.error);
        return;
      }

      setAllRows(result.data);
      writeRequirementsCache(result.data);
    } catch {
      if (id !== requestId.current) return;
      if (allRows.length === 0) setLoadError("Network error — please try again.");
    } finally {
      if (id === requestId.current) {
        setRefreshing(false);
        setInitialLoad(false);
      }
    }
  }, [allRows.length]);

  const fetchVendors = useCallback(async () => {
    const result = await fetchTableJson<CachedVendorRow>("/api/vendors");
    if (result.ok) {
      setVendors(result.data);
      writeVendorCache(result.data);
    }
  }, []);

  useEffect(() => {
    const cached = readRequirementsCache();
    if (cached?.length) {
      setAllRows(cached);
      setInitialLoad(false);
      void fetchRequirements({ background: true });
    } else {
      void fetchRequirements();
    }

    if (!readVendorCache()?.length) void fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Requirements</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Work put out to quote. Each invited supplier submits a price without seeing anyone
            else&apos;s.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchRequirements()}
          disabled={refreshing}
          title="Refresh table data"
          aria-label="Refresh requirements table"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      <CreateRequirementForm
        vendors={vendorOptions}
        onCreated={() => void fetchRequirements({ background: true })}
      />

      <div
        className={`overflow-x-auto rounded-lg border border-zinc-200 bg-white transition-opacity duration-150 ${refreshing ? "opacity-70" : "opacity-100"}`}
        aria-busy={refreshing || initialLoad}
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs tracking-wide text-zinc-600 uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Reference</th>
              <th className="px-4 py-3 font-semibold">Project</th>
              <th className="px-4 py-3 font-semibold">Closes</th>
              <th className="px-4 py-3 font-semibold">Invited</th>
              <th className="px-4 py-3 font-semibold">Quotes</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {initialLoad && allRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Loading requirements…
                </td>
              </tr>
            )}
            {loadError && allRows.length === 0 && !initialLoad && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  {loadError}
                </td>
              </tr>
            )}
            {!loadError && !initialLoad && allRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  Nothing posted yet.
                </td>
              </tr>
            )}
            {allRows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/requirements/${r.id}`}
                    className="hover:text-brand-blue font-mono text-xs tabular-nums underline-offset-2 hover:underline"
                  >
                    {r.referenceNumber ?? "— draft —"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-950">{r.project}</td>
                <td className="px-4 py-3 text-zinc-600 tabular-nums">
                  {formatDateTime(r.closesAt)}
                </td>
                <td className="px-4 py-3 text-zinc-700 tabular-nums">{r.invited}</td>
                <td className="px-4 py-3 text-zinc-700 tabular-nums">{r.submitted}</td>
                <td className="px-4 py-3 text-zinc-700">{statusLabel(r.status, r.closesAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function RequirementsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-zinc-200" />
        <div className="h-4 w-full max-w-xl rounded bg-zinc-100" />
      </div>
      <div className="h-10 w-40 rounded bg-zinc-100" />
      <div className="h-64 rounded-lg border border-zinc-200 bg-white" />
    </div>
  );
}
