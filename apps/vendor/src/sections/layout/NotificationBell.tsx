"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  body: string;
  linkPath: string;
  readAt: string | null;
  createdAt: string;
};

function ago(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/**
 * Unread count and a short list. Fetched on mount rather than polled: at this
 * volume a background poll would cost more than it tells anyone.
 */
export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d) return;
        setItems(d.items ?? []);
        setUnread(d.unread ?? 0);
      })
      .catch(() => {
        /* a failed bell must never break the page around it */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      await fetch("/api/notifications", { method: "POST" }).catch(() => {});
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="border-brand-blue absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full border-2 bg-red-500 px-1.5 text-[11px] font-bold text-white tabular-nums">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg">
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-zinc-600">Nothing yet.</p>
          ) : (
            <ul data-lenis-prevent className="max-h-80 space-y-1 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.linkPath}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2 transition-colors hover:bg-zinc-50"
                  >
                    <p className="text-sm font-medium text-zinc-950">{n.title}</p>
                    {n.body ? <p className="text-xs text-zinc-600">{n.body}</p> : null}
                    <p className="mt-0.5 text-[11px] text-zinc-500">{ago(n.createdAt)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
