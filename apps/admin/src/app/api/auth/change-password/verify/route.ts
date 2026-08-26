import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);

  try {
    const res = await adminWorkerFetch("/auth/change-password/verify", {
      method: "POST",
      sessionToken: token,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[admin/change-password/verify]", err);
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }
}
