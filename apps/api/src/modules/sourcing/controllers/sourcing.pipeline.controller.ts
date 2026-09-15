import type { Env } from "../../../config/env";
import { json, readJson } from "../../../lib/http";
import { requireAdmin, writeAudit } from "../../auth";
import { serializeRequirement } from "../lib/serialize";
import { QuotationsService } from "../services/quotations.service";
import { BiddingService } from "../services/bidding.service";
import { EvaluationService } from "../services/evaluation.service";
import { SourcingService } from "../services/sourcing.service";
import { SourcingStatsService } from "../services/stats.service";
import { getRequirementRankings } from "../bidding/ranking.service";

async function loadRequirementOr404(env: Env, request: Request, id: string) {
  const requirement = await SourcingService.getRequirementById(id);
  if (!requirement) return { requirement: null, response: json(env, request, { error: "Requirement not found." }, 404) };
  return { requirement, response: null };
}

export async function handleRequirementStats(sql: unknown, env: Env, request: Request) {
  const { deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;
  const stats = await SourcingStatsService.getDashboard();
  return json(env, request, stats);
}

export async function handleCollectQuotations(sql: unknown, env: Env, request: Request, id: string) {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;
  try {
    const updated = await SourcingService.startQuotationCollection(id);
    if (!updated) return json(env, request, { error: "Requirement not found." }, 404);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.quotation_collection",
      entityType: "Requirement",
      entityId: id,
      previousStatus: "DRAFT",
      newStatus: "QUOTATION_COLLECTION",
    });
    return json(env, request, { ok: true, status: updated.status });
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleSubmitToAdmin(sql: unknown, env: Env, request: Request, id: string) {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;
  try {
    const updated = await SourcingService.submitToAdmin(id, admin.id);
    if (!updated) return json(env, request, { error: "Requirement not found." }, 404);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.submitted_to_admin",
      entityType: "Requirement",
      entityId: id,
      previousStatus: "QUOTATION_COLLECTION",
      newStatus: "SUBMITTED_TO_ADMIN",
    });
    return json(env, request, { ok: true, status: updated.status });
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleManualQuotesList(sql: unknown, env: Env, request: Request, id: string) {
  const { deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;
  const { response } = await loadRequirementOr404(env, request, id);
  if (response) return response;
  const rows = await QuotationsService.list(id);
  return json(env, request, {
    quotations: rows.map((r) => QuotationsService.serialize(r)),
    stats: QuotationsService.stats(rows),
  });
}

export async function handleManualQuoteCreate(sql: unknown, env: Env, request: Request, id: string) {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;
  try {
    const body = await readJson(request);
    const result = await QuotationsService.create(id, admin.id, body);
    if ("error" in result) return json(env, request, { error: result.error }, result.status);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "quotation.added",
      entityType: "Requirement",
      entityId: id,
      metadata: { quotationId: result.quotation.id, supplierName: result.quotation.supplierName },
    });
    return json(env, request, result, 201);
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleManualQuoteDelete(
  sql: unknown,
  env: Env,
  request: Request,
  id: string,
  quotationId: string
) {
  const { admin, deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;
  try {
    const removed = await QuotationsService.remove(id, quotationId);
    if (!removed) return json(env, request, { error: "Quotation not found." }, 404);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "quotation.removed",
      entityType: "Requirement",
      entityId: id,
      metadata: { quotationId },
    });
    return json(env, request, { ok: true });
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleBidConfig(sql: unknown, env: Env, request: Request, id: string) {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;
  try {
    const body = await readJson(request);
    const updated = await BiddingService.saveConfig(id, body);
    if (!updated) return json(env, request, { error: "Requirement not found." }, 404);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.target_price_configured",
      entityType: "Requirement",
      entityId: id,
      metadata: { targetPrice: String(updated.sellingPrice), closesAt: updated.closesAt?.toISOString() },
    });
    return json(env, request, { ok: true, requirement: serializeRequirement(updated, admin.role) });
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleInviteSuppliers(sql: unknown, env: Env, request: Request, id: string) {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;
  try {
    const body = await readJson(request);
    const result = await BiddingService.invite(id, body, env);
    if (!result) return json(env, request, { error: "Requirement not found." }, 404);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.suppliers_invited",
      entityType: "Requirement",
      entityId: id,
      metadata: { count: result.invites.length },
    });
    return json(env, request, result);
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleOpenBidding(sql: unknown, env: Env, request: Request, id: string) {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;
  try {
    const updated = await BiddingService.openBidding(id);
    if (!updated) return json(env, request, { error: "Requirement not found." }, 404);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.bidding_opened",
      entityType: "Requirement",
      entityId: id,
      previousStatus: "SUBMITTED_TO_ADMIN",
      newStatus: "OPEN",
    });
    return json(env, request, { ok: true, status: updated.status });
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleCloseBidding(sql: unknown, env: Env, request: Request, id: string) {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;
  try {
    const updated = await BiddingService.closeBidding(id);
    if (!updated) return json(env, request, { error: "Requirement not found." }, 404);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.bidding_closed",
      entityType: "Requirement",
      entityId: id,
      newStatus: "BIDDING_CLOSED",
    });
    return json(env, request, { ok: true, status: updated.status });
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleStartEvaluation(sql: unknown, env: Env, request: Request, id: string) {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;
  try {
    const updated = await BiddingService.startEvaluation(id);
    if (!updated) return json(env, request, { error: "Requirement not found." }, 404);
    await writeAudit(sql, {
      adminId: admin.id,
      action: "requirement.evaluation_started",
      entityType: "Requirement",
      entityId: id,
      newStatus: "EVALUATING",
    });
    return json(env, request, { ok: true, status: updated.status });
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleQuoteAction(
  sql: unknown,
  env: Env,
  request: Request,
  id: string,
  quoteId: string
) {
  const { admin, deny } = await requireAdmin(sql, env, request, "ADMIN");
  if (deny) return deny;
  try {
    const body = await readJson(request);
    const result = await EvaluationService.applyQuoteAction(id, quoteId, admin.id, body);
    if ("error" in result) return json(env, request, { error: result.error }, result.status);
    await writeAudit(sql, {
      adminId: admin.id,
      action: `quote.${String(result.evaluationStatus).toLowerCase()}`,
      entityType: "Requirement",
      entityId: id,
      metadata: { quoteId, evaluationStatus: result.evaluationStatus },
    });
    return json(env, request, result);
  } catch (err: any) {
    return json(env, request, { error: err.message }, 400);
  }
}

export async function handleComparison(sql: unknown, env: Env, request: Request, id: string) {
  const { deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;
  const { response } = await loadRequirementOr404(env, request, id);
  if (response) return response;
  const rankings = await getRequirementRankings(id);
  const rows = await QuotationsService.list(id);
  return json(env, request, {
    quotationStats: QuotationsService.stats(rows),
    quotations: rows.map((q) => QuotationsService.serialize(q)),
    bids: rankings.adminQuotes,
    lowestBid: rankings.lowestPrice,
    averageBid: rankings.averagePrice,
    rankingStrategy: rankings.requirement?.rankingStrategy ?? "LOWEST_PRICE",
  });
}

export async function handleActivity(sql: unknown, env: Env, request: Request, id: string) {
  const { deny } = await requireAdmin(sql, env, request, "PROCUREMENT_ADMIN");
  if (deny) return deny;
  const logs = await SourcingService.listActivity(id);
  return json(
    env,
    request,
    logs.map((log) => ({
      id: log.id,
      action: log.action,
      actorName: log.actorName,
      actorRole: log.actorRole,
      previousStatus: log.previousStatus,
      newStatus: log.newStatus,
      note: log.note,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    }))
  );
}
