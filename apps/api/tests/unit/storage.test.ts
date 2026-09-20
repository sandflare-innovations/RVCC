import { describe, expect, it } from "vitest";
import {
  detectMagicMime,
  isUploadFile,
  validateUploadBytes,
  validateUploadFile,
  sanitizeFileName,
  storageKeyForCareer,
  storageKeyForQuote,
  resolveSourcingMime,
} from "../../src/lib/storage";

describe("QA Security Tests: File Upload & Storage Key Sanitization", () => {
  describe("Path Traversal & Filename Sanitization", () => {
    it("should strip directory traversal characters from file names", () => {
      expect(sanitizeFileName("../../../etc/passwd")).toBe("passwd");
      expect(sanitizeFileName("..\\..\\windows\\system32\\cmd.exe")).toBe("cmd.exe");
      expect(sanitizeFileName("valid-file_name (1).pdf")).toBe("valid-file_name (1).pdf");
    });

    it("should safely slugify names in career storage keys", () => {
      const key = storageKeyForCareer("job123", "malicious/../../test.pdf", "John Doe");
      expect(key.startsWith("careers/job123/john-doe-cv-")).toBe(true);
      expect(key.endsWith(".pdf")).toBe(true);
      expect(key.includes("..")).toBe(false);
    });

    it("should safely slugify names in quote storage keys", () => {
      const key = storageKeyForQuote("req1", "quote2", "secret_doc.pdf");
      expect(key.startsWith("procurement/quotes/req1/quote2/secret-doc-")).toBe(true);
      expect(key.endsWith(".pdf")).toBe(true);
      expect(key.includes("..")).toBe(false);
    });
  });

  describe("Magic Byte MIME Detection & Content Sniffing", () => {
    it("should detect authentic PDF header (%PDF-)", () => {
      const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
      expect(detectMagicMime(pdfBytes)).toBe("application/pdf");
    });

    it("should detect authentic PNG header", () => {
      const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(detectMagicMime(pngBytes)).toBe("image/png");
    });

    it("should map Office ZIP/OLE magic onto sourcing Word and Excel types", () => {
      const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
      const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1]);
      expect(resolveSourcingMime("quote.xlsx", "application/octet-stream", zip)).toBe(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      expect(resolveSourcingMime("spec.docx", "", zip)).toBe(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      expect(resolveSourcingMime("old.doc", "", ole)).toBe("application/msword");
      expect(resolveSourcingMime("old.xls", "", ole)).toBe("application/vnd.ms-excel");
      expect(resolveSourcingMime("malware.zip", "", zip)).toBeNull();
    });

    it("should detect authentic JPEG header", () => {
      const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(detectMagicMime(jpegBytes)).toBe("image/jpeg");
    });

    it("should reject spoofed files (e.g. bash script or exe renamed to .pdf)", () => {
      // Shell script: #!/bin/bash
      const scriptBytes = new TextEncoder().encode("#!/bin/bash\necho 'hacked'");
      expect(detectMagicMime(scriptBytes)).toBeNull();

      const err = validateUploadBytes(scriptBytes, {
        maxBytes: 10 * 1024 * 1024,
        allowedMimes: new Set(["application/pdf"]),
      });
      expect(err).toMatch(/invalid or not allowed/i);
    });
  });

  describe("Upload file metadata checks", () => {
    it("should duck-type File-like multipart parts", () => {
      const fake = {
        name: "cr.pdf",
        size: 12,
        type: "application/pdf",
        arrayBuffer: async () => new ArrayBuffer(12),
      };
      expect(isUploadFile(fake)).toBe(true);
      expect(isUploadFile("not-a-file")).toBe(false);
      expect(isUploadFile(null)).toBe(false);
    });

    it("should allow empty or octet-stream MIME (magic bytes are authoritative)", () => {
      const emptyType = {
        name: "cr.pdf",
        size: 100,
        type: "",
      } as File;
      const octet = {
        name: "cr.pdf",
        size: 100,
        type: "application/octet-stream",
      } as File;
      expect(validateUploadFile(emptyType, { maxBytes: 1024 })).toBeNull();
      expect(validateUploadFile(octet, { maxBytes: 1024 })).toBeNull();
    });

    it("should still reject disallowed declared MIME types", () => {
      const exe = {
        name: "malware.exe",
        size: 100,
        type: "application/x-msdownload",
      } as File;
      expect(validateUploadFile(exe, { maxBytes: 1024 })).toMatch(/not allowed/i);
    });
  });

  describe("Size Boundary Tests", () => {
    it("should reject empty files (0 bytes)", () => {
      const emptyBytes = new Uint8Array(0);
      expect(validateUploadBytes(emptyBytes, { maxBytes: 1024 })).toBe("File is empty");
    });

    it("should reject files exceeding maxBytes", () => {
      const oversizedBytes = new Uint8Array(1025);
      // Valid PDF magic header
      oversizedBytes[0] = 0x25;
      oversizedBytes[1] = 0x50;
      oversizedBytes[2] = 0x44;
      oversizedBytes[3] = 0x46;

      const err = validateUploadBytes(oversizedBytes, { maxBytes: 1024 });
      expect(err).toMatch(/File must be/i);
    });

    it("should accept valid files within boundary", () => {
      const validPdfBytes = new Uint8Array(100);
      validPdfBytes[0] = 0x25;
      validPdfBytes[1] = 0x50;
      validPdfBytes[2] = 0x44;
      validPdfBytes[3] = 0x46;

      expect(
        validateUploadBytes(validPdfBytes, {
          maxBytes: 1024,
          allowedMimes: new Set(["application/pdf"]),
        })
      ).toBeNull();
    });
  });
});
