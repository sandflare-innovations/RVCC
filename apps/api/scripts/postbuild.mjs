/**
 * Deploy the Worker after a successful compile when running in CI / release.
 * Local `npm run build` compiles only; use `npm run release` to publish manually.
 */
import { spawnSync } from "node:child_process";

function shouldDeploy() {
  if (process.env.RVCC_AUTO_DEPLOY === "1" || process.env.RVCC_AUTO_DEPLOY === "true") {
    return true;
  }
  if (process.env.CI === "true" || process.env.CI === "1") return true;
  if (process.env.CF_PAGES === "1") return true;
  if (process.env.WORKERS_CI === "1") return true;
  return false;
}

if (!shouldDeploy()) {
  console.log("[postbuild] Not CI — skipping wrangler deploy (run npm run release to publish).");
  process.exit(0);
}

console.log("[postbuild] Deploying Worker…");
const result = spawnSync("npx", ["wrangler", "deploy"], { stdio: "inherit", shell: true });
process.exit(result.status ?? (result.error ? 1 : 0));
