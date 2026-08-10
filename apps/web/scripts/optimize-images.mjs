/**
 * Converts public/images/** to WebP, sized for the web.
 *
 * Non-destructive: originals are never touched. Output goes to
 * public/images-optimized/** mirroring the input tree, plus a manifest.json
 * mapping old path -> new path (useful for a CMS upload or a code rewrite).
 *
 *   node ./scripts/optimize-images.mjs            # convert
 *   node ./scripts/optimize-images.mjs --dry-run  # report only, write nothing
 *
 * Every source file is currently PNG. PNG is lossless and intended for flat
 * graphics; for photographs it is close to the worst available choice, which is
 * why the project shots average ~19MB each.
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, extname, join, relative } from "node:path";

import sharp from "sharp";

const SRC = new URL("../public/images/", import.meta.url).pathname;
const OUT = new URL("../public/images-optimized/", import.meta.url).pathname;

const DRY_RUN = process.argv.includes("--dry-run");

/*
 * Logos are line art: they need crisp edges and transparency, but they render
 * small, so the width cap does the heavy lifting and quality stays high.
 * Photographs render large but tolerate lossy compression well.
 */
const LOGO_DIRS = new Set(["clients", "concern-companies", "logo"]);
const PROFILES = {
  logo: { maxWidth: 600, quality: 85 },
  photo: { maxWidth: 2000, quality: 75 },
};

/** Files below this are already cheap; re-encoding risks making them larger. */
const SKIP_UNDER_BYTES = 20 * 1024;
const CONCURRENCY = 8;

const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".tiff", ".avif"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (IMAGE_EXT.has(extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

const mb = (n) => (n / 1048576).toFixed(2).padStart(8) + " MB";

async function convert(file) {
  const rel = relative(SRC, file);
  const topDir = rel.split("/")[0];
  const profile = LOGO_DIRS.has(topDir) ? PROFILES.logo : PROFILES.photo;

  const before = (await stat(file)).size;
  const outPath = join(OUT, rel).replace(/\.[^.]+$/, ".webp");

  if (before < SKIP_UNDER_BYTES) {
    return { rel, before, after: before, skipped: true };
  }

  const image = sharp(file, { failOn: "none" });
  const meta = await image.metadata();

  // `withoutEnlargement` keeps small sources at their native size.
  const pipeline = image
    .resize({ width: profile.maxWidth, withoutEnlargement: true })
    .webp({ quality: profile.quality, effort: 5 });

  if (DRY_RUN) {
    const buf = await pipeline.toBuffer();
    return { rel, before, after: buf.length, width: meta.width, outPath };
  }

  await mkdir(dirname(outPath), { recursive: true });
  const info = await pipeline.toFile(outPath);
  return { rel, before, after: info.size, width: meta.width, outPath };
}

/** Simple bounded pool — sharp is CPU-bound, so unbounded spawning just thrashes. */
async function mapPool(items, limit, fn) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) results.push(await fn(items[i++]));
    })
  );
  return results;
}

async function main() {
  if (!existsSync(SRC)) {
    console.error(`No such directory: ${SRC}`);
    process.exit(1);
  }

  const files = await walk(SRC);
  console.log(`\n${DRY_RUN ? "[dry run] " : ""}Optimising ${files.length} images…\n`);

  const results = (await mapPool(files, CONCURRENCY, convert)).sort(
    (a, b) => b.before - a.before
  );

  let totalBefore = 0;
  let totalAfter = 0;
  for (const r of results) {
    totalBefore += r.before;
    totalAfter += r.after;
  }

  console.log("Largest 15:");
  for (const r of results.slice(0, 15)) {
    const saved = r.before ? (1 - r.after / r.before) * 100 : 0;
    console.log(
      `  ${mb(r.before)} -> ${mb(r.after)}  ${saved.toFixed(0).padStart(3)}%  ${r.rel}` +
        (r.skipped ? "  (skipped, already small)" : "")
    );
  }

  if (!DRY_RUN) {
    const manifest = Object.fromEntries(
      results
        .filter((r) => r.outPath)
        .map((r) => [`/images/${r.rel}`, `/images-optimized/${relative(OUT, r.outPath)}`])
    );
    await mkdir(OUT, { recursive: true });
    await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  }

  const pct = totalBefore ? (1 - totalAfter / totalBefore) * 100 : 0;
  console.log(
    `\n  before: ${mb(totalBefore)}` +
      `\n  after:  ${mb(totalAfter)}` +
      `\n  saved:  ${pct.toFixed(1)}%\n`
  );
  if (!DRY_RUN) console.log(`Written to public/images-optimized/ (originals untouched)\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
