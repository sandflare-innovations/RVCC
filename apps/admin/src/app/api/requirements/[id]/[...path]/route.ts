import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

async function proxy(request: Request, id: string, path: string[]) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const suffix = path.map(encodeURIComponent).join("/");
  const search = new URL(request.url).search;
  const upstream = `/requirements/${encodeURIComponent(id)}/${suffix}${search}`;

  try {
    const res = await adminWorkerFetch(upstream, {
      method: request.method,
      sessionToken: token,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      headers: { "Content-Type": request.headers.get("Content-Type") || "application/json" },
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[admin BFF requirement action]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path } = await ctx.params;
  return proxy(request, id, path);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path } = await ctx.params;
  return proxy(request, id, path);
}

export async function PUT(
  request: Request,
  ctx: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path } = await ctx.params;
  return proxy(request, id, path);
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string; path: string[] }> }
) {
  const { id, path } = await ctx.params;
  return proxy(request, id, path);
}
