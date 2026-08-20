import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

/** Always fetch the full registration list — client filters locally for instant tab switching. */
export async function GET() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminWorkerFetch("/registrations?status=ALL", {
      method: "GET",
      sessionToken: token,
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !Array.isArray(data)) {
      console.error("[admin BFF list registrations] upstream", res.status, data);
      return NextResponse.json([], { status: res.ok ? 200 : 503 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[admin BFF list registrations]", err);
    return NextResponse.json([], { status: 503 });
  }
}
