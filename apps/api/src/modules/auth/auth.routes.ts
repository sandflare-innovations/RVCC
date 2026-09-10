import { Hono } from "hono";
import type { Env } from "../../config/env";
import {
  handleLogin,
  handleLogout,
  handleMe,
} from "./controllers/admin-auth.controller";
import {
  handleAdminChangePasswordRequestOtp,
  handleAdminChangePasswordVerify,
  handleAdminChangePasswordWithCurrent,
} from "./controllers/password.controller";
import {
  handleRoleCreate,
  handleRoleList,
  handleStaffCreate,
  handleStaffDelete,
  handleStaffList,
  handleStaffOtpRequest,
  handleStaffPasswordReset,
  handleStaffUpdate,
} from "./controllers/staff.controller";
import {
  handleVendorLogin,
  handleVendorLogout,
  handleVendorMe,
  handleVendorPassword,
} from "./controllers/vendor-auth.controller";

export function createAdminAuthRouter(env: Env) {
  const router = new Hono();

  // Admin session routes
  router.post("/auth/login", (c) => handleLogin(null, env, c.req.raw));
  router.post("/auth/logout", (c) => handleLogout(null, env, c.req.raw));
  router.get("/auth/me", (c) => handleMe(null, env, c.req.raw));

  // Admin password reset routes
  router.post("/auth/change-password/reset", (c) =>
    handleAdminChangePasswordWithCurrent(null, env, c.req.raw)
  );
  router.post("/auth/change-password/otp/request", (c) =>
    handleAdminChangePasswordRequestOtp(null, env, c.req.raw)
  );
  router.post("/auth/change-password/otp/verify", (c) =>
    handleAdminChangePasswordVerify(null, env, c.req.raw)
  );

  // Admin staff management routes
  router.get("/staff", (c) => handleStaffList(null, env, c.req.raw));
  router.post("/staff", (c) => handleStaffCreate(null, env, c.req.raw));
  router.get("/staff/roles", (c) => handleRoleList(null, env, c.req.raw));
  router.post("/staff/roles", (c) => handleRoleCreate(null, env, c.req.raw));
  router.post("/staff/otp/request", (c) =>
    handleStaffOtpRequest(null, env, c.req.raw)
  );
  router.patch("/staff/:id", (c) =>
    handleStaffUpdate(null, env, c.req.raw, c.req.param("id"))
  );
  router.post("/staff/:id/password", (c) =>
    handleStaffPasswordReset(null, env, c.req.raw, c.req.param("id"))
  );
  router.delete("/staff/:id", (c) =>
    handleStaffDelete(null, env, c.req.raw, c.req.param("id"))
  );

  return router;
}

export function createVendorAuthRouter(env: Env) {
  const router = new Hono();

  router.post("/login", (c) => handleVendorLogin(null, env, c.req.raw));
  router.post("/logout", (c) => handleVendorLogout(null, env, c.req.raw));
  router.get("/me", (c) => handleVendorMe(null, env, c.req.raw));
  router.post("/password", (c) => handleVendorPassword(null, env, c.req.raw));

  return router;
}
