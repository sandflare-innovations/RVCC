import { NextResponse } from "next/server";

import { apiRoot } from "@/lib/api/root";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const res = await fetch(`${apiRoot()}/careers/apply`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[careers/apply]", err);
    return NextResponse.json({ error: "Application could not be submitted." }, { status: 503 });
  }
}
