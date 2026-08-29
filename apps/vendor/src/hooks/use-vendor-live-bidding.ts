"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { VendorLiveBidsPayload } from "@rvcc/types";

export function useVendorLiveBidding(
  requirementId: string,
  initialData?: VendorLiveBidsPayload | null
) {
  const [data, setData] = useState<VendorLiveBidsPayload | null>(initialData ?? null);
  const [status, setStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchFallback = useCallback(async () => {
    try {
      const res = await fetch(`/api/requirements/${encodeURIComponent(requirementId)}/live`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as VendorLiveBidsPayload;
        setData(json);
        setLastUpdated(new Date());
      }
    } catch {
      // Ignored in background polling
    }
  }, [requirementId]);

  useEffect(() => {
    let unmounted = false;
    setStatus("connecting");

    const url = `/api/requirements/${encodeURIComponent(requirementId)}/live`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      if (!unmounted) setStatus("live");
    };

    es.onmessage = (event) => {
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

    es.onerror = () => {
      if (unmounted) return;
      setStatus("offline");
      // Fallback fetch when connection is interrupted
      fetchFallback();
    };

    // Cross-isolate fallback: Since Cloudflare Workers distribute across isolates,
    // memory-based pub/sub only hits clients on the same node. We poll every 5s to guarantee 100% sync.
    const pollInterval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchFallback();
      }
    }, 5000);

    return () => {
      unmounted = true;
      clearInterval(pollInterval);
      es.close();
      eventSourceRef.current = null;
    };
  }, [requirementId, fetchFallback]);

  return {
    data,
    status,
    lastUpdated,
    refresh: fetchFallback,
  };
}
