import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
const dest = join(root, "public", "pdfjs", "pdf.worker.min.mjs");

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
if (!existsSync(dest)) {
  console.error("Failed to copy pdf.worker.min.mjs");
  process.exit(1);
}
console.log(`Copied pdf.worker → ${dest}`);
