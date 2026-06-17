/**
 * Rune Build Script
 *
 * Creates single-file bundles for CDN distribution.
 * No external dependencies required.
 *
 * Run: node scripts/build.js
 */

import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");

mkdirSync(DIST, { recursive: true });

// --- Core Bundle ---
function buildCore() {
  const reactive = readFileSync(join(ROOT, "src/core/reactive.js"), "utf-8");
  const viewModule = readFileSync(join(ROOT, "src/core/view.js"), "utf-8");
  const resource = readFileSync(join(ROOT, "src/core/resource.js"), "utf-8");
  const component = readFileSync(join(ROOT, "src/core/component.js"), "utf-8");

  // Strip imports and re-exports, combine into single IIFE
  const cleanImports = (code) =>
    code
      .replace(/^import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*$/gm, "")
      .replace(/^export\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*$/gm, "")
      .replace(/^export\s+/gm, "");

  const bundle = `/**
 * Rune UI v0.1.0
 * Small primitives for the agentic web.
 * https://github.com/user/rune-ui
 * MIT License
 */
const Rune = (() => {
${cleanImports(reactive)}
${cleanImports(viewModule)}
${cleanImports(resource)}
${cleanImports(component)}

return {
  signal, computed, effect, batch, untrack, onMount, onCleanup,
  view, html, mount,
  resource,
  define,
};
})();

export const {
  signal, computed, effect, batch, untrack, onMount, onCleanup,
  view, html, mount,
  resource,
  define,
} = Rune;

export default Rune;
`;

  writeFileSync(join(DIST, "rune.core.js"), bundle);
  const size = statSync(join(DIST, "rune.core.js")).size;
  console.log(`✓ dist/rune.core.js (${(size / 1024).toFixed(1)} KB)`);
}

// --- Store Bundle ---
function buildStore() {
  const store = readFileSync(join(ROOT, "src/store/index.js"), "utf-8");
  const bundle = `import { signal, batch } from "./rune.core.js";
${store.replace(/^import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*$/gm, "")}`;
  writeFileSync(join(DIST, "rune.store.js"), bundle);
  const size = statSync(join(DIST, "rune.store.js")).size;
  console.log(`✓ dist/rune.store.js (${(size / 1024).toFixed(1)} KB)`);
}

// --- Router Bundle ---
function buildRouter() {
  const router = readFileSync(join(ROOT, "src/router/index.js"), "utf-8");
  const bundle = `import { signal, computed, effect } from "./rune.core.js";
${router.replace(/^import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"];?\s*$/gm, "")}`;
  writeFileSync(join(DIST, "rune.router.js"), bundle);
  const size = statSync(join(DIST, "rune.router.js")).size;
  console.log(`✓ dist/rune.router.js (${(size / 1024).toFixed(1)} KB)`);
}

console.log("Building Rune...\n");
buildCore();
buildStore();
buildRouter();
console.log("\nDone.");
