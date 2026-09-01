import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

/**
 * Push notification subscription management endpoint.
 *
 * POST: Save a new push subscription
 * DELETE: Remove a push subscription
 */

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ADMIN_COOKIE)?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const subscription = await request.json();

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
    }

    const res = await adminWorkerFetch("/push/subscribe", {
      method: "POST",
      sessionToken,
      body: JSON.stringify(subscription),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push] Failed to save subscription:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ADMIN_COOKIE)?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    const res = await adminWorkerFetch("/push/subscribe", {
      method: "DELETE",
      sessionToken,
      body: JSON.stringify({ endpoint }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push] Failed to remove subscription:", error);
    return NextResponse.json({ error: "Failed to remove subscription" }, { status: 500 });
  }
}
