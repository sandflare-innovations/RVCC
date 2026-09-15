import { describe, expect, it } from "vitest";

import { createPurchaseRequestSchema } from "../../src/modules/procurement/schemas/procurement.schema";

/** Shape the procurement portal sent before the 400 "Required" fix. */
const portalPayload = {
  title: "Laptop new for site team",
  description: "Need laptops for the site office.",
  department: "Civil & Structural Engineering",
  priority: "medium",
  requiredByDate: "2026-09-25",
  currency: "SAR",
  totalEstimatedAmount: 220000,
  items: [
    {
      name: "laptop new for wprling inwne3 tech tam",
      category: "Steel & Metalwork",
      quantity: 110,
      unit: "pcs",
      estimatedUnitPrice: 2000,
      totalPrice: 220000,
    },
  ],
};

describe("createPurchaseRequestSchema portal payload", () => {
  it("fails with Required when requesterName is missing", () => {
    const parsed = createPurchaseRequestSchema.safeParse(portalPayload);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const nameIssue = parsed.error.issues.find((issue) => issue.path.includes("requesterName"));
    expect(nameIssue?.message).toBe("Required");
  });

  it("accepts the portal body after session identity and estimatedAmount are filled", () => {
    const parsed = createPurchaseRequestSchema.safeParse({
      ...portalPayload,
      requesterName: "QA Procurement Director",
      requesterEmail: "qa@rvcc.test",
      estimatedAmount: portalPayload.totalEstimatedAmount,
    });
    expect(parsed.success).toBe(true);
  });
});
