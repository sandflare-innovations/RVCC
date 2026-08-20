/**
 * Runs DB migrations before compile when DATABASE_URL is available (CI / release).
 * Skips locally so `npm run build` can typecheck without a database.
 */
import { spawnSync } from "node:child_process";

function run(label, script) {
  console.log(`[prebuild] ${label}…`);
  const result = spawnSync("npm", ["run", script], { stdio: "inherit", shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!process.env.DATABASE_URL?.trim()) {
  console.log("[prebuild] DATABASE_URL not set — skipping DB migrations.");
  process.exit(0);
}

run("sourcing upgrade", "db:upgrade-sourcing");
run("uploads upgrade", "db:upgrade-uploads");
