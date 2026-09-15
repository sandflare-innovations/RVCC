import type { Env } from "../../../config/env";
import { corsHeaders, json } from "../../../lib/http";
import { prisma } from "../../../lib/prisma";
import { redisGet, redisPublish, redisSet } from "../../../lib/redis";
import { requireAdmin } from "../../auth/services/admin-auth.service";
import { getVendorFromSession } from "../../auth/services/vendor-auth.service";
import { buildAdminLiveBidsPayload, buildVendorLiveBidsPayload } from "./ranking.service";

function vendorSessionFrom(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}

type BidSubscriber = {
  type: "admin" | "vendor";
  vendorId?: string;
  send: (eventName: string, payload: unknown, eventId: string) => void;
};

const requirementSubscribers = new Map<string, Set<BidSubscriber>>();
const lastTick = new Map<string, string>();
let fanoutTimer: ReturnType<typeof setInterval> | null = null;

function getSubscribersFor(requirementId: string): Set<BidSubscriber> {
  let subs = requirementSubscribers.get(requirementId);
  if (!subs) {
    subs = new Set();
    requirementSubscribers.set(requirementId, subs);
  }
  return subs;
}

function dropSubscriber(requirementId: string, subscriber: BidSubscriber | null) {
  if (!subscriber) return;
  const subs = requirementSubscribers.get(requirementId);
  if (!subs) return;
  subs.delete(subscriber);
  if (subs.size === 0) requirementSubscribers.delete(requirementId);
}

async function fanoutLocal(requirementId: string) {
  const subs = requirementSubscribers.get(requirementId);
  if (!subs || subs.size === 0) return;
  const eventId = String(Date.now());
  const adminPayload = await buildAdminLiveBidsPayload(requirementId);
  if (!adminPayload) return;

  for (const sub of [...subs]) {
    try {
      if (sub.type === "admin") {
        sub.send("update", adminPayload, eventId);
      } else if (sub.vendorId) {
        const vendorPayload = await buildVendorLiveBidsPayload(requirementId, sub.vendorId);
        if (vendorPayload) sub.send("update", vendorPayload, eventId);
      }
    } catch {
      subs.delete(sub);
    }
  }
}

function ensureFanoutPoller(env?: Env) {
  if (fanoutTimer) return;
  fanoutTimer = setInterval(() => {
    void (async () => {
      for (const requirementId of requirementSubscribers.keys()) {
        const tick = await redisGet<string>(`requirement:live:${requirementId}:tick`, env);
        if (!tick || tick === lastTick.get(requirementId)) continue;
        lastTick.set(requirementId, tick);
        await fanoutLocal(requirementId);
      }
    })().catch((err) => console.warn("[live-bids] redis fan-out poll failed", err));
  }, 1000);
}

/** After a bid is committed, rebuild from Postgres and notify SSE clients. */
export async function broadcastBidUpdate(requirementId: string, env?: Env): Promise<void> {
  const tick = String(Date.now());
  lastTick.set(requirementId, tick);
  try {
    await redisSet(`requirement:live:${requirementId}:tick`, tick, 3600, env);
    void redisPublish(`requirement:live:${requirementId}`, { requirementId, timestamp: tick }, env);
  } catch (err) {
    console.warn("[broadcastBidUpdate] redis publish fallback", err);
  }
  await fanoutLocal(requirementId);
}

function sseHeaders(request: Request, env: Env): HeadersInit {
  return {
    ...corsHeaders(request, env),
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function openSseStream(
  env: Env,
  request: Request,
  requirementId: string,
  subscriber: Omit<BidSubscriber, "send">,
  snapshot: unknown
) {
  ensureFanoutPoller(env);
  let live: BidSubscriber | null = null;
  const subs = getSubscribersFor(requirementId);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (eventName: string, data: unknown, eventId = String(Date.now())) => {
        controller.enqueue(
          encoder.encode(`id: ${eventId}\nevent: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Last-Event-ID reconnects get a fresh DB snapshot, not a bid replay.
      sendEvent("snapshot", snapshot);

      live = {
        ...subscriber,
        send: (eventName, payload, eventId) => sendEvent(eventName, payload, eventId),
      };
      subs.add(live);

      const heartbeatTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          sendEvent("ping", { serverTime: new Date().toISOString() });
        } catch {
          clearInterval(heartbeatTimer);
          dropSubscriber(requirementId, live);
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(heartbeatTimer);
        dropSubscriber(requirementId, live);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      dropSubscriber(requirementId, live);
    },
  });

  return new Response(stream, { headers: sseHeaders(request, env) });
}

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

  const isSse = request.headers.get("Accept")?.includes("text/event-stream");
  if (!isSse) return json(env, request, initialPayload);

  return openSseStream(env, request, requirementId, { type: "admin" }, initialPayload);
}

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

  const invited = await prisma.requirementInvite.findFirst({
    where: { requirementId, vendorUserId: vendor.id },
    select: { id: true },
  });
  if (!invited) {
    return json(env, request, { error: "You are not invited to this negotiation." }, 403);
  }

  const initialPayload = await buildVendorLiveBidsPayload(requirementId, vendor.id);
  if (!initialPayload) {
    return json(env, request, { error: "Requirement not found" }, 404);
  }

  const isSse = request.headers.get("Accept")?.includes("text/event-stream");
  if (!isSse) return json(env, request, initialPayload);

  return openSseStream(
    env,
    request,
    requirementId,
    { type: "vendor", vendorId: vendor.id },
    initialPayload
  );
}
