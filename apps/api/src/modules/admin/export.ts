import type { Env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { requireAdmin } from "./auth";

function toCsvRow(cells: (string | number | null | undefined)[]): string {
  return cells
    .map((cell) => {
      if (cell === null || cell === undefined) return '""';
      const str = String(cell).replace(/"/g, '""');
      return `"${str}"`;
    })
    .join(",");
}

/**
 * Exports all quotes and details for a specific requirement in CSV format.
 */
export async function handleRequirementExportCsv(
  sql: unknown,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: {
      quotes: {
        include: {
          vendorUser: { select: { email: true, name: true } },
        },
        orderBy: { amountSar: "asc" },
      },
    },
  });

  if (!requirement) {
    return new Response(JSON.stringify({ error: "Requirement not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = [
    "Requirement Ref",
    "Project",
    "Currency",
    "Status",
    "Closes At",
    "Vendor Name",
    "Vendor Email",
    "Quoted Price",
    "Amount (SAR)",
    "Quote Status",
    "Submitted At",
    "Remarks",
  ];

  const rows: string[] = [toCsvRow(headers)];

  for (const q of requirement.quotes) {
    rows.push(
      toCsvRow([
        requirement.referenceNumber || requirement.id,
        requirement.project,
        requirement.currency,
        requirement.status,
        requirement.closesAt.toISOString(),
        q.vendorUser.name,
        q.vendorUser.email,
        q.newPrice ? String(q.newPrice) : "",
        q.amountSar ? String(q.amountSar) : "",
        q.status,
        q.submittedAt ? q.submittedAt.toISOString() : "",
        q.remarks,
      ])
    );
  }

  const csvContent = "\uFEFF" + rows.join("\r\n"); // UTF-8 BOM for Excel compatibility
  const filename = `quotes_${requirement.referenceNumber || requirement.id}_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Exports supplier registrations in CSV format.
 */
export async function handleRegistrationsExportCsv(
  sql: unknown,
  env: Env,
  request: Request
): Promise<Response> {
  const { deny } = await requireAdmin(sql, env, request, "REVIEWER");
  if (deny) return deny;

  const registrations = await prisma.supplierRegistration.findMany({
    include: {
      company: true,
      contacts: true,
      bankAccounts: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Reference Number",
    "Company Legal Name",
    "Trade / DBA Name",
    "Country",
    "Email",
    "Website",
    "Status",
    "Created At",
    "Submitted At",
    "Primary Contact",
    "Primary Phone",
    "Bank Name",
    "IBAN",
  ];

  const rows: string[] = [toCsvRow(headers)];

  for (const reg of registrations) {
    const primaryContact = reg.contacts[0];
    const primaryBank = reg.bankAccounts[0];
    const contactName = primaryContact
      ? `${primaryContact.firstName || ""} ${primaryContact.lastName || ""}`.trim()
      : "";

    rows.push(
      toCsvRow([
        reg.referenceNumber,
        reg.company?.legalName || "",
        reg.company?.dbaName || "",
        reg.company?.country || "",
        reg.email,
        reg.company?.website || "",
        reg.status,
        reg.createdAt.toISOString(),
        reg.submittedAt ? reg.submittedAt.toISOString() : "",
        contactName,
        primaryContact ? primaryContact.mobile || primaryContact.phone : "",
        primaryBank ? primaryBank.bankName : "",
        primaryBank ? primaryBank.iban : "",
      ])
    );
  }

  const csvContent = "\uFEFF" + rows.join("\r\n");
  const filename = `supplier_registrations_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
