import type { Env } from "../../config/env";
import { json } from "../../lib/http";
import { type Sql, cuid } from "./db";
import { requireAdmin, writeAudit } from "./auth";

export type ProcurementPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type ProcurementStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REVISION_REQUESTED";

export interface CreateProcurementItemInput {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  estimatedUnitPrice: number;
  preferredVendor?: string | null;
  notes?: string | null;
}

export interface CreateProcurementAttachmentInput {
  name: string;
  url: string;
  sizeBytes?: number;
  mimeType?: string;
}

export interface CreatePurchaseRequestInput {
  title: string;
  description?: string;
  department: string;
  requesterName: string;
  requesterEmail?: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  requiredByDate: string;
  currency?: string;
  costCenter?: string | null;
  items: CreateProcurementItemInput[];
  attachments?: CreateProcurementAttachmentInput[];
}

export interface UpdateProcurementStatusInput {
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected" | "revision_requested";
  note?: string | null;
  adminNotes?: string | null;
}

function formatStatusToClient(status: string): string {
  return status.toLowerCase();
}

function formatPriorityToClient(priority: string): string {
  return priority.toLowerCase();
}

/** Generate PR-2026-XXX sequential reference */
async function generateReferenceNumber(sql: Sql): Promise<string> {
  const year = new Date().getFullYear();
  const [result] = await sql`
    SELECT COUNT(*)::int as count FROM "PurchaseRequest"
  `;
  const nextNum = ((result?.count as number) || 0) + 1;
  return `PR-${year}-${String(nextNum).padStart(3, "0")}`;
}

export async function loadPurchaseRequestDetail(sql: Sql, idOrRef: string) {
  const [req] = await sql`
    SELECT pr.*, a.email as "createdByEmail", a.name as "createdByName"
    FROM "PurchaseRequest" pr
    LEFT JOIN "AdminUser" a ON pr."createdById" = a.id
    WHERE pr.id = ${idOrRef} OR LOWER(pr."referenceNumber") = ${idOrRef.toLowerCase()}
    LIMIT 1
  `;

  if (!req) return null;

  const items = await sql`
    SELECT * FROM "PurchaseRequestItem"
    WHERE "purchaseRequestId" = ${req.id as string}
    ORDER BY "sortOrder" ASC, "createdAt" ASC
  `;

  const attachments = await sql`
    SELECT * FROM "PurchaseRequestAttachment"
    WHERE "purchaseRequestId" = ${req.id as string}
    ORDER BY "uploadedAt" ASC
  `;

  const auditLogs = await sql`
    SELECT al.*, a.email as "actorEmail"
    FROM "AuditLog" al
    LEFT JOIN "AdminUser" a ON al."adminId" = a.id
    WHERE al."entityType" = 'PurchaseRequest' AND al."entityId" = ${req.id as string}
    ORDER BY al."createdAt" ASC
  `;

  return {
    id: req.id as string,
    referenceNumber: req.referenceNumber as string,
    title: req.title as string,
    description: (req.description as string) || "",
    department: req.department as string,
    requesterName: req.requesterName as string,
    requesterEmail: (req.requesterEmail as string) || null,
    priority: formatPriorityToClient(req.priority as string),
    status: formatStatusToClient(req.status as string),
    requiredByDate: req.requiredByDate ? new Date(req.requiredByDate as string).toISOString().split("T")[0] : "",
    currency: (req.currency as string) || "SAR",
    totalEstimatedAmount: Number(req.estimatedAmount) || 0,
    costCenter: (req.costCenter as string) || null,
    adminNotes: (req.adminNotes as string) || null,
    createdAt: new Date(req.createdAt as string).toISOString(),
    updatedAt: new Date(req.updatedAt as string).toISOString(),
    items: items.map((it) => ({
      id: it.id as string,
      name: it.name as string,
      category: it.category as string,
      quantity: Number(it.quantity) || 0,
      unit: it.unit as string,
      estimatedUnitPrice: Number(it.estimatedUnitPrice) || 0,
      totalPrice: Number(it.totalPrice) || 0,
      preferredVendor: (it.preferredVendor as string) || null,
      notes: (it.notes as string) || null,
    })),
    attachments: attachments.map((att) => ({
      id: att.id as string,
      name: att.name as string,
      size: Number(att.sizeBytes) || 0,
      type: (att.mimeType as string) || "application/pdf",
      url: att.url as string,
      uploadedAt: new Date(att.uploadedAt as string).toISOString(),
    })),
    auditTrail: auditLogs.map((log) => ({
      id: log.id as string,
      action: log.action as string,
      actorName: (log.actor_name || log.actorName || "Staff") as string,
      actorRole: (log.actor_role || log.actorRole || "admin") as string,
      timestamp: new Date((log.created_at || log.createdAt || log.timestamp) as string).toISOString(),
      note: (log.note as string) || null,
      previousStatus: (log.previous_status || log.previousStatus) ? formatStatusToClient((log.previous_status || log.previousStatus) as string) : undefined,
      newStatus: (log.new_status || log.newStatus) ? formatStatusToClient((log.new_status || log.newStatus) as string) : undefined,
    })),
  };
}

/**
 * GET /admin/procurement
 * Returns list of purchase requests with items count and total estimated amounts.
 */
export async function handleProcurementList(sql: Sql, env: Env, request: Request): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  const url = new URL(request.url);
  const statusQuery = url.searchParams.get("status");

  let queryFilter = sql`1=1`;
  if (statusQuery && statusQuery.toUpperCase() !== "ALL") {
    const uppercase = statusQuery.toUpperCase();
    queryFilter = sql`pr.status = ${uppercase}`;
  }

  const rows = await sql`
    SELECT
      pr.id,
      pr."referenceNumber",
      pr.title,
      pr.description,
      pr.department,
      pr."requesterName",
      pr."requesterEmail",
      pr.priority,
      pr.status,
      pr."requiredByDate",
      pr.currency,
      pr."estimatedAmount",
      pr."costCenter",
      pr."adminNotes",
      pr."createdAt",
      pr."updatedAt",
      (SELECT COUNT(*)::int FROM "PurchaseRequestItem" WHERE "purchaseRequestId" = pr.id) as "itemCount"
    FROM "PurchaseRequest" pr
    WHERE ${queryFilter}
    ORDER BY pr."createdAt" DESC
  `;

  // Seed default sample data if database table is completely empty
  if (rows.length === 0 && (!statusQuery || statusQuery === "ALL")) {
    await seedInitialProcurementData(sql, auth.admin.id);
    return handleProcurementList(sql, env, request);
  }

  const out = rows.map((r) => ({
    id: r.id as string,
    referenceNumber: r.referenceNumber as string,
    title: r.title as string,
    description: (r.description as string) || "",
    department: r.department as string,
    requesterName: r.requesterName as string,
    requesterEmail: (r.requesterEmail as string) || null,
    priority: formatPriorityToClient(r.priority as string),
    status: formatStatusToClient(r.status as string),
    requiredByDate: r.requiredByDate ? new Date(r.requiredByDate as string).toISOString().split("T")[0] : "",
    currency: (r.currency as string) || "SAR",
    totalEstimatedAmount: Number(r.estimatedAmount) || 0,
    costCenter: (r.costCenter as string) || null,
    adminNotes: (r.adminNotes as string) || null,
    createdAt: new Date(r.createdAt as string).toISOString(),
    updatedAt: new Date(r.updatedAt as string).toISOString(),
    itemCount: Number(r.itemCount) || 0,
  }));

  return json(env, request, out);
}

/**
 * GET /admin/procurement/:id
 */
export async function handleProcurementGet(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  const detail = await loadPurchaseRequestDetail(sql, id);
  if (!detail) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  return json(env, request, detail);
}

/**
 * POST /admin/procurement
 * Creates a new purchase requisition with line items, attachments, and audit log.
 */
export async function handleProcurementCreate(
  sql: Sql,
  env: Env,
  request: Request
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  if (!body || typeof body !== "object") {
    return json(env, request, { error: "Invalid request body" }, 400);
  }

  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const department = typeof b.department === "string" ? b.department.trim() : "";
  const requesterName = typeof b.requesterName === "string" ? b.requesterName.trim() : "";
  const requesterEmail = typeof b.requesterEmail === "string" ? b.requesterEmail.trim() : null;
  const description = typeof b.description === "string" ? b.description.trim() : "";
  const priorityRaw = typeof b.priority === "string" ? b.priority.toLowerCase() : "medium";
  const priority = (["low", "medium", "high", "urgent"].includes(priorityRaw)
    ? priorityRaw.toUpperCase()
    : "MEDIUM") as ProcurementPriority;
  const requiredByDateStr = typeof b.requiredByDate === "string" ? b.requiredByDate : "";
  const currency = typeof b.currency === "string" ? b.currency.trim() : "SAR";
  const costCenter = typeof b.costCenter === "string" ? b.costCenter.trim() : null;
  const itemsRaw = Array.isArray(b.items) ? (b.items as Array<Record<string, unknown>>) : [];
  const attachmentsRaw = Array.isArray(b.attachments) ? (b.attachments as Array<Record<string, unknown>>) : [];

  if (!title || title.length < 3) {
    return json(env, request, { error: "Title must be at least 3 characters" }, 400);
  }
  if (!department) {
    return json(env, request, { error: "Department is required" }, 400);
  }
  if (!requesterName) {
    return json(env, request, { error: "Requester name is required" }, 400);
  }
  if (!requiredByDateStr || isNaN(Date.parse(requiredByDateStr))) {
    return json(env, request, { error: "Valid required by date is required" }, 400);
  }
  if (itemsRaw.length === 0) {
    return json(env, request, { error: "At least one line item is required" }, 400);
  }

  const reqId = cuid();
  const refNum = await generateReferenceNumber(sql);

  // Calculate item totals
  let calculatedTotal = 0;
  const processedItems: Array<{
    name: string;
    category: string;
    quantity: number;
    unit: string;
    estimatedUnitPrice: number;
    totalPrice: number;
    preferredVendor: string | null;
    notes: string | null;
    sortOrder: number;
  }> = [];

  for (let idx = 0; idx < itemsRaw.length; idx++) {
    const it = itemsRaw[idx];
    const name = typeof it.name === "string" ? it.name.trim() : "";
    const category = typeof it.category === "string" ? it.category.trim() : "General";
    const quantity = Number(it.quantity) || 1;
    const unit = typeof it.unit === "string" ? it.unit.trim() : "pcs";
    const estimatedUnitPrice = Number(it.estimatedUnitPrice) || 0;
    const totalPrice = quantity * estimatedUnitPrice;
    const preferredVendor = typeof it.preferredVendor === "string" ? it.preferredVendor.trim() : null;
    const notes = typeof it.notes === "string" ? it.notes.trim() : null;

    if (!name) return json(env, request, { error: `Item ${idx + 1} name is required` }, 400);

    calculatedTotal += totalPrice;
    processedItems.push({
      name,
      category,
      quantity,
      unit,
      estimatedUnitPrice,
      totalPrice,
      preferredVendor,
      notes,
      sortOrder: idx + 1,
    });
  }

  const now = new Date();

  // Create PurchaseRequest
  await sql`
    INSERT INTO "PurchaseRequest" (
      id, "referenceNumber", title, description, department,
      "requesterName", "requesterEmail", priority, status,
      "requiredByDate", currency, "estimatedAmount", "costCenter",
      "createdById", "createdAt", "updatedAt"
    ) VALUES (
      ${reqId}, ${refNum}, ${title}, ${description}, ${department},
      ${requesterName}, ${requesterEmail}, ${priority}, 'SUBMITTED',
      ${new Date(requiredByDateStr)}, ${currency}, ${calculatedTotal}, ${costCenter},
      ${auth.admin.id}, ${now}, ${now}
    )
  `;

  // Insert Line Items
  for (const item of processedItems) {
    const itemId = cuid();
    await sql`
      INSERT INTO "PurchaseRequestItem" (
        id, "purchaseRequestId", name, category, quantity, unit,
        "estimatedUnitPrice", "totalPrice", "preferredVendor", notes, "sortOrder", "createdAt"
      ) VALUES (
        ${itemId}, ${reqId}, ${item.name}, ${item.category}, ${item.quantity}, ${item.unit},
        ${item.estimatedUnitPrice}, ${item.totalPrice}, ${item.preferredVendor}, ${item.notes}, ${item.sortOrder}, ${now}
      )
    `;
  }

  // Insert Attachments if provided
  for (const att of attachmentsRaw) {
    const attName = typeof att.name === "string" ? att.name.trim() : "";
    const attUrl = typeof att.url === "string" ? att.url.trim() : "";
    if (attName && attUrl) {
      const attId = cuid();
      await sql`
        INSERT INTO "PurchaseRequestAttachment" (
          id, "purchaseRequestId", name, url, "sizeBytes", "mimeType", "uploadedAt"
        ) VALUES (
          ${attId}, ${reqId}, ${attName}, ${attUrl}, ${Number(att.sizeBytes) || 0}, ${typeof att.mimeType === "string" ? att.mimeType : "application/pdf"}, ${now}
        )
      `;
    }
  }

  // Insert Initial Audit Log
  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: 'Requisition Submitted',
    entityType: 'PurchaseRequest',
    entityId: reqId,
    actorName: requesterName,
    actorRole: 'requester',
    previousStatus: 'DRAFT',
    newStatus: 'SUBMITTED',
    note: 'Initial purchase request submitted.',
    metadata: { ref: refNum, title, amount: calculatedTotal },
  });

  const detail = await loadPurchaseRequestDetail(sql, reqId);
  return json(env, request, detail, 201);
}

/**
 * POST /admin/procurement/:id/review
 * Updates status, notes, and records an immutable audit log.
 */
export async function handleProcurementReview(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(env, request, { error: "Invalid JSON body" }, 400);
  }

  if (!body || typeof body !== "object") {
    return json(env, request, { error: "Invalid request body" }, 400);
  }

  const b = body as Record<string, unknown>;
  const statusRaw = typeof b.status === "string" ? b.status.toLowerCase() : "";
  const validStatuses = ["draft", "submitted", "under_review", "approved", "rejected", "revision_requested"];
  if (!validStatuses.includes(statusRaw)) {
    return json(env, request, { error: `Invalid status: ${statusRaw}` }, 400);
  }

  const status = statusRaw.toUpperCase() as ProcurementStatus;
  const note = typeof b.note === "string" ? b.note.trim() : null;
  const adminNotes = typeof b.adminNotes === "string" ? b.adminNotes.trim() : undefined;

  const [existing] = await sql`
    SELECT * FROM "PurchaseRequest"
    WHERE id = ${id} OR LOWER("referenceNumber") = ${id.toLowerCase()}
    LIMIT 1
  `;

  if (!existing) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  const prevStatus = existing.status as string;
  const now = new Date();

  // Action name mapping
  const actionTitleMap: Record<string, string> = {
    DRAFT: "Status Reverted to Draft",
    SUBMITTED: "Marked as Submitted",
    UNDER_REVIEW: "Moved to Under Review",
    APPROVED: "Requisition Approved",
    REJECTED: "Requisition Rejected",
    REVISION_REQUESTED: "Revisions Requested",
  };

  const actionTitle = actionTitleMap[status] || `Status updated to ${status}`;

  // Update PurchaseRequest record
  await sql`
    UPDATE "PurchaseRequest"
    SET
      status = ${status},
      "adminNotes" = ${adminNotes !== undefined ? adminNotes : (existing.adminNotes as string | null)},
      "updatedAt" = ${now}
    WHERE id = ${existing.id as string}
  `;

  // Append Audit Log
  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: actionTitle,
    entityType: 'PurchaseRequest',
    entityId: existing.id as string,
    actorName: auth.admin.name || "Administrator",
    actorRole: 'admin',
    previousStatus: prevStatus,
    newStatus: status,
    note: note,
    metadata: { ref: existing.referenceNumber as string },
  });

  const detail = await loadPurchaseRequestDetail(sql, existing.id as string);
  return json(env, request, detail);
}

/**
 * DELETE /admin/procurement/:id
 * Permanently deletes a purchase requisition, its items, attachments, and logs.
 */
export async function handleProcurementDelete(
  sql: Sql,
  env: Env,
  request: Request,
  id: string
): Promise<Response> {
  const auth = await requireAdmin(sql, env, request);
  if (auth.deny) return auth.deny;

  const [existing] = await sql`
    SELECT id, "referenceNumber", title FROM "PurchaseRequest"
    WHERE id = ${id} OR LOWER("referenceNumber") = ${id.toLowerCase()}
    LIMIT 1
  `;

  if (!existing) {
    return json(env, request, { error: "Purchase requisition not found" }, 404);
  }

  // Delete will cascade-remove items and attachments; audit log entries
  // in the unified AuditLog table persist for post-deletion traceability.
  await sql`
    DELETE FROM "PurchaseRequest"
    WHERE id = ${existing.id as string}
  `;

  await writeAudit(sql, {
    adminId: auth.admin.id,
    action: "DELETE_PURCHASE_REQUEST",
    entityType: "PurchaseRequest",
    entityId: existing.id as string,
    metadata: { ref: existing.referenceNumber as string, title: existing.title as string },
  });

  return json(env, request, { success: true, deletedId: existing.id });
}

/**
 * Seeds initial realistic construction requisitions if database table is empty.
 */

async function seedInitialProcurementData(sql: Sql, adminId?: string) {
  const seedData = [
    {
      ref: "PR-2026-001",
      title: "Structural Ready-Mix Concrete (Grade C35/45) - Foundation Pour",
      description: "Supply and on-site transit mixer delivery of Grade C35/45 sulphate-resisting ready-mix concrete for Phase 2 Substructure & Foundation casting at Riyadh Metro Station Package 4.",
      dept: "Civil & Structural Engineering",
      reqName: "Tariq Al-Ghamdi (Site Engineer)",
      reqEmail: "tariq.ghamdi@rvcc.com",
      priority: "HIGH",
      status: "SUBMITTED",
      requiredDate: "2026-09-15",
      currency: "SAR",
      costCenter: "Project Phase 2 - Foundation Substructure",
      items: [
        {
          name: "Ready-Mix Concrete Grade C35/45 (SRC - Sulphate Resisting)",
          cat: "Concrete & Masonry",
          qty: 450,
          unit: "m³",
          price: 260,
          total: 117000,
          vendor: "Saudi ReadyMix Co.",
          notes: "Includes slump test certification and temperature control",
        },
        {
          name: "Stationary Concrete Boom Pump (36m Reach)",
          cat: "Heavy Plant & Equipment",
          qty: 2,
          unit: "shifts",
          price: 4500,
          total: 9000,
          vendor: "Al-Kifah Equipment Rental",
          notes: "Includes certified operator and pump line setup",
        },
      ],
      attachments: [
        { name: "Concrete_Mix_Design_Approval_Rev3.pdf", url: "#", size: 1840000 },
        { name: "Foundation_Pour_Schedule_Phase2.pdf", url: "#", size: 920000 },
      ],
      audit: [
        {
          action: "Requisition Submitted",
          actorName: "Tariq Al-Ghamdi",
          role: "requester",
          note: "Submitted requisition with structural engineer mix design approval attached.",
          prev: "DRAFT",
          next: "SUBMITTED",
        },
      ],
    },
    {
      ref: "PR-2026-002",
      title: "High-Tensile Deformed Steel Rebar (Grade 60) - Columns & Beams",
      description: "Urgent procurement of ASTM A615 Grade 60 deformed rebar (16mm, 20mm, 25mm, and 32mm bundles) for superstructure frame reinforcement casting on Tower B.",
      dept: "Civil & Structural Engineering",
      reqName: "Sultan Mansour (Procurement Coordinator)",
      reqEmail: "sultan.m@rvcc.com",
      priority: "URGENT",
      status: "UNDER_REVIEW",
      requiredDate: "2026-08-30",
      currency: "SAR",
      costCenter: "Tower B - Superstructure Frame",
      items: [
        {
          name: "Deformed Steel Rebar 25mm (ASTM A615 Gr. 60 - 12m Bars)",
          cat: "Steel & Metalwork",
          qty: 85,
          unit: "tons",
          price: 2850,
          total: 242250,
          vendor: "SABIC Hadeed Steel",
          notes: "Mill test certificates required prior to delivery",
        },
        {
          name: "Deformed Steel Rebar 16mm (ASTM A615 Gr. 60 - 12m Bars)",
          cat: "Steel & Metalwork",
          qty: 40,
          unit: "tons",
          price: 2900,
          total: 116000,
          vendor: "SABIC Hadeed Steel",
          notes: "Standard bundle packaging with plastic wrap",
        },
      ],
      attachments: [
        { name: "Rebar_Bending_Schedule_TowerB.pdf", url: "#", size: 3450000 },
        { name: "SABIC_Mill_Certificate_Sample.pdf", url: "#", size: 1120000 },
      ],
      audit: [
        {
          action: "Requisition Submitted",
          actorName: "Sultan Mansour",
          role: "requester",
          note: "Critical path material for 3rd floor column pouring.",
          prev: "DRAFT",
          next: "SUBMITTED",
        },
        {
          action: "Moved to Under Review",
          actorName: "Procurement Admin",
          role: "admin",
          note: "Verifying current SABIC allocation quota and logistics route.",
          prev: "SUBMITTED",
          next: "UNDER_REVIEW",
        },
      ],
    },
    {
      ref: "PR-2026-003",
      title: "Mobile Hydraulic Crane (80 Ton) - 3 Month Site Lease",
      description: "Dry lease of 80-tonne all-terrain mobile hydraulic crane with certified operator for heavy precast girder placement and MEP chiller unit rooftop lifting.",
      dept: "Plant & Equipment Logistics",
      reqName: "Fahad Al-Harbi (Heavy Equipment Manager)",
      reqEmail: "fahad.harbi@rvcc.com",
      priority: "MEDIUM",
      status: "APPROVED",
      requiredDate: "2026-09-01",
      currency: "SAR",
      costCenter: "Central Site Logistics & Heavy Plant",
      items: [
        {
          name: "80-Tonne All-Terrain Mobile Crane (Liebherr LTM 1080 or equiv.)",
          cat: "Heavy Plant & Equipment",
          qty: 3,
          unit: "months",
          price: 28000,
          total: 84000,
          vendor: "Kanoo Machinery Rental",
          notes: "3rd-party SASO and TUV load chart inspection certificate mandatory",
        },
      ],
      attachments: [
        { name: "Lift_Plan_Engineering_Study.pdf", url: "#", size: 4200000 },
      ],
      audit: [
        {
          action: "Requisition Submitted",
          actorName: "Fahad Al-Harbi",
          role: "requester",
          note: "Lease start requested for 1st Sept 2026.",
          prev: "DRAFT",
          next: "SUBMITTED",
        },
        {
          action: "Requisition Approved",
          actorName: "Senior Admin",
          role: "admin",
          note: "Approved under Equipment Capex Pool Q3. Purchase Order issued to Kanoo.",
          prev: "SUBMITTED",
          next: "APPROVED",
        },
      ],
    },
    {
      ref: "PR-2026-004",
      title: "13.8kV Medium Voltage Switchgear & 1500kVA Transformers",
      description: "Turnkey supply, testing, and pre-commissioning delivery of 13.8kV SF6-free medium voltage vacuum switchgear panels and 1500kVA oil-immersed step-down power transformers for substation building.",
      dept: "Electrical & Substation Engineering",
      reqName: "Eng. Ziyad Al-Qahtani (Lead MEP Engineer)",
      reqEmail: "ziyad.q@rvcc.com",
      priority: "HIGH",
      status: "SUBMITTED",
      requiredDate: "2026-11-20",
      currency: "SAR",
      costCenter: "Primary Substation 33/13.8kV",
      items: [
        {
          name: "1500 kVA 13.8kV/400V Oil-Immersed Step-Down Transformer (SEC Approved)",
          cat: "Electrical Systems",
          qty: 2,
          unit: "units",
          price: 185000,
          total: 370000,
          vendor: "Saudi Transformers Co. (STC)",
          notes: "Full factory acceptance testing (FAT) witness by SEC required",
        },
        {
          name: "13.8kV Indoor Vacuum Circuit Breaker Switchgear Lineup (4-Panel)",
          cat: "Electrical Systems",
          qty: 1,
          unit: "set",
          price: 210000,
          total: 210000,
          vendor: "Schneider Electric Saudi",
          notes: "Includes digital protection relays and SCADA interface cards",
        },
      ],
      attachments: [
        { name: "Single_Line_Diagram_SLD_Rev4.dwg.pdf", url: "#", size: 2900000 },
        { name: "SEC_Standard_Specification_13.8kV.pdf", url: "#", size: 5100000 },
      ],
      audit: [
        {
          action: "Requisition Submitted",
          actorName: "Eng. Ziyad Al-Qahtani",
          role: "requester",
          note: "Long lead item (12 weeks). Early submission for SEC compliance review.",
          prev: "DRAFT",
          next: "SUBMITTED",
        },
      ],
    },
    {
      ref: "PR-2026-005",
      title: "Ultra-Low Sulfur Diesel (Euro 5) - Bulk Fuel Supply (50,000L)",
      description: "Bulk diesel supply delivery by road tanker into central underground storage tanks at Main Batching Plant Site to power 4x 1000kVA prime power generators.",
      dept: "Site Logistics & Utilities",
      reqName: "Majed Al-Otaibi (Site Utilities Supervisor)",
      reqEmail: "majed.o@rvcc.com",
      priority: "HIGH",
      status: "APPROVED",
      requiredDate: "2026-08-29",
      currency: "SAR",
      costCenter: "Batching Plant Fuel Pool",
      items: [
        {
          name: "Ultra-Low Sulfur Diesel Euro 5 (10 ppm sulfur)",
          cat: "Fuel, Lubricants & Chemicals",
          qty: 50000,
          unit: "liters",
          price: 1.15,
          total: 57500,
          vendor: "Saudi Aramco Retail / Petromin",
          notes: "Metered discharge with temperature compensation certificate",
        },
      ],
      attachments: [
        { name: "Batching_Plant_Fuel_Consumption_Log.pdf", url: "#", size: 680000 },
      ],
      audit: [
        {
          action: "Requisition Submitted",
          actorName: "Majed Al-Otaibi",
          role: "requester",
          note: "Tank levels at 22%. Delivery required by Saturday morning.",
          prev: "DRAFT",
          next: "SUBMITTED",
        },
        {
          action: "Requisition Approved",
          actorName: "Procurement Director",
          role: "admin",
          note: "Standard recurring fuel allocation approved under standing Aramco agreement.",
          prev: "SUBMITTED",
          next: "APPROVED",
        },
      ],
    },
    {
      ref: "PR-2026-006",
      title: "Personal Protective Equipment (PPE) - Site Workforce Restock (500 Sets)",
      description: "Quarterly bulk replenishment of OSHA/ISO compliant construction PPE sets (EN397 hard hats, high-vis 3M reflective vests, S3 composite toe safety boots, and UV protective safety goggles) for site personnel.",
      dept: "Health, Safety & Environment (HSE)",
      reqName: "Nasser Al-Subaie (Head of Site HSE)",
      reqEmail: "nasser.subaie@rvcc.com",
      priority: "LOW",
      status: "APPROVED",
      requiredDate: "2026-09-05",
      currency: "SAR",
      costCenter: "HSE Central Safety Budget",
      items: [
        {
          name: "Industrial Safety Helmet EN 397 with Ratchet Suspension (White/Yellow/Blue)",
          cat: "Safety & PPE",
          qty: 500,
          unit: "pieces",
          price: 45,
          total: 22500,
          vendor: "MSA Safety Middle East",
          notes: "Logo screen printed on front center (RVCC emblem)",
        },
        {
          name: "S3 Composite Toe Leather Safety Boots (Oil & Acid Resistant)",
          cat: "Safety & PPE",
          qty: 500,
          unit: "pairs",
          price: 110,
          total: 55000,
          vendor: "Red Wing Saudi Arabia",
          notes: "Assorted sizes (40-46) per sizing breakdown sheet",
        },
        {
          name: "High-Visibility Class 3 Mesh Safety Vest with 3M Reflective Striping",
          cat: "Safety & PPE",
          qty: 500,
          unit: "pieces",
          price: 23,
          total: 11500,
          vendor: "Delta Plus Safety",
          notes: "Heavy duty zipper closure with ID badge holder",
        },
      ],
      attachments: [
        { name: "HSE_PPE_Inspection_Standard_2026.pdf", url: "#", size: 1420000 },
        { name: "Shoe_Sizing_Breakdown_Matrix.xlsx.pdf", url: "#", size: 310000 },
      ],
      audit: [
        {
          action: "Requisition Submitted",
          actorName: "Nasser Al-Subaie",
          role: "requester",
          note: "Q3 regular restock for incoming subcontractor labor forces.",
          prev: "DRAFT",
          next: "SUBMITTED",
        },
        {
          action: "Requisition Approved",
          actorName: "Procurement Admin",
          role: "admin",
          note: "Approved per HSE quarterly safety budget allocation.",
          prev: "SUBMITTED",
          next: "APPROVED",
        },
      ],
    },
  ];

  const now = new Date();

  for (const s of seedData) {
    const reqId = cuid();
    let totalAmt = 0;
    s.items.forEach((it) => { totalAmt += it.total; });

    await sql`
      INSERT INTO "PurchaseRequest" (
        id, "referenceNumber", title, description, department,
        "requesterName", "requesterEmail", priority, status,
        "requiredByDate", currency, "estimatedAmount", "costCenter",
        "createdById", "createdAt", "updatedAt"
      ) VALUES (
        ${reqId}, ${s.ref}, ${s.title}, ${s.description}, ${s.dept},
        ${s.reqName}, ${s.reqEmail}, ${s.priority}, ${s.status},
        ${new Date(s.requiredDate)}, ${s.currency}, ${totalAmt}, ${s.costCenter},
        ${adminId ?? null}, ${now}, ${now}
      )
      ON CONFLICT ("referenceNumber") DO NOTHING
    `;

    for (let i = 0; i < s.items.length; i++) {
      const it = s.items[i];
      await sql`
        INSERT INTO "PurchaseRequestItem" (
          id, "purchaseRequestId", name, category, quantity, unit,
          "estimatedUnitPrice", "totalPrice", "preferredVendor", notes, "sortOrder", "createdAt"
        ) VALUES (
          ${cuid()}, ${reqId}, ${it.name}, ${it.cat}, ${it.qty}, ${it.unit},
          ${it.price}, ${it.total}, ${it.vendor}, ${it.notes}, ${i + 1}, ${now}
        )
      `;
    }

    for (const att of s.attachments) {
      await sql`
        INSERT INTO "PurchaseRequestAttachment" (
          id, "purchaseRequestId", name, url, "sizeBytes", "mimeType", "uploadedAt"
        ) VALUES (
          ${cuid()}, ${reqId}, ${att.name}, ${att.url}, ${att.size}, 'application/pdf', ${now}
        )
      `;
    }

    for (const log of s.audit) {
      await writeAudit(sql, {
        adminId: null,
        action: log.action,
        entityType: 'PurchaseRequest',
        entityId: reqId,
        actorName: log.actorName,
        actorRole: log.role,
        previousStatus: log.prev,
        newStatus: log.next,
        note: log.note,
      });
    }
  }
}
