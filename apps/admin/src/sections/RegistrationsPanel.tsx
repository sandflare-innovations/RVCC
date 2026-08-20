"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { RefreshCw } from "lucide-react";

import { StatusBadge } from "@/lib/ui";
import { fetchTableJson } from "@/lib/table-fetch";
import {
  readRegistrationCache,
  writeRegistrationCache,
  type CachedRegistrationRow,
} from "@/lib/registration-cache";
import {
  REGISTRATION_FILTERS,
  filterRegistrationRows,
  parseRegistrationFilter,
  parseRegistrationSearch,
  type RegistrationFilterValue,
} from "@/lib/registration-filters";
import {
  RegistrationRowActions,
  type RegistrationSummary,
} from "@/sections/RegistrationRowActions";

type RegistrationRow = CachedRegistrationRow;

function formatDate(d: string | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function syncUrl(status: RegistrationFilterValue, search: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("status", status);
  if (search) url.searchParams.set("q", search);
  else url.searchParams.delete("q");
  window.history.replaceState(null, "", url);
}

function toSummary(r: RegistrationRow): RegistrationSummary {
  return {
    id: r.id,
    email: r.email,
    status: r.status,
    referenceNumber: r.referenceNumber,
    companyName: r.company?.legalName ?? null,
  };
}

export function RegistrationsPanel({ canDelete }: { canDelete: boolean }) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<RegistrationFilterValue>(() =>
    parseRegistrationFilter(searchParams.get("status"))
  );
  const [search, setSearch] = useState(() => parseRegistrationSearch(searchParams.get("q")));
  const [allRows, setAllRows] = useState<RegistrationRow[]>(() => readRegistrationCache() ?? []);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(() => !readRegistrationCache());
  const [refreshing, setRefreshing] = useState(false);
  const [, startTransition] = useTransition();
  const requestId = useRef(0);

  const displayed = useMemo(
    () => filterRegistrationRows(allRows, filter, search),
    [allRows, filter, search]
  );

  const fetchAll = useCallback(async (opts?: { background?: boolean }) => {
    const id = ++requestId.current;
    const background = opts?.background ?? false;

    if (!background) setRefreshing(true);
    if (!background && allRows.length === 0) setInitialLoad(true);
    setLoadError(null);

    try {
      const result = await fetchTableJson<RegistrationRow>("/api/registrations");

      if (id !== requestId.current) return;

      if (!result.ok) {
        if (allRows.length === 0) setLoadError(result.error);
        return;
      }

      setAllRows(result.data);
      writeRegistrationCache(result.data);
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

  useEffect(() => {
    const cached = readRegistrationCache();
    if (cached?.length) {
      setAllRows(cached);
      setInitialLoad(false);
      void fetchAll({ background: true });
    } else {
      void fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const applyFilter = (next: RegistrationFilterValue) => {
    if (next === filter) return;
    startTransition(() => {
      setFilter(next);
      syncUrl(next, search);
    });
  };

  const onSearchChange = (value: string) => {
    const next = parseRegistrationSearch(value);
    setSearch(next);
    syncUrl(filter, next);
  };

  const updateTable = useCallback(() => {
    void fetchAll({ background: true });
  }, [fetchAll]);

  const removeRow = useCallback((id: string) => {
    setAllRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      writeRegistrationCache(next);
      return next;
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            Vendor Registrations
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Review and approve prospective supplier applications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAll()}
          disabled={refreshing}
          title="Refresh table data"
          aria-label="Refresh registrations table"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Registration filters">
          {REGISTRATION_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={f.value === filter}
              onClick={() => applyFilter(f.value)}
              className={
                f.value === filter
                  ? "bg-brand-blue rounded-md px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <input
            name="q"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company, email, reference…"
            aria-label="Search registrations"
            maxLength={120}
            className="focus-visible:border-brand-blue focus-visible:ring-brand-blue/25 w-72 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none focus-visible:ring-[3px]"
          />
        </div>
      </div>

      <div
        className={`overflow-hidden rounded-lg border border-zinc-200 bg-white transition-opacity duration-150 ${refreshing ? "opacity-70" : "opacity-100"}`}
        aria-busy={refreshing || initialLoad}
      >
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr className="text-xs font-semibold tracking-[0.08em] text-zinc-600 uppercase">
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Contact email</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {initialLoad && displayed.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-600">
                  Loading registrations…
                </td>
              </tr>
            )}
            {loadError && displayed.length === 0 && !initialLoad && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-600">
                  {loadError}
                </td>
              </tr>
            )}
            {!loadError && !initialLoad && displayed.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-600">
                  {`No registrations${search ? ` matching “${search}”` : ""} in this view.`}
                </td>
              </tr>
            )}
            {displayed.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/registrations/${r.id}`}
                    className="hover:text-brand-blue font-medium text-zinc-950 underline-offset-2 hover:underline"
                  >
                    {r.company?.legalName || <span className="text-zinc-500">Unnamed</span>}
                  </Link>
                  {r.company?.country ? (
                    <p className="text-xs text-zinc-500">{r.company.country}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-zinc-700">{r.email}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-600 tabular-nums">
                  {r.referenceNumber || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 tabular-nums">
                  {formatDate(r.submittedAt)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3">
                  <RegistrationRowActions
                    registration={toSummary(r)}
                    canDelete={canDelete}
                    onDeleted={() => removeRow(r.id)}
                    onUpdated={updateTable}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayed.length === 500 && (
        <p className="text-xs text-zinc-500">
          Showing the first 500 results — narrow the search to see more.
        </p>
      )}
    </div>
  );
}

export function RegistrationsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded bg-zinc-200" />
        <div className="h-4 w-full max-w-xl rounded bg-zinc-100" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 w-28 rounded bg-zinc-100" />
        ))}
      </div>
      <div className="h-64 rounded-lg border border-zinc-200 bg-white" />
    </div>
  );
}
