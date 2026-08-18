import { NextResponse } from "next/server";

import { enquireApiFetch } from "@/lib/api/enquire-api";

export const maxDuration = 60;

export async function POST() {
  try {
    const res = await enquireApiFetch("/submit", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[enquire/submit]", err);
    return NextResponse.json({ error: "Submit failed" }, { status: 503 });
  }
}
