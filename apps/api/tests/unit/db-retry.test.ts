import { expect, test } from "vitest";

import { isTransientDbError, withTransientRetry } from "../../src/lib/sql";

test("treats dropped sockets as transient", () => {
  expect(isTransientDbError(new Error("read ECONNRESET"))).toBe(true);
  expect(isTransientDbError(new Error("getaddrinfo ENOTFOUND db.prisma.io"))).toBe(true);
  expect(isTransientDbError(new Error("Connection terminated unexpectedly"))).toBe(true);
  expect(isTransientDbError(new Error("Unique constraint failed on the fields: (`email`)"))).toBe(
    false
  );
});

test("retries transient failures then succeeds", async () => {
  let attempts = 0;
  const value = await withTransientRetry(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error("read ECONNRESET");
    return "ok";
  });
  expect(value).toBe("ok");
  expect(attempts).toBe(3);
});

test("does not retry business errors", async () => {
  let attempts = 0;
  await expect(
    withTransientRetry(async () => {
      attempts += 1;
      throw new Error("Unique constraint failed");
    })
  ).rejects.toThrow("Unique constraint failed");
  expect(attempts).toBe(1);
});
