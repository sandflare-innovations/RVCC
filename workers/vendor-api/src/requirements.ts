import type { Sql } from "./db";

/**
 * The column list every participant-facing query uses.
 *
 * "sellingPrice" is absent on purpose. Selecting it and hiding it in the UI
 * would put RVCC's internal number one view-source away.
 */
const REQUIREMENT_COLUMNS = `
  r.id, r."referenceNumber", r."scopeOfWork", r.project, r.currency, r."closesAt",
  q.id AS "quoteId", q."newPrice", q.remarks, q.status AS "quoteStatus", q."submittedAt"
`;

/**
 * Requirements this vendor may see: invited, open, and not past closing.
 *
 * The vendor id comes from the caller's session — never from the request — so
 * one participant cannot read another's row by guessing an id.
 */
export function listOpenForVendor(sql: Sql, vendorUserId: string) {
  return sql`
    SELECT ${sql.unsafe(REQUIREMENT_COLUMNS)}
    FROM "RequirementInvite" i
    JOIN "Requirement" r ON r.id = i."requirementId"
    LEFT JOIN "Quote" q
      ON q."requirementId" = r.id AND q."vendorUserId" = ${vendorUserId}
    WHERE i."vendorUserId" = ${vendorUserId}
      AND r.status = 'OPEN'
      AND r."closesAt" > NOW()
    ORDER BY r."closesAt" ASC
  `;
}

/**
 * The same visibility rule as listOpenForVendor, narrowed to the columns the
 * overview paints. Scope of work and currency are omitted: the overview shows
 * a project name and a deadline, and shipping the full scope text for every
 * open requirement is the kind of over-fetch this redesign exists to remove.
 */
export function listOverviewForVendor(sql: Sql, vendorUserId: string) {
  return sql`
    SELECT r.id, r."referenceNumber", r.project, r."closesAt",
           q.status AS "quoteStatus"
    FROM "RequirementInvite" i
    JOIN "Requirement" r ON r.id = i."requirementId"
    LEFT JOIN "Quote" q
      ON q."requirementId" = r.id AND q."vendorUserId" = ${vendorUserId}
    WHERE i."vendorUserId" = ${vendorUserId}
      AND r.status = 'OPEN'
      AND r."closesAt" > NOW()
    ORDER BY r."closesAt" ASC
    LIMIT 100
  `;
}

/**
 * A single requirement under the same visibility rule, but without the deadline
 * filter: a participant opening a link after closing should be told it closed,
 * not shown a 404 that reads as a broken system.
 */
export function getOneForVendor(sql: Sql, requirementId: string, vendorUserId: string) {
  return sql`
    SELECT ${sql.unsafe(REQUIREMENT_COLUMNS)}, r.status
    FROM "RequirementInvite" i
    JOIN "Requirement" r ON r.id = i."requirementId"
    LEFT JOIN "Quote" q
      ON q."requirementId" = r.id AND q."vendorUserId" = ${vendorUserId}
    WHERE i."vendorUserId" = ${vendorUserId}
      AND r.id = ${requirementId}
    LIMIT 1
  `;
}
