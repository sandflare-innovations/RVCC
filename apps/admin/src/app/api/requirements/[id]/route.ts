import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { proxyAdminGet } from "@/lib/admin-upstream";
import { ADMIN_COOKIE } from "@/lib/constants";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const result = await proxyAdminGet(`/requirements/${params.id}`, token, "get requirement details");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result.data);
}
