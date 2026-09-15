import { manualQuotationSchema, type ManualQuotationInput } from "@rvcc/schemas";
import type { Currency, QuotationSource } from "@prisma/client";
import { prisma } from "../../../lib/prisma";
import { cuid } from "../../../lib/sql";
import { computeMoneyBreakdown, toSarAmount } from "../lib/money";
import { isEditableByProcurement } from "../lib/status-machine";

async function exchangeRateFor(currency: string): Promise<number> {
  if (currency === "SAR") return 1;
  const fx = await prisma.exchangeRate.findUnique({ where: { currency: currency as Currency } });
  if (!fx?.rateToSar) throw new Error(`Exchange rate for ${currency} is currently unavailable.`);
  return Number(fx.rateToSar);
}

export class QuotationsService {
  static async list(requirementId: string) {
    return prisma.manualQuotation.findMany({
      where: { requirementId, deletedAt: null },
      include: {
        attachments: { orderBy: { uploadedAt: "asc" } },
        vendorUser: { select: { id: true, email: true, name: true } },
        recordedByAdmin: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  static serialize(row: Awaited<ReturnType<typeof QuotationsService.list>>[number]) {
    return {
      id: row.id,
      vendorUserId: row.vendorUserId,
      supplierName: row.supplierName,
      contactPerson: row.contactPerson,
      phone: row.phone,
      email: row.email,
      currency: row.currency,
      quantity: Number(row.quantity),
      unitPrice: Number(row.unitPrice),
      vatRate: Number(row.vatRate),
      vatAmount: Number(row.vatAmount),
      totalPrice: Number(row.totalPrice),
      amountSar: row.amountSar != null ? Number(row.amountSar) : null,
      deliveryPeriod: row.deliveryPeriod,
      paymentTerms: row.paymentTerms,
      validity: row.validity,
      warranty: row.warranty,
      remarks: row.remarks,
      source: row.source,
      receivedAt: row.receivedAt.toISOString(),
      recordedBy: row.recordedByAdmin?.name || row.recordedByAdmin?.email || "",
      vendorUser: row.vendorUser,
      attachments: row.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: `/api/requirements/${row.requirementId}/files/${a.id}?kind=manual`,
        mimeType: a.mimeType,
        fileSize: a.fileSize,
        uploadedAt: a.uploadedAt.toISOString(),
        previewable: ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(a.mimeType || ""),
        downloadPath: `/api/requirements/${row.requirementId}/files/${a.id}?kind=manual`,
      })),
    };
  }

  static stats(rows: { totalPrice: unknown; amountSar: unknown }[]) {
    const amounts = rows.map((r) => Number(r.amountSar ?? r.totalPrice)).filter((n) => n > 0);
    if (amounts.length === 0) {
      return { count: 0, lowest: null, highest: null, average: null };
    }
    const sum = amounts.reduce((a, b) => a + b, 0);
    return {
      count: amounts.length,
      lowest: Math.min(...amounts),
      highest: Math.max(...amounts),
      average: Math.round((sum / amounts.length) * 100) / 100,
    };
  }

  static async create(requirementId: string, adminId: string, raw: unknown) {
    const requirement = await prisma.requirement.findFirst({
      where: { id: requirementId, deletedAt: null },
    });
    if (!requirement) return { error: "Requirement not found.", status: 404 as const };
    if (!isEditableByProcurement(requirement.status)) {
      return { error: "Quotations can only be added before the requirement is submitted.", status: 409 as const };
    }

    const input = manualQuotationSchema.parse(raw) as ManualQuotationInput;
    const vendor = await prisma.vendorUser.findFirst({
      where: { id: input.vendorUserId, deletedAt: null },
      select: { id: true, name: true, email: true },
    });
    if (!vendor) return { error: "Select a registered supplier for this quotation.", status: 400 as const };

    const money = computeMoneyBreakdown({
      unitPrice: input.unitPrice,
      quantity: input.quantity,
      vatRate: input.vatRate,
    });
    const exchangeRate = await exchangeRateFor(input.currency);

    const created = await prisma.manualQuotation.create({
      data: {
        id: cuid(),
        requirementId,
        vendorUserId: vendor.id,
        supplierName: input.supplierName || vendor.name || vendor.email,
        contactPerson: input.contactPerson || "",
        phone: input.phone || "",
        email: input.email || "",
        currency: input.currency as Currency,
        exchangeRate,
        quantity: money.quantity,
        unitPrice: money.unitPrice,
        vatRate: money.vatRate,
        vatAmount: money.vatAmount,
        totalPrice: money.totalPrice,
        amountSar: toSarAmount(money.totalPrice, exchangeRate),
        deliveryPeriod: input.deliveryPeriod || "",
        paymentTerms: input.paymentTerms || "",
        validity: input.validity || "",
        warranty: input.warranty || "",
        remarks: input.remarks || "",
        source: input.source as QuotationSource,
        receivedAt: input.receivedAt ? new Date(input.receivedAt) : new Date(),
        recordedByAdminId: adminId,
      },
      include: {
        attachments: true,
        vendorUser: { select: { id: true, email: true, name: true } },
        recordedByAdmin: { select: { name: true, email: true } },
      },
    });

    return { ok: true as const, quotation: this.serialize(created) };
  }

  static async remove(requirementId: string, quotationId: string) {
    const existing = await prisma.manualQuotation.findFirst({
      where: { id: quotationId, requirementId, deletedAt: null },
    });
    if (!existing) return null;
    const requirement = await prisma.requirement.findUnique({ where: { id: requirementId } });
    if (requirement && !isEditableByProcurement(requirement.status)) {
      throw new Error("Quotations cannot be removed after the requirement is submitted.");
    }
    await prisma.manualQuotation.update({
      where: { id: quotationId },
      data: { deletedAt: new Date() },
    });
    return existing;
  }

  /** Map an offline quotation onto a registered supplier so comparison and vendor history line up. */
  static async relink(requirementId: string, quotationId: string, vendorUserId: string) {
    const existing = await prisma.manualQuotation.findFirst({
      where: { id: quotationId, requirementId, deletedAt: null },
    });
    if (!existing) return { error: "Quotation not found.", status: 404 as const };
    const requirement = await prisma.requirement.findUnique({ where: { id: requirementId } });
    if (requirement && !isEditableByProcurement(requirement.status)) {
      return { error: "Quotations cannot be remapped after the requirement is submitted.", status: 409 as const };
    }
    const vendor = await prisma.vendorUser.findFirst({
      where: { id: vendorUserId, deletedAt: null },
      select: { id: true, name: true, email: true },
    });
    if (!vendor) return { error: "Select a registered supplier for this quotation.", status: 400 as const };

    const updated = await prisma.manualQuotation.update({
      where: { id: quotationId },
      data: {
        vendorUserId: vendor.id,
        supplierName: existing.supplierName || vendor.name || vendor.email,
        email: existing.email || vendor.email,
      },
      include: {
        attachments: true,
        vendorUser: { select: { id: true, email: true, name: true } },
        recordedByAdmin: { select: { name: true, email: true } },
      },
    });
    return { ok: true as const, quotation: this.serialize(updated) };
  }
}
