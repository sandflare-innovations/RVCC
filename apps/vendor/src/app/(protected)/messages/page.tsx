import { MessageSquare } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { VENDOR_COOKIE, VENDOR_LOGIN_EXPIRED_PATH } from "@/lib/constants";
import { getVendorFromSession } from "@/lib/session";
import { vendorApiFetch } from "@/lib/vendor-api";

export const dynamic = "force-dynamic";

type MessageItem = {
  id: string;
  type?: string;
  title: string;
  body: string;
  linkPath: string;
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

export default async function VendorMessagesPage() {
  const vendor = await getVendorFromSession();
  if (!vendor) redirect(VENDOR_LOGIN_EXPIRED_PATH);
  if (vendor.mustChangePassword) redirect("/password");

  const token = (await cookies()).get(VENDOR_COOKIE)?.value;
  let items: MessageItem[] = [];
  try {
    const res = await vendorApiFetch("/notifications", {
      method: "GET",
      sessionToken: token,
      signal: AbortSignal.timeout(8_000),
    });
    if (res.ok) {
      const data = await res.json();
      items = Array.isArray(data.items) ? data.items : [];
    }
  } catch (err) {
    console.error("[vendor] messages fetch failed", err);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Messages</h1>
        <p className="mt-1 text-sm text-zinc-600">RFQ updates and notes from RVCC procurement.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-white p-10 text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-zinc-300" />
          <p className="text-sm text-zinc-500">No messages yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 overflow-hidden rounded-3xl border border-zinc-200 bg-white">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.linkPath || "/"}
              className="block px-5 py-4 transition-colors hover:bg-zinc-50"
            >
              <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
              {item.body ? <p className="mt-1 text-sm text-zinc-600">{item.body}</p> : null}
              <p className="mt-1 text-[11px] text-zinc-400" suppressHydrationWarning>
                {ago(item.createdAt)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
