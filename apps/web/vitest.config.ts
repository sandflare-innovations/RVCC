import { config } from "dotenv";
import path from "node:path";
import { defineConfig } from "vitest/config";

config({ path: path.resolve(__dirname, ".env.test") });

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
