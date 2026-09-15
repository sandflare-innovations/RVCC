import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { redisPublish } from "../../../lib/redis";
import { requireAdmin } from "../../auth/services/admin-auth.service";
import { getVendorFromSession } from "../../auth/services/vendor-auth.service";
import { buildAdminLiveBidsPayload, buildVendorLiveBidsPayload } from "./ranking.service";

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
 * Broadcasts both to in-isolate streams and to Redis Pub/Sub for cross-node global sync.
 */
export async function broadcastBidUpdate(requirementId: string, env?: Env): Promise<void> {
  // 1. Cross-node distributed broadcast via Upstash Redis
  try {
    void redisPublish(`requirement:live:${requirementId}`, {
      requirementId,
      timestamp: Date.now(),
    }, env);
  } catch (err) {
    console.warn("[broadcastBidUpdate] redis publish fallback", err);
  }

  // 2. In-isolate direct SSE push
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
 * GET /admin/requirements/:id/live-bids
 * Real-time SSE stream transmitting live rank leaderboards to authorized procurement staff.
 */
export async function handleAdminLiveBids(
  sql: unknown,
  env: Env,
  request: Request,
  requirementId: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;

  const initialPayload = await buildAdminLiveBidsPayload(requirementId);
  if (!initialPayload) {
    return json(env, request, { error: "Requirement not found" }, 404);
  }

  // If the client requested JSON (e.g. initial snapshot fetch)
  const isSse = request.headers.get("Accept")?.includes("text/event-stream");
  if (!isSse) {
    return json(env, request, initialPayload);
  }

  let subscriber: BidSubscriber | null = null;
  const subs = getSubscribersFor(requirementId);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (eventName: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send immediate snapshot on connection
      sendEvent("snapshot", initialPayload);

      subscriber = {
        type: "admin",
        send: (data) => sendEvent("update", data),
      };
      subs.add(subscriber);

      // Keepalive heartbeat every 15s to prevent Cloudflare Worker timeouts
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatTimer);
          if (subscriber) subs.delete(subscriber);
        }
      }, 15000);

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatTimer);
        if (subscriber) subs.delete(subscriber);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (subscriber) subs.delete(subscriber);
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * GET /vendor/requirements/:id/live-bids
 * Real-time SSE stream transmitting live rank & competitor bids (anonymized) to participating vendors.
 */
export async function handleVendorLiveBids(
  sql: unknown,
  env: Env,
  request: Request,
  requirementId: string
): Promise<Response> {
  const token = vendorSessionFrom(request);
  const vendor = await getVendorFromSession(sql, token);
  if (!vendor) {
    return json(env, request, { error: "Not signed in" }, 401);
  }

  const initialPayload = await buildVendorLiveBidsPayload(requirementId, vendor.id);
  if (!initialPayload) {
    return json(env, request, { error: "Requirement not found" }, 404);
  }

  // If the client requested JSON (e.g. initial snapshot fetch)
  const isSse = request.headers.get("Accept")?.includes("text/event-stream");
  if (!isSse) {
    return json(env, request, initialPayload);
  }

  let subscriber: BidSubscriber | null = null;
  const subs = getSubscribersFor(requirementId);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (eventName: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Send immediate snapshot on connection
      sendEvent("snapshot", initialPayload);

      subscriber = {
        type: "vendor",
        vendorId: vendor.id,
        send: (data) => sendEvent("update", data),
      };
      subs.add(subscriber);

      // Keepalive heartbeat
      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatTimer);
          if (subscriber) subs.delete(subscriber);
        }
      }, 15000);

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeatTimer);
        if (subscriber) subs.delete(subscriber);
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      if (subscriber) subs.delete(subscriber);
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
