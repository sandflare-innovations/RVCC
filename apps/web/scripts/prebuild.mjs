import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const require = createRequire(import.meta.url);

// 1. Sync PWA Version
const swPath = join(root, "public", "sw.js");
if (existsSync(swPath)) {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
    process.env.PWA_CACHE_VERSION ||
    `build-${Date.now()}`;

  let content = readFileSync(swPath, "utf8");
  if (content.includes("const CACHE_VERSION = ")) {
    const next = `const CACHE_VERSION = '${version}';`;
    content = content.replace(/const CACHE_VERSION = '[^']+';/, next);
    writeFileSync(swPath, content);
    console.log(`[pwa] CACHE_VERSION -> ${version}`);
  }
}

// 2. Copy PDF Worker
const src = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
const dest = join(root, "public", "pdfjs", "pdf.worker.min.mjs");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
if (!existsSync(dest)) {
  console.error("Failed to copy pdf.worker.min.mjs");
  process.exit(1);
}
console.log(`Copied pdf.worker → ${dest}`);
