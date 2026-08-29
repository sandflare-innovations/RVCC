/**
 * Deploy the Worker after a successful compile when running in CI / release.
 * Local `npm run build` compiles only; use `npm run release` to publish manually.
 */
import { spawnSync } from "node:child_process";

function shouldDeploy() {
  // Explicit opt-in via env var (set in deploy workflow only)
  if (process.env.RVCC_AUTO_DEPLOY === "1" || process.env.RVCC_AUTO_DEPLOY === "true") {
    return true;
  }
  // Only deploy in CI if Cloudflare credentials are available
  if ((process.env.CI === "true" || process.env.CI === "1") && process.env.CLOUDFLARE_API_TOKEN) {
    return true;
  }
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
