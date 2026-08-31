/**
 * Prebuild hook for apps/api.
 * Ensures Prisma client is generated before TypeScript compiles.
 */
import { spawnSync } from "node:child_process";

if (process.env.SKIP_PRISMA_GENERATE !== "1") {
  console.log("[prebuild] Generating Prisma client…");
  spawnSync("npx", ["prisma", "generate"], {
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
}
