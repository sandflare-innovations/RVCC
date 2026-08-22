/**
 * Apply sql/upgrades/2026-08-22-quote-files.sql
 *
 *   node --env-file-if-exists=.env scripts/apply-quote-files-upgrade.mjs
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const file = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../sql/upgrades/2026-08-22-quote-files.sql"
);
const script = readFileSync(file, "utf8");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, ssl: "require" });

try {
  await sql.unsafe(script);
  console.log("Applied:", file);
} catch (e) {
  console.error("Migration failed:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
