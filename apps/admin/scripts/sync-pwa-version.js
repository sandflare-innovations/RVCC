/**
 * Bumps CACHE_VERSION in public/sw.js before each build so browsers
 * always detect a new service worker and invalidate old caches.
 */
const fs = require("fs");
const path = require("path");

const swPath = path.join(__dirname, "..", "public", "sw.js");
const version =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ||
  process.env.PWA_CACHE_VERSION ||
  `build-${Date.now()}`;

let content = fs.readFileSync(swPath, "utf8");

if (!content.includes("const CACHE_VERSION = ")) {
  console.error("[pwa] CACHE_VERSION constant not found in sw.js");
  process.exit(1);
}

const next = `const CACHE_VERSION = '${version}';`;
if (content.match(/const CACHE_VERSION = '[^']+';/)?.[0] === next) {
  console.log(`[pwa] CACHE_VERSION already ${version}`);
  process.exit(0);
}

content = content.replace(/const CACHE_VERSION = '[^']+';/, next);
fs.writeFileSync(swPath, content);
console.log(`[pwa] CACHE_VERSION -> ${version}`);
