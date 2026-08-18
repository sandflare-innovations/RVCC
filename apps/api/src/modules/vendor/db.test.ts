import { beforeEach, describe, expect, it, vi } from "vitest";

const createPostgresClient = vi.fn(() => ({ query: vi.fn() }));

vi.mock("postgres", () => ({ default: createPostgresClient }));

describe("createSql", () => {
  beforeEach(() => {
    vi.resetModules();
    createPostgresClient.mockClear();
  });

  it("reuses the connection client for consecutive requests to the same database", async () => {
    const { createSql } = await import("./db");
    const env = { DATABASE_URL: "postgres://portal-db" } as Parameters<typeof createSql>[0];

    const first = createSql(env);
    const second = createSql(env);

    expect(second).toBe(first);
    expect(createPostgresClient).toHaveBeenCalledTimes(1);
  });
});
