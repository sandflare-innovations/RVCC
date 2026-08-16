import { type Env, assertApiSecret, corsHeaders, json, unauthorized } from "./cors";
import { createSql } from "./db";
import {
  handleCareerCreate,
  handleCareerDelete,
  handleCareerGet,
  handleCareerPatch,
  handleCareersList,
  handleDashboard,
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
  handleVendorPatch,
  handleVendorResetPassword,
  handleVendorsList,
} from "./handlers";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // Public liveness only — no service name, DB mode, or config hints.
    if (path === "/" || path === "/health") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return json(env, request, { error: "Method Not Allowed" }, 405);
      }
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
      });
    }

    // Login is public (BFF or direct); every other data route needs API_SECRET.
    const isLogin = path === "/auth/login" && request.method === "POST";
    if (!isLogin && !assertApiSecret(request, env)) {
      return unauthorized(env, request);
    }

    let sql;
    try {
      sql = createSql(env);
    } catch (err) {
      console.error(err);
      return json(env, request, { error: "Service unavailable" }, 503);
    }

    try {
      if (isLogin) {
        return await handleLogin(sql, env, request);
      }
      if (path === "/auth/logout" && request.method === "POST") {
        return await handleLogout(sql, env, request);
      }
      if (path === "/auth/me" && request.method === "GET") {
        return await handleMe(sql, env, request);
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

      // The /award pattern must be matched before the bare :id pattern, or the
      // literal string "award" is read as a requirement id.
      const reqAward = path.match(/^\/requirements\/([^/]+)\/award$/);
      if (reqAward && request.method === "POST") {
        return await handleRequirementAward(sql, env, request, decodeURIComponent(reqAward[1]!));
      }

      const requirementOne = path.match(/^\/requirements\/([^/]+)$/);
      if (requirementOne && request.method === "GET") {
        return await handleRequirementGet(
          sql,
          env,
          request,
          decodeURIComponent(requirementOne[1]!)
        );
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
      if (vendorOne && request.method === "PATCH") {
        return await handleVendorPatch(sql, env, request, decodeURIComponent(vendorOne[1]!));
      }

      if (path === "/careers" && request.method === "GET") {
        return await handleCareersList(sql, env, request);
      }
      if (path === "/careers" && request.method === "POST") {
        return await handleCareerCreate(sql, env, request);
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
      console.error("[admin-api]", err);
      return json(env, request, { error: "Internal error" }, 500);
    } finally {
      try {
        await sql.end({ timeout: 2 });
      } catch {
        /* ignore */
      }
    }
  },
} satisfies ExportedHandler<Env>;
