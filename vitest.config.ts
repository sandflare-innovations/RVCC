import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Database tests use DATABASE_URL_TEST so a stray run can never touch real data.
config({ path: ".env.test", quiet: true });

export default defineConfig({
  test: {
    include: ["{apps,packages,workers}/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
    environment: "node",
    // Database tests share one Postgres instance; parallel files would race on truncation.
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
