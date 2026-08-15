import { describe, expect, it } from "vitest";

import { hashPassword as hashPasswordTs } from "@/lib/auth/password";
import { verifyPassword } from "@/lib/auth/password";

// Imports the CLI's duplicated hashing implementation to verify it stays structurally in sync
// with password.ts.
import { hashPassword as hashPasswordCli } from "../../../scripts/create-admin.mjs";

function parseHash(stored: string) {
  const [scheme, algo, iterations, saltB64, hashB64] = stored.split("$");
  return {
    scheme,
    algo,
    iterations: Number(iterations),
    saltBytes: Buffer.from(saltB64, "base64").length,
    keyBytes: Buffer.from(hashB64, "base64").length,
  };
}

describe("create-admin.mjs hashPassword", () => {
  it("produces a hash that verifies true against password.ts's verifyPassword", async () => {
    const stored = await hashPasswordCli("a-long-enough-password");
    expect(await verifyPassword("a-long-enough-password", stored)).toBe(true);
  });

  it("produces a hash that verifies false with the wrong password", async () => {
    const stored = await hashPasswordCli("a-long-enough-password");
    expect(await verifyPassword("totally-wrong-password", stored)).toBe(false);
  });

  it("has the same structural shape (scheme, algo, iterations, salt/key byte lengths) as password.ts's hashPassword", async () => {
    const fromCli = parseHash(await hashPasswordCli("same input, different implementations"));
    const fromTs = parseHash(await hashPasswordTs("same input, different implementations"));

    expect(fromCli).toEqual(fromTs);
  });
});
