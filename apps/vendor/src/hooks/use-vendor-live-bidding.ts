"use client";

import type { VendorLiveBidsPayload } from "@rvcc/schemas";
import { useCallback, useEffect, useRef, useState } from "react";

export function useVendorLiveBidding(
  requirementId: string,
  initialData?: VendorLiveBidsPayload | null
) {
  const [data, setData] = useState<VendorLiveBidsPayload | null>(initialData ?? null);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`/api/requirements/${encodeURIComponent(requirementId)}/live`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as VendorLiveBidsPayload;
        if (json?.requirementId) {
          setData(json);
          setLastUpdated(new Date());
          setStatus("live");
        }
      }
    } catch {
      // Ignored
    }
  }, [requirementId]);

  useEffect(() => {
    let unmounted = false;
    setStatus("connecting");

    // Fetch initial snapshot once on page load
    void fetchSnapshot();

    // Open persistent SSE stream (0 polling requests while idle)
    const url = `/api/requirements/${encodeURIComponent(requirementId)}/live`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (!unmounted) {
        setStatus("live");
        void fetchSnapshot();
      }
    };

    const onMessageEvent = (event: MessageEvent) => {
      if (unmounted) return;
      try {
        const payload = JSON.parse(event.data) as VendorLiveBidsPayload;
        if (payload?.requirementId) {
          setData(payload);
          setLastUpdated(new Date());
          setStatus("live");
        }
      } catch (err) {
        console.warn("[VendorLiveBidding] message parse error", err);
      }
    };

    es.onmessage = onMessageEvent;
    es.addEventListener("snapshot", onMessageEvent);
    es.addEventListener("update", onMessageEvent);
    es.addEventListener("ping", (event) => {
      if (unmounted) return;
      try {
        const payload = JSON.parse(event.data) as { serverTime?: string };
        if (payload?.serverTime) setLastUpdated(new Date(payload.serverTime));
      } catch {
        /* ignore malformed ping */
      }
    });

    es.onerror = () => {
      if (!unmounted) {
        setStatus("offline");
        void fetchSnapshot();
      }
    };

    // When the vendor switches back to this tab, sync once
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !unmounted) {
        void fetchSnapshot();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unmounted = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (eventSourceRef.current) {
        eventSourceRef.current.removeEventListener("snapshot", onMessageEvent);
        eventSourceRef.current.removeEventListener("update", onMessageEvent);
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [requirementId, fetchSnapshot]);

  return {
    data,
    status,
    lastUpdated,
    refresh: fetchSnapshot,
  };
}
