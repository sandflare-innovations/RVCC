"use client";

import type { AdminLiveBidsPayload } from "@rvcc/types";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAdminLiveBidding(
  requirementId: string,
  initialData?: AdminLiveBidsPayload | null
) {
  const [data, setData] = useState<AdminLiveBidsPayload | null>(initialData ?? null);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/requirements/${encodeURIComponent(requirementId)}/live`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as AdminLiveBidsPayload;
        if (json?.requirementId) {
          setData(json);
          setStatus("live");
          setErrorMsg(null);
        }
      }
    } catch {
      // Ignored on initial mount
    }
  }, [requirementId]);

  useEffect(() => {
    let unmounted = false;
    setStatus("connecting");

    // Fetch initial snapshot once on page load
    fetchSnapshot();

    // Open persistent SSE stream (0 polling requests while idle)
    const url = `/api/requirements/${encodeURIComponent(requirementId)}/live`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (!unmounted) {
        setStatus("live");
        setErrorMsg(null);
      }
    };

    es.onmessage = (event) => {
      if (unmounted) return;
      try {
        const payload = JSON.parse(event.data) as AdminLiveBidsPayload;
        if (payload?.requirementId) {
          setData(payload);
          setStatus("live");
          setErrorMsg(null);
        }
      } catch (err) {
        console.warn("[AdminLiveBidding] parse error", err);
      }
    };

    es.onerror = () => {
      if (unmounted) return;
      setStatus("offline");
    };

    // When the admin switches back to the tab, sync once
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !unmounted) {
        fetchSnapshot();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unmounted = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [requirementId, fetchSnapshot]);

  return {
    data,
    status,
    errorMsg,
    refresh: fetchSnapshot,
  };
}
