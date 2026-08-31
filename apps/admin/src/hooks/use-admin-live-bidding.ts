"use client";

import type { AdminLiveBidsPayload } from "@rvcc/types";
import { useCallback, useEffect, useRef,useState } from "react";

/**
 * Polls the live-bids proxy endpoint every few seconds.
 * SSE/EventSource is NOT used because Next.js route handlers cannot reliably
 * proxy a long-lived upstream SSE stream — the fetch call is cancelled or times out,
 * producing a "Failed to fetch" console error.
 */
export function useAdminLiveBidding(
  requirementId: string,
  initialData?: AdminLiveBidsPayload | null
) {
  const [data, setData] = useState<AdminLiveBidsPayload | null>(initialData ?? null);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dataRef = useRef<AdminLiveBidsPayload | null>(initialData ?? null);
  const unmountedRef = useRef(false);

  dataRef.current = data;

  const updateDataIfChanged = useCallback((next: AdminLiveBidsPayload) => {
    const prev = dataRef.current;
    if (
      !prev ||
      prev.totalQuotes !== next.totalQuotes ||
      prev.lowestPrice !== next.lowestPrice ||
      prev.updatedAt !== next.updatedAt ||
      JSON.stringify(prev.quotes) !== JSON.stringify(next.quotes)
    ) {
      setData(next);
    }
  }, []);

  const fetchLatest = useCallback(async () => {
    if (unmountedRef.current) return;
    try {
      const res = await fetch(`/api/requirements/${encodeURIComponent(requirementId)}/live`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (unmountedRef.current) return;

      if (res.ok) {
        const json = (await res.json()) as AdminLiveBidsPayload;
        if (json?.requirementId) {
          updateDataIfChanged(json);
          setStatus("live");
          setErrorMsg(null);
        }
      } else {
        let msg = `Live feed unavailable (${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.error && typeof errData.error === "string") {
            msg = errData.error;
          }
        } catch {
          if (res.status === 401) msg = "Session expired or unauthorized";
          else if (res.status === 404) msg = "Requirement not found";
          else if (res.status >= 500) msg = "Live stream service unavailable";
        }
        if (!unmountedRef.current) {
          setErrorMsg(msg);
          setStatus("offline");
        }
      }
    } catch (err: any) {
      if (unmountedRef.current) return;
      // Silently ignore AbortError (caused by navigation away) and network errors on unmount
      if (err?.name === "AbortError") return;
      const friendly = err?.message?.toLowerCase().includes("fetch")
        ? "Network connection issue"
        : "Unable to load live bidding data";
      setErrorMsg(friendly);
      setStatus("offline");
    }
  }, [requirementId, updateDataIfChanged]);

  useEffect(() => {
    unmountedRef.current = false;

    // Fetch immediately on mount
    fetchLatest();

    // Poll every 5 seconds while the tab is visible
    const interval = setInterval(() => {
      if (!unmountedRef.current && document.visibilityState === "visible") {
        fetchLatest();
      }
    }, 5000);

    // Refresh when the tab becomes visible again (e.g. user switches back)
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !unmountedRef.current) {
        fetchLatest();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unmountedRef.current = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [requirementId, fetchLatest]);

  return {
    data,
    status,
    errorMsg,
    refresh: fetchLatest,
  };
}
