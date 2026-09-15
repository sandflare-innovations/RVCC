import type { Env } from "../config/env";
import { corsHeaders, json } from "../lib/http";
import { createSql, releaseSql } from "../lib/sql";
import { requireAdmin } from "../modules/auth/services/admin-auth.service";
import {
  handleLogin,
  handleLogout,
  handleMe,
} from "../modules/auth/controllers/admin-auth.controller";
import {
  handleAdminChangePasswordWithCurrent,
  handleAdminChangePasswordRequestOtp,
  handleAdminChangePasswordVerify,
} from "../modules/auth/controllers/password.controller";
import {
  handleStaffCreate,
  handleStaffDelete,
  handleStaffList,
  handleStaffOtpRequest,
  handleStaffPasswordReset,
  handleStaffUpdate,
} from "../modules/auth/controllers/staff.controller";
import {
  handleCareerCreate,
  handleCareerDelete,
  handleCareerApplicationsList,
  handleCareerGet,
  handleCareerPatch,
  handleCareersList,
} from "../modules/careers/controllers/careers.admin.controller";
import {
  handleDashboard,
  handleIndustriesList,
} from "../modules/system/controllers/dashboard.admin.controller";
import {
  handleAdminNotificationsGet,
  handleAdminNotificationsMarkRead,
  handleAdminPushSubscribe,
  handleAdminPushUnsubscribe,
} from "../modules/system/controllers/notification.admin.controller";
import {
  handleRegistrationsList,
  handleRegistrationGet,
  handleRegistrationReview,
  handleRegistrationDelete,
  handleRegistrationsExportCsv,
} from "../modules/vendors/registrations/registrations.controller";
import {
  handleVendorsList,
  handleVendorGet,
  handleVendorPatch,
  handleVendorDelete,
  handleVendorResetPassword,
  handleVendorCreate,
} from "../modules/vendors/accounts/accounts.controller";
import {
  handleRequirementsList,
  handleRequirementGet,
  handleRequirementCreate,
  handleRequirementUpdate,
  handleRequirementDelete,
  handleRequirementAward,
  handleRequirementExportCsv,
} from "../modules/sourcing/controllers/sourcing.admin.controller";
import {
  handleActivity,
  handleBidConfig,
  handleCloseBidding,
  handleCollectQuotations,
  handleComparison,
  handleInviteSuppliers,
  handleManualQuoteCreate,
  handleManualQuoteDelete,
  handleManualQuoteRelink,
  handleManualQuotesList,
  handleOpenBidding,
  handleQuoteAction,
  handleRequirementStats,
  handleStartEvaluation,
  handleSubmitToAdmin,
} from "../modules/sourcing/controllers/sourcing.pipeline.controller";
import { handleAdminLiveBids } from "../modules/sourcing/bidding/live-bids.controller";
import {
  handleProcurementCreate,
  handleProcurementDelete,
  handleProcurementGet,
  handleProcurementList,
  handleProcurementReview,
} from "../modules/procurement/controllers/procurement.admin.controller";
import { enforceRateLimit } from "../lib/rate-limit";

/**
 * Admin domain router. Paths are relative to `/admin` (e.g. `/auth/login`).
 * Auth is session-based (`X-Admin-Session`); no shared API secret.
 */
export async function handleAdminRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  let sql;
  try {
    sql = createSql(env);
  } catch (err) {
    console.error(err);
    return json(env, request, { error: "Service unavailable" }, 503);
  }

  try {
    if (path === "/auth/login" && request.method === "POST") {
      const limited = await enforceRateLimit(request, env, "admin:login", { limit: 6, windowSeconds: 60 });
      if (limited) return limited;
      return await handleLogin(sql, env, request);
    }
    if (path === "/auth/logout" && request.method === "POST") {
      return await handleLogout(sql, env, request);
    }
    if (path === "/auth/me" && request.method === "GET") {
      return await handleMe(sql, env, request);
    }
    if (path === "/auth/change-password/reset" && request.method === "POST") {
      const limited = await enforceRateLimit(request, env, "admin:change-pass", { limit: 5, windowSeconds: 60 });
      if (limited) return limited;
      return await handleAdminChangePasswordWithCurrent(sql, env, request);
    }
    if (path === "/auth/change-password/request-otp" && request.method === "POST") {
      const limited = await enforceRateLimit(request, env, "admin:otp-req", { limit: 4, windowSeconds: 300 });
      if (limited) return limited;
      return await handleAdminChangePasswordRequestOtp(sql, env, request);
    }
    if (path === "/auth/change-password/verify" && request.method === "POST") {
      const limited = await enforceRateLimit(request, env, "admin:otp-verify", { limit: 5, windowSeconds: 60 });
      if (limited) return limited;
      return await handleAdminChangePasswordVerify(sql, env, request);
    }

    if (path === "/notifications" && request.method === "GET") {
      return await handleAdminNotificationsGet(sql, env, request);
    }
    if (path === "/notifications" && request.method === "POST") {
      return await handleAdminNotificationsMarkRead(sql, env, request);
    }

    if (path === "/push/subscribe" && request.method === "POST") {
      return await handleAdminPushSubscribe(sql, env, request);
    }
    if (path === "/push/subscribe" && request.method === "DELETE") {
      return await handleAdminPushUnsubscribe(sql, env, request);
    }

    if (path === "/registrations" && request.method === "GET") {
      return await handleRegistrationsList(sql, env, request);
    }
    if (path === "/registrations/export" && request.method === "GET") {
      return await handleRegistrationsExportCsv(sql, env, request);
    }

    const regReview = path.match(/^\/registrations\/([^/]+)\/review$/);
    if (regReview && request.method === "POST") {
      return await handleRegistrationReview(sql, env, request, decodeURIComponent(regReview[1]!));
    }

    const regOne = path.match(/^\/registrations\/([^/]+)$/);
    if (regOne) {
      const id = decodeURIComponent(regOne[1]!);
      if (request.method === "GET") return await handleRegistrationGet(sql, env, request, id);
      if (request.method === "DELETE") {
        return await handleRegistrationDelete(sql, env, request, id);
      }
    }

    if (path === "/industries" && request.method === "GET") {
      return await handleIndustriesList(sql, env, request);
    }

    if (path === "/vendors" && request.method === "GET") {
      return await handleVendorsList(sql, env, request);
    }
    if (path === "/vendors" && request.method === "POST") {
      return await handleVendorCreate(sql, env, request);
    }

    if (path === "/requirements" && request.method === "GET") {
      return await handleRequirementsList(sql, env, request);
    }
    if (path === "/requirements" && request.method === "POST") {
      return await handleRequirementCreate(sql, env, request);
    }
    if (path === "/requirements/stats" && request.method === "GET") {
      return await handleRequirementStats(sql, env, request);
    }

    const reqAward = path.match(/^\/requirements\/([^/]+)\/award$/);
    if (reqAward && request.method === "POST") {
      return await handleRequirementAward(sql, env, request, decodeURIComponent(reqAward[1]!));
    }

    const reqCollect = path.match(/^\/requirements\/([^/]+)\/collect-quotations$/);
    if (reqCollect && request.method === "POST") {
      return await handleCollectQuotations(sql, env, request, decodeURIComponent(reqCollect[1]!));
    }
    const reqAttachments = path.match(/^\/requirements\/([^/]+)\/attachments$/);
    if (reqAttachments && request.method === "POST") {
      const { handleRequirementAttachmentUpload } = await import(
        "../modules/sourcing/controllers/sourcing.files.controller"
      );
      return await handleRequirementAttachmentUpload(
        sql,
        env,
        request,
        decodeURIComponent(reqAttachments[1]!)
      );
    }
    const reqFile = path.match(/^\/requirements\/([^/]+)\/files\/([^/]+)$/);
    if (reqFile && request.method === "GET") {
      const { handleAdminFileDownload } = await import(
        "../modules/sourcing/controllers/sourcing.files.controller"
      );
      return await handleAdminFileDownload(
        sql,
        env,
        request,
        decodeURIComponent(reqFile[1]!),
        decodeURIComponent(reqFile[2]!)
      );
    }
    const reqSubmit = path.match(/^\/requirements\/([^/]+)\/submit$/);
    if (reqSubmit && request.method === "POST") {
      return await handleSubmitToAdmin(sql, env, request, decodeURIComponent(reqSubmit[1]!));
    }
    const reqManualQuoteFile = path.match(
      /^\/requirements\/([^/]+)\/manual-quotes\/([^/]+)\/attachments$/
    );
    if (reqManualQuoteFile && request.method === "POST") {
      const { handleManualQuoteAttachmentUpload } = await import(
        "../modules/sourcing/controllers/sourcing.files.controller"
      );
      return await handleManualQuoteAttachmentUpload(
        sql,
        env,
        request,
        decodeURIComponent(reqManualQuoteFile[1]!),
        decodeURIComponent(reqManualQuoteFile[2]!)
      );
    }
    const reqManualQuoteOne = path.match(/^\/requirements\/([^/]+)\/manual-quotes\/([^/]+)$/);
    if (reqManualQuoteOne && (request.method === "PUT" || request.method === "PATCH")) {
      return await handleManualQuoteRelink(
        sql,
        env,
        request,
        decodeURIComponent(reqManualQuoteOne[1]!),
        decodeURIComponent(reqManualQuoteOne[2]!)
      );
    }
    if (reqManualQuoteOne && request.method === "DELETE") {
      return await handleManualQuoteDelete(
        sql,
        env,
        request,
        decodeURIComponent(reqManualQuoteOne[1]!),
        decodeURIComponent(reqManualQuoteOne[2]!)
      );
    }
    const reqManualQuotes = path.match(/^\/requirements\/([^/]+)\/manual-quotes$/);
    if (reqManualQuotes && request.method === "GET") {
      return await handleManualQuotesList(sql, env, request, decodeURIComponent(reqManualQuotes[1]!));
    }
    if (reqManualQuotes && request.method === "POST") {
      return await handleManualQuoteCreate(sql, env, request, decodeURIComponent(reqManualQuotes[1]!));
    }
    const reqBidConfig = path.match(/^\/requirements\/([^/]+)\/bid-config$/);
    if (reqBidConfig && request.method === "POST") {
      return await handleBidConfig(sql, env, request, decodeURIComponent(reqBidConfig[1]!));
    }
    const reqInvites = path.match(/^\/requirements\/([^/]+)\/invites$/);
    if (reqInvites && request.method === "POST") {
      return await handleInviteSuppliers(sql, env, request, decodeURIComponent(reqInvites[1]!));
    }
    const reqOpen = path.match(/^\/requirements\/([^/]+)\/open$/);
    if (reqOpen && request.method === "POST") {
      return await handleOpenBidding(sql, env, request, decodeURIComponent(reqOpen[1]!));
    }
    const reqClose = path.match(/^\/requirements\/([^/]+)\/close$/);
    if (reqClose && request.method === "POST") {
      return await handleCloseBidding(sql, env, request, decodeURIComponent(reqClose[1]!));
    }
    const reqEvaluate = path.match(/^\/requirements\/([^/]+)\/evaluate$/);
    if (reqEvaluate && request.method === "POST") {
      return await handleStartEvaluation(sql, env, request, decodeURIComponent(reqEvaluate[1]!));
    }
    const reqQuoteAction = path.match(/^\/requirements\/([^/]+)\/quotes\/([^/]+)\/action$/);
    if (reqQuoteAction && request.method === "POST") {
      return await handleQuoteAction(
        sql,
        env,
        request,
        decodeURIComponent(reqQuoteAction[1]!),
        decodeURIComponent(reqQuoteAction[2]!)
      );
    }
    const reqComparison = path.match(/^\/requirements\/([^/]+)\/comparison$/);
    if (reqComparison && request.method === "GET") {
      return await handleComparison(sql, env, request, decodeURIComponent(reqComparison[1]!));
    }
    const reqActivity = path.match(/^\/requirements\/([^/]+)\/activity$/);
    if (reqActivity && request.method === "GET") {
      return await handleActivity(sql, env, request, decodeURIComponent(reqActivity[1]!));
    }

    const reqLiveBids = path.match(/^\/requirements\/([^/]+)\/live-bids$/);
    if (reqLiveBids && request.method === "GET") {
      return await handleAdminLiveBids(sql, env, request, decodeURIComponent(reqLiveBids[1]!));
    }

    if (path === "/bidding/fx-sync" && request.method === "POST") {
      const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
      if (deny) return deny;
      const { syncExchangeRates } = await import("../modules/sourcing/bidding/fx.service");
      await syncExchangeRates();
      return json(env, request, { ok: true, message: "Exchange rates synchronized successfully" });
    }

    const reqExport = path.match(/^\/requirements\/([^/]+)\/export$/);
    if (reqExport && request.method === "GET") {
      return await handleRequirementExportCsv(sql, env, request, decodeURIComponent(reqExport[1]!));
    }

    const requirementOne = path.match(/^\/requirements\/([^/]+)$/);
    if (requirementOne && request.method === "GET") {
      return await handleRequirementGet(sql, env, request, decodeURIComponent(requirementOne[1]!));
    }
    if (requirementOne && request.method === "PUT") {
      return await handleRequirementUpdate(sql, env, request, decodeURIComponent(requirementOne[1]!));
    }
    if (requirementOne && request.method === "DELETE") {
      return await handleRequirementDelete(sql, env, request, decodeURIComponent(requirementOne[1]!));
    }

    const vendorReset = path.match(/^\/vendors\/([^/]+)\/reset-password$/);
    if (vendorReset && request.method === "POST") {
      return await handleVendorResetPassword(
        sql,
        env,
        request,
        decodeURIComponent(vendorReset[1]!)
      );
    }

    const vendorOne = path.match(/^\/vendors\/([^/]+)$/);
    if (vendorOne) {
      if (request.method === "GET") {
        return await handleVendorGet(sql, env, request, decodeURIComponent(vendorOne[1]!));
      }
      if (request.method === "PATCH") {
        return await handleVendorPatch(sql, env, request, decodeURIComponent(vendorOne[1]!));
      }
      if (request.method === "DELETE") {
        return await handleVendorDelete(sql, env, request, decodeURIComponent(vendorOne[1]!));
      }
    }

    if (path === "/procurement" && request.method === "GET") {
      return await handleProcurementList(sql, env, request);
    }
    if (path === "/procurement" && request.method === "POST") {
      return await handleProcurementCreate(sql, env, request);
    }

    const procurementReview = path.match(/^\/procurement\/([^/]+)\/review$/);
    if (procurementReview && request.method === "POST") {
      return await handleProcurementReview(
        sql,
        env,
        request,
        decodeURIComponent(procurementReview[1]!)
      );
    }

    const procurementOne = path.match(/^\/procurement\/([^/]+)$/);
    if (procurementOne) {
      if (request.method === "GET") {
        return await handleProcurementGet(
          sql,
          env,
          request,
          decodeURIComponent(procurementOne[1]!)
        );
      }
      if (request.method === "DELETE") {
        return await handleProcurementDelete(
          sql,
          env,
          request,
          decodeURIComponent(procurementOne[1]!)
        );
      }
    }

    // Staff & Admin Management Routes
    if (path === "/staff/otp/request" && request.method === "POST") {
      return await handleStaffOtpRequest(sql, env, request);
    }
    if (path === "/staff" && request.method === "GET") {
      return await handleStaffList(sql, env, request);
    }
    if (path === "/staff" && request.method === "POST") {
      return await handleStaffCreate(sql, env, request);
    }
    const staffPassword = path.match(/^\/staff\/([^/]+)\/password$/);
    if (staffPassword && request.method === "POST") {
      return await handleStaffPasswordReset(
        sql,
        env,
        request,
        decodeURIComponent(staffPassword[1]!)
      );
    }
    const staffOne = path.match(/^\/staff\/([^/]+)$/);
    if (staffOne) {
      if (request.method === "PATCH") {
        return await handleStaffUpdate(sql, env, request, decodeURIComponent(staffOne[1]!));
      }
      if (request.method === "DELETE") {
        return await handleStaffDelete(sql, env, request, decodeURIComponent(staffOne[1]!));
      }
    }

    if (path === "/careers" && request.method === "GET") {
      return await handleCareersList(sql, env, request);
    }
    if (path === "/careers" && request.method === "POST") {
      return await handleCareerCreate(sql, env, request);
    }

    const careerApplications = path.match(/^\/careers\/([^/]+)\/applications$/);
    if (careerApplications && request.method === "GET") {
      return await handleCareerApplicationsList(
        sql,
        env,
        request,
        decodeURIComponent(careerApplications[1]!)
      );
    }

    const careerOne = path.match(/^\/careers\/([^/]+)$/);
    if (careerOne) {
      const id = decodeURIComponent(careerOne[1]!);
      if (request.method === "GET") return await handleCareerGet(sql, env, request, id);
      if (request.method === "PATCH") return await handleCareerPatch(sql, env, request, id);
      if (request.method === "DELETE") return await handleCareerDelete(sql, env, request, id);
    }

    if (path === "/dashboard" && request.method === "GET") {
      return await handleDashboard(sql, env, request);
    }

    // Hero Slides Content Routes
    if (path === "/hero-slides" && request.method === "GET") {
      const { handleAdminHeroSlidesList } = await import("../modules/content/hero/hero.controller");
      return await handleAdminHeroSlidesList(sql, env, request);
    }
    if (path === "/hero-slides" && request.method === "POST") {
      const { handleAdminHeroSlideCreate } = await import("../modules/content/hero/hero.controller");
      return await handleAdminHeroSlideCreate(sql, env, request);
    }
    if (path === "/hero-slides/reorder" && request.method === "PUT") {
      const { handleAdminHeroSlidesReorder } = await import("../modules/content/hero/hero.controller");
      return await handleAdminHeroSlidesReorder(sql, env, request);
    }
    const heroPageMatch = path.match(/^\/hero-slides\/page\/([^/]+)$/);
    if (heroPageMatch && (request.method === "PUT" || request.method === "POST")) {
      const page = decodeURIComponent(heroPageMatch[1]!);
      const { handleAdminPageHeroUpsert } = await import("../modules/content/hero/hero.controller");
      return await handleAdminPageHeroUpsert(sql, env, request, page);
    }
    const heroOne = path.match(/^\/hero-slides\/([^/]+)$/);
    if (heroOne) {
      const id = decodeURIComponent(heroOne[1]!);
      const {
        handleAdminHeroSlideGet,
        handleAdminHeroSlideUpdate,
        handleAdminHeroSlideDelete,
      } = await import("../modules/content/hero/hero.controller");
      if (request.method === "GET") return await handleAdminHeroSlideGet(sql, env, request, id);
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminHeroSlideUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") return await handleAdminHeroSlideDelete(sql, env, request, id);
    }

    // Client Partner Content Routes
    if (path === "/clients" && request.method === "GET") {
      const { handleAdminClientsList } = await import("../modules/content/clients/clients.controller");
      return await handleAdminClientsList(sql, env, request);
    }
    if (path === "/clients" && request.method === "POST") {
      const { handleAdminClientCreate } = await import("../modules/content/clients/clients.controller");
      return await handleAdminClientCreate(sql, env, request);
    }
    if (path === "/clients/reorder" && request.method === "PUT") {
      const { handleAdminClientsReorder } = await import("../modules/content/clients/clients.controller");
      return await handleAdminClientsReorder(sql, env, request);
    }
    const clientOne = path.match(/^\/clients\/([^/]+)$/);
    if (clientOne) {
      const id = decodeURIComponent(clientOne[1]!);
      const {
        handleAdminClientGet,
        handleAdminClientUpdate,
        handleAdminClientDelete,
      } = await import("../modules/content/clients/clients.controller");
      if (request.method === "GET") return await handleAdminClientGet(sql, env, request, id);
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminClientUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") return await handleAdminClientDelete(sql, env, request, id);
    }

    // Sister Concern Companies Content Routes
    if (path === "/companies" && request.method === "GET") {
      const { handleAdminCompaniesList } = await import("../modules/content/companies/companies.controller");
      return await handleAdminCompaniesList(sql, env, request);
    }
    if (path === "/companies" && request.method === "POST") {
      const { handleAdminCompanyCreate } = await import("../modules/content/companies/companies.controller");
      return await handleAdminCompanyCreate(sql, env, request);
    }
    if (path === "/companies/reorder" && request.method === "PUT") {
      const { handleAdminCompaniesReorder } = await import("../modules/content/companies/companies.controller");
      return await handleAdminCompaniesReorder(sql, env, request);
    }
    const companyOne = path.match(/^\/companies\/([^/]+)$/);
    if (companyOne) {
      const id = decodeURIComponent(companyOne[1]!);
      const {
        handleAdminCompanyGet,
        handleAdminCompanyUpdate,
        handleAdminCompanyDelete,
      } = await import("../modules/content/companies/companies.controller");
      if (request.method === "GET") return await handleAdminCompanyGet(sql, env, request, id);
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminCompanyUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") return await handleAdminCompanyDelete(sql, env, request, id);
    }

    // Projects Content Routes
    if (path === "/projects" && request.method === "GET") {
      const { handleAdminProjectsList } = await import("../modules/content/projects/projects.controller");
      return await handleAdminProjectsList(sql, env, request);
    }
    if (path === "/projects" && request.method === "POST") {
      const { handleAdminProjectCreate } = await import("../modules/content/projects/projects.controller");
      return await handleAdminProjectCreate(sql, env, request);
    }
    if (path === "/projects/reorder" && request.method === "PUT") {
      const { handleAdminProjectsReorder } = await import("../modules/content/projects/projects.controller");
      return await handleAdminProjectsReorder(sql, env, request);
    }
    const projectOne = path.match(/^\/projects\/([^/]+)$/);
    if (projectOne) {
      const id = decodeURIComponent(projectOne[1]!);
      const {
        handleAdminProjectGet,
        handleAdminProjectUpdate,
        handleAdminProjectDelete,
      } = await import("../modules/content/projects/projects.controller");
      if (request.method === "GET") return await handleAdminProjectGet(sql, env, request, id);
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminProjectUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") return await handleAdminProjectDelete(sql, env, request, id);
    }

    // Gallery Content Routes
    if (path === "/gallery" && request.method === "GET") {
      const { handleAdminGalleryImagesList } = await import("../modules/content/gallery/gallery.controller");
      return await handleAdminGalleryImagesList(sql, env, request);
    }
    if (path === "/gallery" && request.method === "POST") {
      const { handleAdminGalleryImageCreate } = await import("../modules/content/gallery/gallery.controller");
      return await handleAdminGalleryImageCreate(sql, env, request);
    }
    if (path === "/gallery/reorder" && request.method === "PUT") {
      const { handleAdminGalleryImagesReorder } = await import("../modules/content/gallery/gallery.controller");
      return await handleAdminGalleryImagesReorder(sql, env, request);
    }
    const galleryOne = path.match(/^\/gallery\/([^/]+)$/);
    if (galleryOne) {
      const id = decodeURIComponent(galleryOne[1]!);
      const {
        handleAdminGalleryImageUpdate,
        handleAdminGalleryImageDelete,
      } = await import("../modules/content/gallery/gallery.controller");
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminGalleryImageUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") return await handleAdminGalleryImageDelete(sql, env, request, id);
    }

    // Services Content Routes
    if (path === "/services" && request.method === "GET") {
      const { handleAdminServicesList } = await import("../modules/content/services/services.controller");
      return await handleAdminServicesList(sql, env, request);
    }
    if (path === "/services" && request.method === "POST") {
      const { handleAdminServiceCreate } = await import("../modules/content/services/services.controller");
      return await handleAdminServiceCreate(sql, env, request);
    }
    if (path === "/services/reorder" && request.method === "PUT") {
      const { handleAdminServicesReorder } = await import("../modules/content/services/services.controller");
      return await handleAdminServicesReorder(sql, env, request);
    }
    const serviceOne = path.match(/^\/services\/([^/]+)$/);
    if (serviceOne) {
      const id = decodeURIComponent(serviceOne[1]!);
      const {
        handleAdminServiceGet,
        handleAdminServiceUpdate,
        handleAdminServiceDelete,
      } = await import("../modules/content/services/services.controller");
      if (request.method === "GET") return await handleAdminServiceGet(sql, env, request, id);
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminServiceUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") return await handleAdminServiceDelete(sql, env, request, id);
    }

    // News & Events Content Routes
    if (path === "/news" && request.method === "GET") {
      const { handleAdminNewsList } = await import("../modules/content/news/news.controller");
      return await handleAdminNewsList(sql, env, request);
    }
    if (path === "/news" && request.method === "POST") {
      const { handleAdminNewsCreate } = await import("../modules/content/news/news.controller");
      return await handleAdminNewsCreate(sql, env, request);
    }
    if (path === "/news/reorder" && (request.method === "PUT" || request.method === "POST")) {
      const { handleAdminNewsReorder } = await import("../modules/content/news/news.controller");
      return await handleAdminNewsReorder(sql, env, request);
    }
    const newsOne = path.match(/^\/news\/([^/]+)$/);
    if (newsOne) {
      const id = decodeURIComponent(newsOne[1]!);
      const {
        handleAdminNewsGet,
        handleAdminNewsUpdate,
        handleAdminNewsDelete,
      } = await import("../modules/content/news/news.controller");
      if (request.method === "GET") return await handleAdminNewsGet(sql, env, request, id);
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminNewsUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") return await handleAdminNewsDelete(sql, env, request, id);
    }

    // Public Media Upload for Admin Content (Gallery, Hero, Projects, Services, etc.)
    if (path === "/content/upload" && request.method === "POST") {
      const { handleAdminContentMediaUpload } = await import("../modules/content/media/media.controller");
      return await handleAdminContentMediaUpload(sql, env, request);
    }

    // ── About Content Routes ────────────────────────────────────────────────
    if (path === "/about" && request.method === "GET") {
      const { handleAdminAboutGet } = await import("../modules/content/about/about.controller");
      return await handleAdminAboutGet(sql, env, request);
    }
    if (path === "/about" && (request.method === "PUT" || request.method === "PATCH")) {
      const { handleAdminAboutUpdate } = await import("../modules/content/about/about.controller");
      return await handleAdminAboutUpdate(sql, env, request);
    }
    if (path === "/about/upload" && request.method === "POST") {
      const { handleAdminAboutMediaUpload } = await import("../modules/content/about/about.controller");
      return await handleAdminAboutMediaUpload(sql, env, request);
    }

    // ── Company Documents Content Routes ────────────────────────────────────
    if (path === "/documents" && request.method === "GET") {
      const { handleAdminDocumentsList } = await import("../modules/documents/controllers/documents.admin.controller");
      return await handleAdminDocumentsList(sql, env, request);
    }
    if (path === "/documents" && request.method === "POST") {
      const { handleAdminDocumentCreate } = await import("../modules/documents/controllers/documents.admin.controller");
      return await handleAdminDocumentCreate(sql, env, request);
    }
    if (path === "/documents/reorder" && request.method === "PUT") {
      const { handleAdminDocumentsReorder } = await import("../modules/documents/controllers/documents.admin.controller");
      return await handleAdminDocumentsReorder(sql, env, request);
    }
    if (path === "/documents/upload" && request.method === "POST") {
      const { handleAdminDocumentUpload } = await import("../modules/documents/controllers/documents.admin.controller");
      return await handleAdminDocumentUpload(sql, env, request);
    }
    const documentOne = path.match(/^\/documents\/([^/]+)$/);
    if (documentOne) {
      const id = decodeURIComponent(documentOne[1]!);
      const {
        handleAdminDocumentGet,
        handleAdminDocumentUpdate,
        handleAdminDocumentDelete,
      } = await import("../modules/documents/controllers/documents.admin.controller");
      if (request.method === "GET") return await handleAdminDocumentGet(sql, env, request, id);
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminDocumentUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") return await handleAdminDocumentDelete(sql, env, request, id);
    }

    // ── File Manager (Folders & Files) ───────────────────────────────────────
    if (path === "/folders") {
      const { handleAdminFoldersList, handleAdminFolderCreate } = await import(
        "../modules/file-manager/controllers/file-manager.admin.controller"
      );
      if (request.method === "GET") return await handleAdminFoldersList(sql, env, request);
      if (request.method === "POST") return await handleAdminFolderCreate(sql, env, request);
    }

    const folderMatch = path.match(/^\/folders\/([^/]+)$/);
    if (folderMatch) {
      const id = folderMatch[1];
      const { handleAdminFolderUpdate, handleAdminFolderDelete } = await import(
        "../modules/file-manager/controllers/file-manager.admin.controller"
      );
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminFolderUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") {
        return await handleAdminFolderDelete(sql, env, request, id);
      }
    }

    if (path === "/files") {
      const { handleAdminFilesList } = await import("../modules/file-manager/controllers/file-manager.admin.controller");
      if (request.method === "GET") return await handleAdminFilesList(sql, env, request);
    }

    if (path === "/files/upload" && request.method === "POST") {
      const { handleAdminFileUpload } = await import("../modules/file-manager/controllers/file-manager.admin.controller");
      return await handleAdminFileUpload(sql, env, request);
    }

    const fileMatch = path.match(/^\/files\/([^/]+)$/);
    if (fileMatch) {
      const id = fileMatch[1];
      const { handleAdminFileUpdate, handleAdminFileDelete } = await import(
        "../modules/file-manager/controllers/file-manager.admin.controller"
      );
      if (request.method === "PUT" || request.method === "PATCH") {
        return await handleAdminFileUpdate(sql, env, request, id);
      }
      if (request.method === "DELETE") {
        return await handleAdminFileDelete(sql, env, request, id);
      }
    }

    return json(env, request, { error: "Not Found" }, 404);
  } catch (err) {
    console.error("[admin]", err);
    return json(env, request, { error: "Internal error" }, 500);
  } finally {
    await releaseSql(sql);
  }
}
