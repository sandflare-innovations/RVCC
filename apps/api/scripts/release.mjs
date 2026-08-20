/** Local one-shot: migrate (if DATABASE_URL) → compile → wrangler deploy. */
import { spawnSync } from "node:child_process";

process.env.RVCC_AUTO_DEPLOY = "1";

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
