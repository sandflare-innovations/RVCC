import type { Env } from "../../../config/env";
import { json } from "../../../lib/http";
import { getVendorFromSession } from "../../auth/services/vendor-auth.service";
import { VendorPortalService } from "./portal.service";

function vendorSessionFrom(request: Request): string | null {
  return request.headers.get("X-Vendor-Session");
}

export class VendorPortalController {
  static async handleDashboard(sql: unknown, env: Env, request: Request): Promise<Response> {
    const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

    const payload = await VendorPortalService.getVendorDashboard(vendor);
    return json(env, request, payload);
  }

  static async handleRequirementsList(
    sql: unknown,
    env: Env,
    request: Request
  ): Promise<Response> {
    const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

    const rows = await VendorPortalService.listOpenForVendor(vendor.id);
    return json(env, request, { requirements: rows });
  }

  static async handleRequirementGet(
    sql: unknown,
    env: Env,
    request: Request,
    id: string
  ): Promise<Response> {
    const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

    const row = await VendorPortalService.getOneForVendor(id, vendor.id);
    if (!row) {
      return json(env, request, { error: "Requirement not found." }, 404);
    }
    return json(env, request, { requirement: row });
  }

  static async handleQuoteSave(
    sql: unknown,
    env: Env,
    request: Request,
    requirementId: string
  ): Promise<Response> {
    try {
      const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
      if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

      const body = (await request.json().catch(() => ({}))) as {
        newPrice?: string | number | null;
        currency?: string;
        remarks?: string;
        submit?: boolean;
      };

      const result = await VendorPortalService.saveQuote(env, vendor.id, requirementId, body);

      if ("error" in result) {
        return json(env, request, { error: result.error }, result.status || 400);
      }

      return json(env, request, result);
    } catch (err) {
      console.error("[vendor/handleQuoteSave] error:", err);
      return json(env, request, { error: (err as Error).message || "Failed to save quote" }, 500);
    }
  }

  static async handleQuoteAttachmentUpload(
    sql: unknown,
    env: Env,
    request: Request,
    requirementId: string
  ): Promise<Response> {
    const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return json(env, request, { error: "Expected multipart form data" }, 400);
    }

    const file = form.get("file");
    const { isUploadFile } = await import("../../../lib/storage");
    if (!isUploadFile(file)) {
      return json(env, request, { error: "File is required" }, 400);
    }

    const res = await VendorPortalService.uploadQuoteAttachment(env, vendor.id, requirementId, file);
    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, res);
  }

  static async handleQuoteAttachmentDelete(
    sql: unknown,
    env: Env,
    request: Request,
    requirementId: string,
    attachmentId: string
  ): Promise<Response> {
    const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

    const res = await VendorPortalService.deleteQuoteAttachment(env, vendor.id, requirementId, attachmentId);
    if ("error" in res) {
      return json(env, request, { error: res.error }, res.status || 400);
    }

    return json(env, request, res);
  }

  static async handleQuoteAttachmentDownload(
    sql: unknown,
    env: Env,
    request: Request,
    requirementId: string,
    attachmentId: string
  ): Promise<Response> {
    const vendor = await getVendorFromSession(sql, vendorSessionFrom(request));
    if (!vendor) return json(env, request, { error: "Not signed in." }, 401);

    const asDownload = new URL(request.url).searchParams.get("download") === "1";
    const { SourcingFilesService } = await import("../../sourcing/services/sourcing-files.service");
    const result = await SourcingFilesService.downloadVendorQuoteFile(
      env,
      request,
      requirementId,
      attachmentId,
      vendor.id,
      asDownload
    );
    if ("error" in result) return json(env, request, { error: result.error }, result.status);
    return result.response;
  }
}

export const handleDashboard = VendorPortalController.handleDashboard;
export const handleRequirementsList = VendorPortalController.handleRequirementsList;
export const handleRequirementGet = VendorPortalController.handleRequirementGet;
export const handleQuoteSave = VendorPortalController.handleQuoteSave;
export const handleQuoteAttachmentUpload = VendorPortalController.handleQuoteAttachmentUpload;
export const handleQuoteAttachmentDelete = VendorPortalController.handleQuoteAttachmentDelete;
export const handleQuoteAttachmentDownload = VendorPortalController.handleQuoteAttachmentDownload;
