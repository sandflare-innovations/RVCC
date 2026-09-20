import { describe, expect, it } from "vitest";

import { adminProxyMatches } from "./proxy-matcher";

describe("admin proxy matcher", () => {
  it("does not intercept RFQ document uploads", () => {
    expect(adminProxyMatches("/api/requirements/req_123/attachments")).toBe(false);
    expect(adminProxyMatches("/api/requirements/req_123/manual-quotes/q1/attachments")).toBe(
      false
    );
  });

  it("still gates admin pages", () => {
    expect(adminProxyMatches("/requirements/new")).toBe(true);
    expect(adminProxyMatches("/login")).toBe(true);
  });
});
