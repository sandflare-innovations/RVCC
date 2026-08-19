import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";
import { parseVendorFilter, parseVendorSearch } from "@/lib/vendor-filters";

export async function GET(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const url = new URL(request.url);
  const filter = parseVendorFilter(url.searchParams.get("filter"));
  const q = parseVendorSearch(url.searchParams.get("q"));

  const qs = new URLSearchParams({ filter });
  if (q) qs.set("q", q);

  try {
    const res = await adminWorkerFetch(`/vendors?${qs}`, {
      method: "GET",
      sessionToken: token,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[admin BFF list vendors]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const res = await adminWorkerFetch("/vendors", {
      method: "POST",
      sessionToken: token,
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[admin BFF create vendor]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
