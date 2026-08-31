import type { Env } from "../../config/env";
import { corsHeaders, json } from "../../lib/http";
import { requireAdmin } from "../admin/auth";
import { getVendorFromSession } from "../vendor/auth";
import { buildAdminLiveBidsPayload, buildVendorLiveBidsPayload } from "./ranking";

function vendorSessionFrom(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}

type BidSubscriber = {
  type: "admin" | "vendor";
  vendorId?: string;
  send: (payload: any) => void;
};

// In-isolate subscriber registry for live SSE connections per requirement
const requirementSubscribers = new Map<string, Set<BidSubscriber>>();

function getSubscribersFor(requirementId: string): Set<BidSubscriber> {
  let subs = requirementSubscribers.get(requirementId);
  if (!subs) {
    subs = new Set();
    requirementSubscribers.set(requirementId, subs);
  }
  return subs;
}

/**
 * Broadcasts an updated leaderboard snapshot to all active SSE client streams for a requirement.
 */
export async function broadcastBidUpdate(requirementId: string): Promise<void> {
  const subs = requirementSubscribers.get(requirementId);
  if (!subs || subs.size === 0) return;

  // Build payloads once
  const adminPayload = await buildAdminLiveBidsPayload(requirementId);
  if (!adminPayload) return;

  for (const sub of subs) {
    try {
      if (sub.type === "admin") {
        sub.send(adminPayload);
      } else if (sub.type === "vendor" && sub.vendorId) {
        // Build customized vendor view (with personal rank & masked competitors)
        const vendorPayload = await buildVendorLiveBidsPayload(requirementId, sub.vendorId);
        if (vendorPayload) sub.send(vendorPayload);
      }
    } catch {
      subs.delete(sub);
    }
  }
}

/**
 * Standard SSE Response generator using standard ReadableStream (compatible with Cloudflare Workers & Node)
 */
function createSseStream(
  request: Request,
  env: Env,
  onConnect: (send: (data: any) => void) => () => void
): Response {
  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;
  let heartbeatInterval: any = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        try {
          const payload = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream closed
        }
      };

      cleanup = onConnect(send);

      // Keepalive heartbeat every 20s
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 20000);
    },
    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (cleanup) cleanup();
    },
  });

  const headers = new Headers(corsHeaders(request, env));
  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  headers.set("Cache-Control", "no-cache, no-transform");
  headers.set("Connection", "keep-alive");
  headers.set("X-Accel-Buffering", "no");

  return new Response(stream, {
    status: 200,
    headers,
  });
}

/**
 * GET /admin/requirements/:id/live-bids
 * Admin Live Bids Endpoint (Supports both SSE stream and REST polling)
 */
export async function handleAdminLiveBids(
  sql: unknown,
  env: Env,
  request: Request,
  requirementId: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const acceptsSse = request.headers.get("Accept")?.includes("text/event-stream");

  if (acceptsSse) {
    return createSseStream(request, env, (send) => {
      const sub: BidSubscriber = {
        type: "admin",
        send,
      };
      const subs = getSubscribersFor(requirementId);
      subs.add(sub);

      // Send initial snapshot immediately
      void buildAdminLiveBidsPayload(requirementId).then((initial) => {
        if (initial) send(initial);
      });

      return () => {
        subs.delete(sub);
      };
    });
  }

  // REST polling fallback
  const payload = await buildAdminLiveBidsPayload(requirementId);
  if (!payload) return json(env, request, { error: "Requirement not found" }, 404);
  return json(env, request, payload);
}

/**
 * GET /vendor/requirements/:id/live-bids
 * Vendor Live Bids Endpoint (Supports both SSE stream and REST polling)
 */
export async function handleVendorLiveBids(
  sql: unknown,
  env: Env,
  request: Request,
  requirementId: string
): Promise<Response> {
  const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
  if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

  const acceptsSse = request.headers.get("Accept")?.includes("text/event-stream");

  if (acceptsSse) {
    return createSseStream(request, env, (send) => {
      const sub: BidSubscriber = {
        type: "vendor",
        vendorId: vendor.id,
        send,
      };
      const subs = getSubscribersFor(requirementId);
      subs.add(sub);

      // Send initial snapshot immediately
      void buildVendorLiveBidsPayload(requirementId, vendor.id).then((initial) => {
        if (initial) send(initial);
      });

      return () => {
        subs.delete(sub);
      };
    });
  }

  // REST polling fallback
  const payload = await buildVendorLiveBidsPayload(requirementId, vendor.id);
  if (!payload) return json(env, request, { error: "Requirement not found" }, 404);
  return json(env, request, payload);
}
