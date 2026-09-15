import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleRequirementAward,
  handleRequirementCreate,
  handleRequirementDelete,
  handleRequirementExportCsv,
  handleRequirementGet,
  handleRequirementsList,
  handleRequirementUpdate,
} from "./controllers/sourcing.admin.controller";
import {
  handleActivity,
  handleBidConfig,
  handleCloseBidding,
  handleCollectQuotations,
  handleComparison,
  handleInviteSuppliers,
  handleManualQuoteCreate,
  handleManualQuoteDelete,
  handleManualQuotesList,
  handleOpenBidding,
  handleQuoteAction,
  handleRequirementStats,
  handleStartEvaluation,
  handleSubmitToAdmin,
} from "./controllers/sourcing.pipeline.controller";

export function createSourcingAdminRouter(env: Env) {
  const router = new Hono();

  router.get("/requirements", (c) => handleRequirementsList(null, env, c.req.raw));
  router.post("/requirements", (c) => handleRequirementCreate(null, env, c.req.raw));
  router.get("/requirements/stats", (c) => handleRequirementStats(null, env, c.req.raw));
  router.get("/requirements/:id", (c) => handleRequirementGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/requirements/:id", (c) => handleRequirementUpdate(null, env, c.req.raw, c.req.param("id")));
  router.delete("/requirements/:id", (c) => handleRequirementDelete(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/award", (c) => handleRequirementAward(null, env, c.req.raw, c.req.param("id")));
  router.get("/requirements/:id/export", (c) => handleRequirementExportCsv(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/collect-quotations", (c) =>
    handleCollectQuotations(null, env, c.req.raw, c.req.param("id"))
  );
  router.post("/requirements/:id/submit", (c) => handleSubmitToAdmin(null, env, c.req.raw, c.req.param("id")));
  router.get("/requirements/:id/manual-quotes", (c) =>
    handleManualQuotesList(null, env, c.req.raw, c.req.param("id"))
  );
  router.post("/requirements/:id/manual-quotes", (c) =>
    handleManualQuoteCreate(null, env, c.req.raw, c.req.param("id"))
  );
  router.delete("/requirements/:id/manual-quotes/:quotationId", (c) =>
    handleManualQuoteDelete(null, env, c.req.raw, c.req.param("id"), c.req.param("quotationId"))
  );
  router.post("/requirements/:id/bid-config", (c) => handleBidConfig(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/invites", (c) => handleInviteSuppliers(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/open", (c) => handleOpenBidding(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/close", (c) => handleCloseBidding(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/evaluate", (c) => handleStartEvaluation(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/quotes/:quoteId/action", (c) =>
    handleQuoteAction(null, env, c.req.raw, c.req.param("id"), c.req.param("quoteId"))
  );
  router.get("/requirements/:id/comparison", (c) => handleComparison(null, env, c.req.raw, c.req.param("id")));
  router.get("/requirements/:id/activity", (c) => handleActivity(null, env, c.req.raw, c.req.param("id")));

  return router;
}
