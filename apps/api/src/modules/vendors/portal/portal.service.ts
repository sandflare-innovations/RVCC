import type { Env } from "../../../config/env";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { writeAudit } from "../../auth";
import { broadcastBidUpdate } from "../../sourcing/bidding/live-bids.controller";
import { computeMoneyBreakdown, toSarAmount } from "../../sourcing/lib/money";
import { isBiddingLive, isPastDeadline, negotiationPhase, VENDOR_VISIBLE_STATUSES } from "../../sourcing/lib/status-machine";
import { attachmentDto } from "../../sourcing/services/sourcing-files.service";
import {
  deleteUpload,
  extractStorageKeyFromUrl,
  keyFromStoredUrl,
  MAX_SOURCING_UPLOAD_BYTES,
  putUpload,
  resolveSourcingMime,
  storedUrlForKey,
  storageKeyForQuote,
  uploadStorageConfigured,
} from "../../../lib/storage";

export class VendorPortalService {
  /**
   * Requirements this vendor may see
   */
  static async listOpenForVendor(vendorUserId: string) {
    const requirements = await prisma.requirement.findMany({
      where: {
        deletedAt: null,
        status: { in: VENDOR_VISIBLE_STATUSES },
        invites: { some: { vendorUserId } },
      },
      include: {
        invites: {
          where: { vendorUserId },
        },
        quotes: {
          where: { vendorUserId },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return requirements.map((r) => {
      const q = r.quotes[0];
      const isAwardedToMe = Boolean(q?.id && r.awardedQuoteId === q.id);
      const isPastDeadline = r.closesAt ? new Date(r.closesAt).getTime() <= Date.now() : false;
      const isEnded = r.status === "AWARDED" || r.status === "CANCELLED" || isPastDeadline;

      let endedStatus: "WON" | "LOST" | "UNDER_EVALUATION" | "CANCELLED" | "EXPIRED" | null = null;
      if (isEnded) {
        if (r.status === "AWARDED") {
          endedStatus = isAwardedToMe ? "WON" : "LOST";
        } else if (r.status === "CANCELLED") {
          endedStatus = "CANCELLED";
        } else if (q?.status === "SUBMITTED") {
          endedStatus = "UNDER_EVALUATION";
        } else {
          endedStatus = "EXPIRED";
        }
      }

      return {
        id: r.id,
        referenceNumber: r.referenceNumber,
        scopeOfWork: r.scopeOfWork,
        project: r.project,
        currency: r.currency,
        closesAt: r.closesAt ? r.closesAt.toISOString() : null,
        status: r.status,
        isEnded,
        endedStatus,
        isAwardedToMe,
        awardedAt: r.awardedAt ? r.awardedAt.toISOString() : null,
        quoteId: q?.id ?? null,
        newPrice: q?.newPrice ? String(q.newPrice) : null,
        remarks: q?.remarks ?? null,
        quoteStatus: q?.status ?? null,
        submittedAt: q?.submittedAt ? q.submittedAt.toISOString() : null,
      };
    });
  }

  static async getOneForVendor(requirementId: string, vendorUserId: string) {
    const requirement = await prisma.requirement.findFirst({
      where: {
        id: requirementId,
        deletedAt: null,
        invites: { some: { vendorUserId } },
      },
      include: {
        quotes: {
          where: { vendorUserId },
          include: {
            attachments: {
              orderBy: { uploadedAt: "asc" },
            },
            revisions: { orderBy: { createdAt: "asc" } },
          },
          take: 1,
        },
        manualQuotations: {
          where: { vendorUserId, deletedAt: null },
          include: { attachments: { orderBy: { uploadedAt: "asc" } } },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    });

    if (!requirement) return null;

    await prisma.requirementInvite.updateMany({
      where: {
        requirementId,
        vendorUserId,
        viewedAt: null,
      },
      data: { inviteStatus: "VIEWED", viewedAt: new Date() },
    });

    const q = requirement.quotes[0];
    const previous = requirement.manualQuotations[0];
    const isAwardedToMe = Boolean(q?.id && requirement.awardedQuoteId === q.id);
    const pastDeadline = isPastDeadline(requirement.closesAt);
    const isEnded =
      requirement.status === "AWARDED" ||
      requirement.status === "CANCELLED" ||
      requirement.status === "BIDDING_CLOSED" ||
      pastDeadline;

    let endedStatus: "WON" | "LOST" | "UNDER_EVALUATION" | "CANCELLED" | "EXPIRED" | null = null;
    if (isEnded) {
      if (requirement.status === "AWARDED") {
        endedStatus = isAwardedToMe ? "WON" : "LOST";
      } else if (requirement.status === "CANCELLED") {
        endedStatus = "CANCELLED";
      } else if (q?.status === "SUBMITTED") {
        endedStatus = "UNDER_EVALUATION";
      } else {
        endedStatus = "EXPIRED";
      }
    }

    const quoteAttachments = q
      ? q.attachments.map((a) =>
          attachmentDto({
            id: a.id,
            requirementId,
            kind: "quote",
            fileName: a.fileName,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
            uploadedAt: a.uploadedAt,
            vendorId: vendorUserId,
            category: "quotation",
          })
        )
      : [];

    // Vendor downloads go through the quote-attachment BFF, not the admin files route.
    const vendorFilePath = (attachmentId: string) =>
      `/api/requirements/${requirementId}/quote/attachment/${attachmentId}`;
    const vendorAttachments = quoteAttachments.map((a) => ({
      ...a,
      downloadPath: vendorFilePath(a.id),
      fileUrl: vendorFilePath(a.id),
    }));

    return {
      id: requirement.id,
      referenceNumber: requirement.referenceNumber,
      title: requirement.title || requirement.project,
      project: requirement.project,
      description: requirement.description || requirement.scopeOfWork,
      scopeOfWork: requirement.scopeOfWork,
      specifications: requirement.specifications,
      quantity: Number(requirement.quantity ?? 1),
      unit: requirement.unit,
      deliveryLocation: requirement.deliveryLocation,
      termsAndConditions: requirement.termsAndConditions,
      requiredDocuments: requirement.requiredDocuments,
      allowBidRevisions: requirement.allowBidRevisions,
      revealCompetitorPrices: requirement.revealCompetitorPrices,
      revealTargetPrice: Boolean(requirement.revealTargetPrice),
      targetPrice: requirement.revealTargetPrice ? String(requirement.sellingPrice ?? "") : null,
      currency: requirement.currency,
      opensAt: requirement.opensAt?.toISOString() ?? null,
      closesAt: requirement.closesAt ? requirement.closesAt.toISOString() : null,
      status: requirement.status,
      phase: negotiationPhase(requirement.status, requirement.opensAt, requirement.closesAt),
      serverTime: new Date().toISOString(),
      isEnded,
      endedStatus,
      isAwardedToMe,
      awardedAt: requirement.awardedAt ? requirement.awardedAt.toISOString() : null,
      // Flattened for QuoteForm. Nested `quote` stays for the live cockpit history table.
      newPrice: q?.newPrice ? String(q.newPrice) : null,
      remarks: q?.remarks ?? null,
      quoteStatus: q?.status ?? null,
      attachments: vendorAttachments,
      bidHistory: (q?.revisions ?? []).map((r) => ({
        id: r.id,
        price: r.price ? String(r.price) : null,
        submittedAt: r.createdAt.toISOString(),
        status: r.status,
      })),
      quote: q
        ? {
            id: q.id,
            newPrice: q.newPrice ? String(q.newPrice) : null,
            unitPrice: q.unitPrice ? String(q.unitPrice) : null,
            quantity: q.quantity != null ? Number(q.quantity) : null,
            vatRate: Number(q.vatRate ?? 0),
            vatAmount: q.vatAmount ? String(q.vatAmount) : null,
            totalPrice: q.totalPrice ? String(q.totalPrice) : null,
            deliveryPeriodDays: q.deliveryPeriodDays,
            paymentTerms: q.paymentTerms,
            warranty: q.warranty,
            notes: q.notes,
            remarks: q.remarks ?? null,
            status: q.status,
            submittedAt: q.submittedAt ? q.submittedAt.toISOString() : null,
            attachments: vendorAttachments,
            revisions: q.revisions.map((r) => ({
              id: r.id,
              price: r.price ? String(r.price) : null,
              submittedAt: r.createdAt.toISOString(),
              status: r.status,
            })),
          }
        : null,
      previousQuotation: previous
        ? {
            amount: Number(previous.totalPrice),
            currency: previous.currency,
            source: previous.source,
            receivedAt: previous.receivedAt.toISOString(),
            attachments: previous.attachments.map((a) => ({
              id: a.id,
              fileName: a.fileName,
              fileUrl: `/api/requirements/${requirementId}/quote/attachment/${a.id}`,
              downloadPath: `/api/requirements/${requirementId}/quote/attachment/${a.id}`,
            })),
          }
        : null,
    };
  }

  static async getVendorDashboard(vendor: {
    id: string;
    email: string;
    name: string;
    mustChangePassword: boolean;
    registrationId: string | null;
  }) {
    const vendorPayload = {
      id: vendor.id,
      email: vendor.email,
      name: vendor.name,
      mustChangePassword: vendor.mustChangePassword,
      registrationId: vendor.registrationId,
    };

    let requirements: any[] = [];
    try {
      requirements = await this.listOpenForVendor(vendor.id);
    } catch (err) {
      console.error("[vendor/dashboard] requirements list error", err);
    }

    if (!vendor.registrationId) {
      return { vendor: vendorPayload, registration: null, requirements };
    }

    let registration: any = null;
    try {
      registration = await prisma.supplierRegistration.findUnique({
        where: { id: vendor.registrationId },
        include: { company: true, attachments: true, contacts: true },
      });
    } catch (err) {
      console.error("[vendor/dashboard] registration error", err);
    }

    let companyData = null;
    if (registration?.company) {
      const tax = (registration.company.taxIdentifiers as Record<string, any>) || {};
      companyData = {
        id: registration.company.id,
        legalName: registration.company.legalName,
        dbaName: registration.company.dbaName,
        country: registration.company.country,
        website: registration.company.website,
        taxIdNumber: String(tax.taxIdNumber || ""),
        vatNumber: String(tax.vatNumber || ""),
        crNumber: String(tax.crNumber || ""),
        yearEstablished: registration.company.yearEstablished,
        dunsNumber: registration.company.dunsNumber,
      };
    }

    const registrationPayload = registration
      ? {
          id: registration.id,
          status: registration.status,
          referenceNumber: registration.referenceNumber,
          reviewNote: registration.reviewNote,
          productCategories: registration.productCategories,
          submittedAt: registration.submittedAt ? registration.submittedAt.toISOString() : null,
          reviewedAt: registration.reviewedAt ? registration.reviewedAt.toISOString() : null,
          email: registration.email,
          businessRelationship: registration.businessRelationship,
          company: companyData,
          attachments: (registration.attachments || []).map((a: any) => ({
            id: a.id,
            fileName: a.fileName,
            documentType: a.documentType,
            fileSize: a.fileSize,
            uploadedAt: a.uploadedAt ? a.uploadedAt.toISOString() : null,
          })),
          contacts: (registration.contacts || []).map((c: any) => ({
            id: c.id,
            fullName: c.fullName,
            jobTitle: c.jobTitle,
            email: c.email,
            phone: c.phone,
          })),
        }
      : null;

    return {
      vendor: vendorPayload,
      registration: registrationPayload,
      requirements,
    };
  }

  static async saveQuote(
    env: Env,
    vendorId: string,
    requirementId: string,
    body: {
      newPrice?: string | number | null;
      unitPrice?: string | number | null;
      quantity?: string | number | null;
      vatRate?: string | number | null;
      deliveryPeriodDays?: number | null;
      paymentTerms?: string;
      warranty?: string;
      notes?: string;
      currency?: string;
      remarks?: string;
      submit?: boolean;
    }
  ) {
    const submit = body.submit === true;
    const requirement = await prisma.requirement.findFirst({
      where: {
        id: requirementId,
        status: "OPEN",
        deletedAt: null,
        invites: { some: { vendorUserId: vendorId } },
      },
      include: {
        quotes: { where: { vendorUserId: vendorId }, take: 1 },
      },
    });

    if (!requirement) {
      return { error: "This requirement is closed or not available to you.", status: 409 };
    }
    if (!isBiddingLive(requirement.status, requirement.opensAt, requirement.closesAt)) {
      if (requirement.opensAt && Date.now() < requirement.opensAt.getTime()) {
        return { error: "Bidding has not started yet.", status: 409 };
      }
      return { error: "This requirement is closed or not available to you.", status: 409 };
    }

    const existing = requirement.quotes[0];
    if (existing?.status === "SUBMITTED" && requirement.allowBidRevisions === false) {
      return { error: "Bid revisions are not permitted on this requirement.", status: 409 };
    }

    const quantity = Number(body.quantity ?? existing?.quantity ?? requirement.quantity ?? 1);
    const unitPriceRaw = body.unitPrice ?? body.newPrice ?? existing?.unitPrice ?? existing?.newPrice;
    const unitPrice = unitPriceRaw == null || unitPriceRaw === "" ? 0 : Number(unitPriceRaw);
    if (submit && !(unitPrice > 0)) {
      return { error: "Enter a price before submitting.", status: 400 };
    }
    if (unitPrice && !/^\d+(\.\d{1,2})?$/.test(String(unitPrice))) {
      return { error: "Enter a price as a number with at most two decimals.", status: 400 };
    }

    const money = computeMoneyBreakdown({
      unitPrice,
      quantity,
      vatRate: Number(body.vatRate ?? existing?.vatRate ?? 0),
    });
    const selectedCurrency = body.currency || requirement.currency || "SAR";
    let exchangeRate = 1;
    if (selectedCurrency !== "SAR") {
      const fx = await prisma.exchangeRate.findUnique({
        where: { currency: selectedCurrency as any },
      });
      if (!fx?.rateToSar) {
        return { error: `Exchange rate for ${selectedCurrency} is currently unavailable.`, status: 400 };
      }
      exchangeRate = Number(fx.rateToSar);
    }
    const amountSar = toSarAmount(money.totalPrice, exchangeRate);

    if (requirement.minAcceptablePrice && amountSar < Number(requirement.minAcceptablePrice)) {
      return { error: "This bid is below the minimum acceptable price.", status: 400 };
    }
    if (requirement.maxAcceptablePrice && amountSar > Number(requirement.maxAcceptablePrice)) {
      return { error: "This bid is above the maximum acceptable price.", status: 400 };
    }

    const remarks = String(body.remarks ?? body.notes ?? existing?.remarks ?? "");
    const saved = await prisma.$transaction(async (tx) => {
      const quote = await tx.quote.upsert({
        where: {
          requirementId_vendorUserId: { requirementId, vendorUserId: vendorId },
        },
        update: {
          newPrice: money.totalPrice,
          totalPrice: money.totalPrice,
          unitPrice: money.unitPrice,
          quantity: money.quantity,
          vatRate: money.vatRate,
          vatAmount: money.vatAmount,
          deliveryPeriodDays: body.deliveryPeriodDays ?? existing?.deliveryPeriodDays ?? null,
          paymentTerms: body.paymentTerms ?? existing?.paymentTerms ?? "",
          warranty: body.warranty ?? existing?.warranty ?? "",
          notes: body.notes ?? existing?.notes ?? "",
          currency: selectedCurrency as any,
          exchangeRate,
          amountSar,
          remarks,
          status: submit ? "SUBMITTED" : "DRAFT",
          submittedAt: submit ? new Date() : existing?.submittedAt,
        },
        create: {
          id: cuid(),
          requirementId,
          vendorUserId: vendorId,
          newPrice: money.totalPrice || null,
          totalPrice: money.totalPrice || null,
          unitPrice: money.unitPrice || null,
          quantity: money.quantity,
          vatRate: money.vatRate,
          vatAmount: money.vatAmount,
          deliveryPeriodDays: body.deliveryPeriodDays ?? null,
          paymentTerms: body.paymentTerms ?? "",
          warranty: body.warranty ?? "",
          notes: body.notes ?? "",
          currency: selectedCurrency as any,
          exchangeRate,
          amountSar,
          remarks,
          status: submit ? "SUBMITTED" : "DRAFT",
          submittedAt: submit ? new Date() : null,
        },
      });

      if (money.totalPrice > 0) {
        await tx.quoteRevision.create({
          data: {
            id: cuid(),
            quoteId: quote.id,
            requirementId,
            vendorUserId: vendorId,
            currency: selectedCurrency as any,
            exchangeRate,
            price: money.totalPrice,
            amountSar,
            unitPrice: money.unitPrice,
            quantity: money.quantity,
            vatRate: money.vatRate,
            vatAmount: money.vatAmount,
            totalPrice: money.totalPrice,
            deliveryPeriodDays: quote.deliveryPeriodDays,
            paymentTerms: quote.paymentTerms,
            warranty: quote.warranty,
            remarks,
            notes: quote.notes,
            status: submit ? "SUBMITTED" : "DRAFT",
          },
        });
      }

      if (submit) {
        await tx.requirementInvite.updateMany({
          where: { requirementId, vendorUserId: vendorId },
          data: { inviteStatus: "BID_SUBMITTED", respondedAt: new Date() },
        });
      }

      return quote;
    });

    void writeAudit(null, {
      vendorId,
      action: submit ? "bid.submitted" : "bid.revised",
      entityType: "Requirement",
      entityId: requirementId,
      metadata: { quoteId: saved.id, totalPrice: money.totalPrice, previousPrice: existing?.newPrice ?? null },
    });

    try {
      void broadcastBidUpdate(requirementId, env);
    } catch (err) {
      console.warn("[saveQuote] live broadcast failed", err);
    }

    return {
      ok: true,
      quote: {
        ...saved,
        quoteFileUrl: null,
        newPrice: saved.newPrice ? String(saved.newPrice) : null,
        amountSar: saved.amountSar ? String(saved.amountSar) : null,
        submittedAt: saved.submittedAt ? saved.submittedAt.toISOString() : null,
      },
    };
  }

  static async uploadQuoteAttachment(
    env: Env,
    vendorId: string,
    requirementId: string,
    file: File
  ) {
    if (!uploadStorageConfigured(env)) {
      return { error: "Upload storage is not configured.", status: 503 };
    }

    const requirement = await prisma.requirement.findFirst({
      where: {
        id: requirementId,
        deletedAt: null,
        invites: { some: { vendorUserId: vendorId } },
      },
      select: { id: true, closesAt: true, opensAt: true, status: true },
    });
    if (!requirement) return { error: "Requirement not found.", status: 404 };
    if (!isBiddingLive(requirement.status, requirement.opensAt, requirement.closesAt)) {
      return { error: "Bidding is not open for document uploads.", status: 409 };
    }

    const raw = new Uint8Array(await file.arrayBuffer());
    if (raw.byteLength > MAX_SOURCING_UPLOAD_BYTES) {
      return { error: "File must be 25 MB or smaller.", status: 400 };
    }
    const mimeType = resolveSourcingMime(file.name, file.type || "", raw);
    if (!mimeType) {
      return { error: "Only PDF, Word, Excel, JPEG, PNG, or WEBP files are accepted.", status: 400 };
    }

    let quote = await prisma.quote.findUnique({
      where: {
        requirementId_vendorUserId: {
          requirementId,
          vendorUserId: vendorId,
        },
      },
    });

    if (!quote) {
      quote = await prisma.quote.create({
        data: {
          id: cuid(),
          requirementId,
          vendorUserId: vendorId,
          status: "DRAFT",
        },
      });
    }

    const key = storageKeyForQuote(requirementId, quote.id, file.name);
    try {
      await putUpload(env, key, raw, mimeType);
    } catch (err) {
      console.error("[quote/attachment] upload error", err);
      return { error: "Failed to store document.", status: 500 };
    }

    const attachment = await prisma.quoteAttachment.create({
      data: {
        id: cuid(),
        quoteId: quote.id,
        fileName: file.name,
        fileUrl: storedUrlForKey(key),
        fileSize: raw.byteLength,
        mimeType,
      },
    });

    const dto = attachmentDto({
      id: attachment.id,
      requirementId,
      kind: "quote",
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      uploadedAt: attachment.uploadedAt,
      uploadedBy: "vendor",
      category: "quotation",
      vendorId,
    });
    const downloadPath = `/api/requirements/${requirementId}/quote/attachment/${attachment.id}`;
    return {
      ok: true,
      attachment: {
        ...dto,
        downloadPath,
        fileUrl: downloadPath,
      },
    };
  }

  static async deleteQuoteAttachment(
    env: Env,
    vendorId: string,
    requirementId: string,
    attachmentId: string
  ) {
    const attachment = await prisma.quoteAttachment.findUnique({
      where: { id: attachmentId },
      include: { quote: true },
    });

    if (
      !attachment ||
      attachment.quote.vendorUserId !== vendorId ||
      attachment.quote.requirementId !== requirementId
    ) {
      return { error: "Attachment not found.", status: 404 };
    }

    const key = keyFromStoredUrl(env, attachment.fileUrl) || extractStorageKeyFromUrl(env, attachment.fileUrl);
    if (key) {
      await deleteUpload(env, key).catch(() => {});
    }

    await prisma.quoteAttachment.delete({
      where: { id: attachmentId },
    });

    return { ok: true };
  }
}
