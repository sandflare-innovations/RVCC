import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await props.params;
  try {
    const res = await adminWorkerFetch(`/clients/${id}`, {
      method: "GET",
      sessionToken: token,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[admin BFF GET client]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await props.params;
  const body = await request.text();
  try {
    const res = await adminWorkerFetch(`/clients/${id}`, {
      method: "PUT",
      sessionToken: token,
      body,
      headers: { "Content-Type": "application/json" },
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[admin BFF PUT client]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id } = await props.params;
  try {
    const res = await adminWorkerFetch(`/clients/${id}`, {
      method: "DELETE",
      sessionToken: token,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[admin BFF DELETE client]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
