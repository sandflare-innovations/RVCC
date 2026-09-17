import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "../../src/config/env";
import { SourcingFilesService } from "../../src/modules/sourcing/services/sourcing-files.service";
import { prisma } from "../../src/lib/prisma";
import { getSecureDocument } from "../../src/lib/storage";

vi.mock("../../src/lib/prisma", () => ({
  prisma: {
    quoteAttachment: { findFirst: vi.fn() },
    manualQuotationAttachment: { findFirst: vi.fn() },
  },
}));

vi.mock("../../src/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/lib/storage")>();
  return {
    ...actual,
    getSecureDocument: vi.fn(),
    keyFromStoredUrl: vi.fn(() => "procurement/quotes/req-1/q-1/file.pdf"),
  };
});

const env = { NODE_ENV: "test" } as Env;
const request = new Request("http://localhost/vendor/requirements/req-1/quote/attachment/att-b");

describe("vendor quote attachment ACL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not stream another vendor's quote file even with a guessed id", async () => {
    vi.mocked(prisma.quoteAttachment.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.manualQuotationAttachment.findFirst).mockResolvedValue(null);

    const result = await SourcingFilesService.downloadVendorQuoteFile(
      env,
      request,
      "req-1",
      "att-b",
      "vendor-a",
      true
    );

    expect(result).toEqual({ error: "File not found.", status: 404 });
    expect(getSecureDocument).not.toHaveBeenCalled();
  });

  it("streams the caller's own quote file after the vendorUserId filter matches", async () => {
    vi.mocked(prisma.quoteAttachment.findFirst).mockResolvedValue({
      id: "att-a",
      fileName: "own.pdf",
      fileUrl: "r2:procurement/quotes/req-1/q-1/own.pdf",
    } as any);
    vi.mocked(getSecureDocument).mockResolvedValue({
      body: new ArrayBuffer(8),
      contentType: "application/pdf",
    });

    const result = await SourcingFilesService.downloadVendorQuoteFile(
      env,
      request,
      "req-1",
      "att-a",
      "vendor-a",
      true
    );

    expect("response" in result).toBe(true);
    if ("response" in result) {
      expect(result.response.status).toBe(200);
      expect(result.response.headers.get("Content-Disposition")).toMatch(/own\.pdf/);
    }
    expect(prisma.quoteAttachment.findFirst).toHaveBeenCalledWith({
      where: {
        id: "att-a",
        quote: { requirementId: "req-1", vendorUserId: "vendor-a" },
      },
    });
  });
});
