import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { adminWorkerFetch } from "@/lib/admin-api";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id, attachmentId } = await ctx.params;
  const download = new URL(request.url).searchParams.get("download") === "1" ? "?download=1" : "";
  try {
    const res = await adminWorkerFetch(
      `/registrations/${encodeURIComponent(id)}/attachments/${encodeURIComponent(attachmentId)}${download}`,
      { method: "GET", sessionToken: token }
    );
    const outType = res.headers.get("Content-Type") || "application/octet-stream";
    if (!outType.includes("application/json")) {
      return new Response(res.body, {
        status: res.status,
        headers: {
          "Content-Type": outType,
          "Content-Disposition": res.headers.get("Content-Disposition") || "inline",
          "Cache-Control": "private, no-store",
        },
      });
    }
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": outType } });
  } catch (err) {
    console.error("[admin BFF registration attachment download]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
