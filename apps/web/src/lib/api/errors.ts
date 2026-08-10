import { NextResponse } from "next/server";

import "server-only";

import { Prisma } from "@repo/db";

/**
 * Converts a thrown error into a JSON response.
 *
 * Without this, an unhandled throw becomes Next's HTML error page. Clients call
 * `res.json()`, that parse fails, and every server fault is indistinguishable
 * from a wrong password — which is exactly how a missing DATABASE_URL in
 * production presented as "Sign in failed."
 *
 * Messages stay deliberately vague: they reach unauthenticated users, so they
 * must not leak connection strings, hostnames, or stack traces.
 */
export function apiError(err: unknown, fallback = "Something went wrong."): NextResponse {
  // Prisma could not reach or authenticate against the database.
  if (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientRustPanicError
  ) {
    console.error("[api] database unavailable", err);
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again shortly." },
      { status: 503 }
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[api] database request failed", err.code, err.message);
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }

  console.error("[api] unhandled error", err);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
