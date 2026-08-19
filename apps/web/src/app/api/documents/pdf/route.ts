import { NextResponse } from "next/server";

import { cdnUrl } from "@/lib/cdn";

const ALLOWED_PREFIX = "/pdf/";

/** Same-origin PDF proxy with Range support for react-pdf streaming. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.searchParams.get("path") ?? "";
  const decoded = decodeURIComponent(path);

  if (!decoded.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const upstream = cdnUrl(decoded);
  const range = request.headers.get("Range");

  try {
    const res = await fetch(upstream, {
      headers: range ? { Range: range } : undefined,
      cache: "force-cache",
      next: { revalidate: 86400 },
    });

    if (!res.ok && res.status !== 206) {
      return NextResponse.json({ error: "PDF unavailable" }, { status: res.status });
    }

    const headers = new Headers();
    headers.set("Content-Type", res.headers.get("Content-Type") || "application/pdf");
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=86400");
    const contentLength = res.headers.get("Content-Length");
    const contentRange = res.headers.get("Content-Range");
    if (contentLength) headers.set("Content-Length", contentLength);
    if (contentRange) headers.set("Content-Range", contentRange);

    return new NextResponse(res.body, { status: res.status, headers });
  } catch (err) {
    console.error("[documents/pdf]", err);
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 502 });
  }
}
