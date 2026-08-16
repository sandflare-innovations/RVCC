/**
 * Upload local PDF books + pdf.js worker into R2.
 *
 * Prerequisites:
 *   1. Enable R2 in Cloudflare Dashboard → R2 → Overview (requires payment method even on free tier)
 *   2. pnpm dlx wrangler r2 bucket create rvcc-pdf-assets
 *   3. Uncomment [[r2_buckets]] in wrangler.toml
 *
 * If you have NOT enabled R2, skip this script — use origin-pull mode instead (see README).
 */

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../..");
const WEB_PUBLIC = join(ROOT, "apps/web/public");
const BUCKET = "rvcc-pdf-assets";
const MAX_RETRIES = 3;

const TARGETS = [
  { localDir: join(WEB_PUBLIC, "pdf/books"), prefix: "pdf/books" },
  { localDir: join(WEB_PUBLIC, "pdfjs"), prefix: "pdfjs" },
];

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...listFiles(full));
    else out.push(full);
  }
  return out;
}

function runWrangler(args) {
  return spawnSync("pnpm", ["exec", "wrangler", ...args], {
    encoding: "utf8",
    shell: true,
  });
}

function ensureBucketReady() {
  const list = runWrangler(["r2", "bucket", "list"]);
  const combined = `${list.stdout || ""}\n${list.stderr || ""}`;

  if (list.status !== 0) {
    if (combined.includes("10042") || combined.toLowerCase().includes("enable r2")) {
      console.error(`
R2 is not enabled on this Cloudflare account.

Fix:
  1. Open https://dash.cloudflare.com → R2 Object Storage
  2. Click "Purchase R2 plan" / Enable (free tier still needs a payment method on file)
  3. Then: pnpm dlx wrangler r2 bucket create ${BUCKET}
  4. Uncomment [[r2_buckets]] in wrangler.toml
  5. Re-run: pnpm run upload

OR skip R2 entirely — use origin-pull CDN (set ORIGIN_URL, then pnpm run deploy).
`);
      process.exit(1);
    }
    console.error(combined);
    process.exit(1);
  }

  if (!combined.includes(BUCKET)) {
    console.log(`Bucket "${BUCKET}" not found — creating...`);
    const create = runWrangler(["r2", "bucket", "create", BUCKET]);
    if (create.status !== 0) {
      console.error(create.stderr || create.stdout);
      process.exit(1);
    }
  }
}

function upload(localPath, key) {
  const sizeMb = (statSync(localPath).size / (1024 * 1024)).toFixed(1);
  console.log(`↑  ${key}  (${sizeMb} MB)`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const result = runWrangler([
      "r2",
      "object",
      "put",
      `${BUCKET}/${key}`,
      "--file",
      localPath,
      "--remote",
    ]);

    if (result.status === 0) return;

    const err = `${result.stdout || ""}\n${result.stderr || ""}`;
    if (err.includes("10042") || err.toLowerCase().includes("enable r2")) {
      console.error("\nR2 is not enabled. See instructions above / README.md\n");
      process.exit(1);
    }

    console.warn(`  attempt ${attempt}/${MAX_RETRIES} failed${attempt < MAX_RETRIES ? " — retrying..." : ""}`);
    if (attempt === MAX_RETRIES) {
      console.error(err);
      throw new Error(`Failed to upload ${key}`);
    }
  }
}

console.log(`Uploading assets to R2 bucket: ${BUCKET}\n`);
ensureBucketReady();

let count = 0;
for (const { localDir, prefix } of TARGETS) {
  const files = listFiles(localDir);
  if (files.length === 0) {
    console.warn(`⚠  No files in ${relative(ROOT, localDir)}`);
    continue;
  }
  for (const file of files) {
    const rel = relative(localDir, file).replaceAll("\\", "/");
    upload(file, `${prefix}/${rel}`);
    count += 1;
  }
}

console.log(`\nDone. Uploaded ${count} object(s).`);
console.log("Uncomment [[r2_buckets]] in wrangler.toml if needed, then: pnpm run deploy");
