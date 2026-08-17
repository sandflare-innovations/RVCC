import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { DOCUMENTS } from "@/data/documents";
import { DOC_UNLOCK_COOKIE, configuredDocPassword, unlockTokenValid } from "@/lib/document-access";

export const runtime = "nodejs";

/**
 * Confirms the download PIN cookie, then sends the browser to the file.
 * Large profiles (100MB+) cannot be proxied through the Next.js server, so
 * this is a 302 after auth — not a substitute for a private R2 bucket.
 */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const secret = configuredDocPassword();
  if (!secret) {
    return NextResponse.json({ error: "Document downloads are not configured." }, { status: 503 });
  }

  const jar = await cookies();
  const token = jar.get(DOC_UNLOCK_COOKIE)?.value;
  if (!unlockTokenValid(secret, token)) {
    return NextResponse.json({ error: "Unlock required." }, { status: 401 });
  }

  const { slug } = await context.params;
  const doc = DOCUMENTS.find((d) => d.slug === slug);
  if (!doc) {
    return NextResponse.json({ error: "Unknown document." }, { status: 404 });
  }

  return NextResponse.redirect(doc.fileUrl, 302);
}
