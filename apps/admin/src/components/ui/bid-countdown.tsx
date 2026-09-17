"use client";

import { useEffect, useState } from "react";

function parts(ms: number) {
  const clamped = Math.max(0, ms);
  const days = Math.floor(clamped / 86400000);
  const hours = Math.floor((clamped % 86400000) / 3600000);
  const minutes = Math.floor((clamped % 3600000) / 60000);
  const seconds = Math.floor((clamped % 60000) / 1000);
  return { days, hours, minutes, seconds, expired: ms <= 0 };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function BidCountdown({
  closesAt,
  opensAt,
}: {
  closesAt?: string | null;
  opensAt?: string | null;
  /** Kept for callers; phase is derived from opensAt/closesAt. */
  status?: string;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!closesAt) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
        Bidding window has not been configured yet.
      </div>
    );
  }

  const closeMs = new Date(closesAt).getTime() - now;
  const openMs = opensAt ? new Date(opensAt).getTime() - now : 0;
  // Stored status stays OPEN while the clock is still before opensAt (Scheduled).
  const notOpenYet = Boolean(opensAt && openMs > 0);
  const remaining = notOpenYet ? openMs : closeMs;
  const { days, hours, minutes, seconds, expired } = parts(remaining);

  if (expired && !notOpenYet) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
        Bidding closed
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue/5 px-4 py-3">
      <p className="text-[11px] font-semibold tracking-wider text-brand-blue uppercase">
        {notOpenYet ? "Bid opens in" : "Bid closes in"}
      </p>
      <p className="mt-1 font-mono text-lg font-bold tracking-wide text-zinc-900">
        {pad(days)} Day : {pad(hours)} Hours : {pad(minutes)} Minutes
        <span className="ml-2 text-sm font-medium text-zinc-500">{pad(seconds)}s</span>
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {opensAt ? `Opens ${new Date(opensAt).toLocaleString("en-GB")}` : null}
        {opensAt && closesAt ? " · " : ""}
        Closes {new Date(closesAt).toLocaleString("en-GB")}
      </p>
    </div>
  );
}
