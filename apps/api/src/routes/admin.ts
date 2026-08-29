import type { Env } from "../config/env";
import { corsHeaders, json } from "../lib/http";
import { createSql } from "../modules/admin/db";
import { releaseSql } from "../lib/sql";
import {
  handleCareerCreate,
  handleCareerDelete,
  handleCareerApplicationsList,
  handleCareerGet,
  handleCareerPatch,
  handleCareersList,
  handleDashboard,
  handleIndustriesList,
  handleLogin,
  handleLogout,
  handleMe,
  handleRegistrationDelete,
  handleRegistrationGet,
  handleRegistrationReview,
  handleRegistrationsList,
  handleRequirementAward,
  handleRequirementCreate,
  handleRequirementGet,
  handleRequirementsList,
  handleVendorCreate,
  handleVendorGet,
  handleVendorPatch,
  handleVendorResetPassword,
  handleVendorsList,
} from "../modules/admin/handlers";
import {
  handleAdminChangePasswordWithCurrent,
  handleAdminChangePasswordRequestOtp,
  handleAdminChangePasswordVerify,
} from "../modules/admin/change-password";
import {
  handleAdminNotificationsGet,
  handleAdminNotificationsMarkRead,
} from "../modules/admin/notifications";
import {
  handleProcurementCreate,
  handleProcurementDelete,
  handleProcurementGet,
  handleProcurementList,
  handleProcurementReview,
} from "../modules/admin/procurement";
import { handleAdminLiveBids } from "../modules/bidding/live-bids";
import {
  handleStaffCreate,
  handleStaffDelete,
  handleStaffList,
  handleStaffOtpRequest,
  handleStaffPasswordReset,
  handleStaffUpdate,
} from "../modules/admin/staff";




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
      return await handleLogin(sql, env, request);
    }
    if (path === "/auth/logout" && request.method === "POST") {
      return await handleLogout(sql, env, request);
    }
    if (path === "/auth/me" && request.method === "GET") {
      return await handleMe(sql, env, request);
    }
    if (path === "/auth/change-password/reset" && request.method === "POST") {
      return await handleAdminChangePasswordWithCurrent(sql, env, request);
    }
    if (path === "/auth/change-password/request-otp" && request.method === "POST") {
      return await handleAdminChangePasswordRequestOtp(sql, env, request);
    }
    if (path === "/auth/change-password/verify" && request.method === "POST") {
      return await handleAdminChangePasswordVerify(sql, env, request);
    }

    if (path === "/notifications" && request.method === "GET") {
      return await handleAdminNotificationsGet(sql, env, request);
    }
    if (path === "/notifications" && request.method === "POST") {
      return await handleAdminNotificationsMarkRead(sql, env, request);
    }

    if (path === "/registrations" && request.method === "GET") {
      return await handleRegistrationsList(sql, env, request);
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

    const reqAward = path.match(/^\/requirements\/([^/]+)\/award$/);
    if (reqAward && request.method === "POST") {
      return await handleRequirementAward(sql, env, request, decodeURIComponent(reqAward[1]!));
    }

    const reqLiveBids = path.match(/^\/requirements\/([^/]+)\/live-bids$/);
    if (reqLiveBids && request.method === "GET") {
      return await handleAdminLiveBids(sql, env, request, decodeURIComponent(reqLiveBids[1]!));
    }

    const requirementOne = path.match(/^\/requirements\/([^/]+)$/);
    if (requirementOne && request.method === "GET") {
      return await handleRequirementGet(sql, env, request, decodeURIComponent(requirementOne[1]!));
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
    }

    if (path === "/procurement" && request.method === "GET") {
      return await handleProcurementList(sql, env, request);
    }
    if (path === "/procurement" && request.method === "POST") {
      return await handleProcurementCreate(sql, env, request);
    }

    const procurementReview = path.match(/^\/procurement\/([^/]+)\/review$/);
    if (procurementReview && request.method === "POST") {
      return await handleProcurementReview(sql, env, request, decodeURIComponent(procurementReview[1]!));
    }

    const procurementOne = path.match(/^\/procurement\/([^/]+)$/);
    if (procurementOne) {
      if (request.method === "GET") {
        return await handleProcurementGet(sql, env, request, decodeURIComponent(procurementOne[1]!));
      }
      if (request.method === "DELETE") {
        return await handleProcurementDelete(sql, env, request, decodeURIComponent(procurementOne[1]!));
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
      return await handleStaffPasswordReset(sql, env, request, decodeURIComponent(staffPassword[1]!));
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

    return json(env, request, { error: "Not Found" }, 404);
  } catch (err) {
    console.error("[admin]", err);
    return json(env, request, { error: "Internal error" }, 500);
  } finally {
    await releaseSql(sql);
  }
}
