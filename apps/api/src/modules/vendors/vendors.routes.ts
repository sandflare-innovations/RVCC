import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleRegistrationAttachmentDownload,
  handleRegistrationDelete,
  handleRegistrationGet,
  handleRegistrationReview,
  handleRegistrationsExportCsv,
  handleRegistrationsList,
} from "./registrations/registrations.controller";
import {
  handleVendorCreate,
  handleVendorDelete,
  handleVendorGet,
  handleVendorPatch,
  handleVendorResetPassword,
  handleVendorsList,
} from "./accounts/accounts.controller";
import {
  handleDashboard,
  handleQuoteAttachmentDelete,
  handleQuoteAttachmentUpload,
  handleQuoteSave,
  handleRequirementGet,
  handleRequirementsList,
} from "./portal/portal.controller";
import {
  handleVendorNotificationsGet,
  handleVendorNotificationsMarkRead,
} from "./portal/portal-notifications.controller";

export function createVendorsAdminRouter(env: Env) {
  const router = new Hono();

  // Registrations
  router.get("/registrations", (c) => handleRegistrationsList(null, env, c.req.raw));
  router.get("/registrations/export", (c) => handleRegistrationsExportCsv(null, env, c.req.raw));
  router.get("/registrations/:id", (c) => handleRegistrationGet(null, env, c.req.raw, c.req.param("id")));
  router.get("/registrations/:id/attachments/:attachmentId", (c) =>
    handleRegistrationAttachmentDownload(
      null,
      env,
      c.req.raw,
      c.req.param("id"),
      c.req.param("attachmentId")
    )
  );
  router.post("/registrations/:id/review", (c) => handleRegistrationReview(null, env, c.req.raw, c.req.param("id")));
  router.delete("/registrations/:id", (c) => handleRegistrationDelete(null, env, c.req.raw, c.req.param("id")));

  // Vendor Accounts
  router.get("/vendors", (c) => handleVendorsList(null, env, c.req.raw));
  router.post("/vendors", (c) => handleVendorCreate(null, env, c.req.raw));
  router.get("/vendors/:id", (c) => handleVendorGet(null, env, c.req.raw, c.req.param("id")));
  router.patch("/vendors/:id", (c) => handleVendorPatch(null, env, c.req.raw, c.req.param("id")));
  router.delete("/vendors/:id", (c) => handleVendorDelete(null, env, c.req.raw, c.req.param("id")));
  router.post("/vendors/:id/reset-password", (c) => handleVendorResetPassword(null, env, c.req.raw, c.req.param("id")));

  return router;
}

export function createVendorPortalRouter(env: Env) {
  const router = new Hono();

  router.get("/dashboard", (c) => handleDashboard(null, env, c.req.raw));
  router.get("/notifications", (c) => handleVendorNotificationsGet(null, env, c.req.raw));
  router.post("/notifications", (c) => handleVendorNotificationsMarkRead(null, env, c.req.raw));
  router.get("/requirements", (c) => handleRequirementsList(null, env, c.req.raw));
  router.get("/requirements/:id", (c) => handleRequirementGet(null, env, c.req.raw, c.req.param("id")));
  router.put("/requirements/:id/quote", (c) => handleQuoteSave(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/quote", (c) => handleQuoteSave(null, env, c.req.raw, c.req.param("id")));
  router.post("/requirements/:id/quote/attachment", (c) =>
    handleQuoteAttachmentUpload(null, env, c.req.raw, c.req.param("id"))
  );
  router.get("/requirements/:id/quote/attachment/:attachmentId", async (c) => {
    const { handleQuoteAttachmentDownload } = await import("./portal/portal.controller");
    return handleQuoteAttachmentDownload(
      null,
      env,
      c.req.raw,
      c.req.param("id"),
      c.req.param("attachmentId")
    );
  });
  router.delete("/requirements/:id/quote/attachment/:attachmentId", (c) =>
    handleQuoteAttachmentDelete(null, env, c.req.raw, c.req.param("id"), c.req.param("attachmentId"))
  );

  return router;
}
