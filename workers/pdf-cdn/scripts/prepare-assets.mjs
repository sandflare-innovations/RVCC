/**
 * Stage edge assets for Cloudflare Workers Static Assets.
 * Files larger than 25 MiB cannot be bundled — those stay on ORIGIN_URL (Vercel)
 * and are cached at the edge after the first pull.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "../../..");
const WEB_PUBLIC = join(ROOT, "apps/web/public");
const OUT = join(__dirname, "../public");
const MAX_ASSET_BYTES = 25 * 1024 * 1024; // Workers Static Assets hard limit

const SOURCES = [
  { dir: join(WEB_PUBLIC, "pdfjs"), prefix: "pdfjs" },
  { dir: join(WEB_PUBLIC, "pdf/books"), prefix: "pdf/books" },
];

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

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

// Clean previous stage (keep folder)
if (existsSync(OUT)) {
  rmSync(OUT, { recursive: true, force: true });
}
ensureDir(OUT);

const staged = [];
const deferred = [];

for (const { dir, prefix } of SOURCES) {
  for (const file of listFiles(dir)) {
    const rel = relative(dir, file).replaceAll("\\", "/");
    const key = `${prefix}/${rel}`;
    const size = statSync(file).size;
    const sizeMb = (size / (1024 * 1024)).toFixed(1);

    if (size > MAX_ASSET_BYTES) {
      deferred.push({ key, sizeMb });
      console.log(`↷  skip (too large for Workers Assets): ${key} (${sizeMb} MB) → origin/Vercel`);
      continue;
    }

    const dest = join(OUT, key);
    ensureDir(dirname(dest));
    copyFileSync(file, dest);
    staged.push({ key, sizeMb });
    console.log(`✓  stage ${key} (${sizeMb} MB)`);
  }
}

writeFileSync(
  join(OUT, "_headers"),
  `/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, HEAD, OPTIONS
  Access-Control-Allow-Headers: Range, If-None-Match, If-Modified-Since
  Access-Control-Expose-Headers: Accept-Ranges, Content-Range, Content-Length, Content-Type, ETag, Cache-Control, X-CDN-Source
  Access-Control-Max-Age: 86400
  Accept-Ranges: bytes
  Cache-Control: public, max-age=31536000, immutable
  X-CDN-Source: cloudflare-assets
`
);

writeFileSync(
  join(OUT, "manifest.json"),
  JSON.stringify(
    {
      staged: staged.map((s) => s.key),
      deferredToOrigin: deferred.map((d) => d.key),
      generatedAt: new Date().toISOString(),
    },
    null,
    2
  )
);

console.log(`\nStaged ${staged.length} file(s) on Cloudflare Assets.`);
if (deferred.length) {
  console.log(`${deferred.length} file(s) remain on Vercel origin (cached after first edge hit):`);
  for (const d of deferred) console.log(`  - ${d.key} (${d.sizeMb} MB)`);
}
console.log("\nNext: pnpm run deploy");
