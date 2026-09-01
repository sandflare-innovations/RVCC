import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { VENDOR_COOKIE } from "@/lib/constants";
import { vendorWorkerFetch } from "@/lib/vendor-api";

export async function DELETE(
  _request: Request,
  ctx: { params: Promise<{ id: string; attachmentId: string }> }
) {
  const jar = await cookies();
  const token = jar.get(VENDOR_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id, attachmentId } = await ctx.params;
  try {
    const res = await vendorWorkerFetch(
      `/requirements/${encodeURIComponent(id)}/quote/attachment/${encodeURIComponent(attachmentId)}`,
      {
        method: "DELETE",
        sessionToken: token,
      }
    );
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
    });
  } catch (err) {
    console.error("[vendor BFF quote attachment delete]", err);
    return NextResponse.json({ error: "Upstream unavailable." }, { status: 503 });
  }
}
