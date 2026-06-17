import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { argv } from "node:process";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function initRuneSkill() {
  try {
    // 1. Determine target directory (project root)
    let targetDir = process.env.INIT_CWD || process.cwd();

    // If run during postinstall under node_modules, targetDir might be the package dir itself.
    // If so, we go up to the user's project root (node_modules/@rune-ui/rune -> go up 3 levels)
    if (targetDir.includes("node_modules")) {
      const parts = targetDir.split("node_modules");
      targetDir = parts[0];
    }

    // 2. Read RUNE.md from the package
    // The RUNE.md will be at the root of the published package.
    // Relative to dist/bin.js, it is in "../RUNE.md"
    let runeMdPath = join(__dirname, "../RUNE.md");
    if (!existsSync(runeMdPath)) {
      runeMdPath = join(__dirname, "RUNE.md"); // fallback if in root
    }
    if (!existsSync(runeMdPath)) {
      runeMdPath = join(__dirname, "../../RUNE.md"); // fallback relative to src/bin
    }

    if (!existsSync(runeMdPath)) {
      console.error("Rune CLI: Could not find RUNE.md template in the package.");
      return;
    }

    const content = readFileSync(runeMdPath, "utf-8");
    const targetPath = join(targetDir, "RUNE.md");

    // Don't overwrite if it already exists and is identical
    if (existsSync(targetPath)) {
      const existingContent = readFileSync(targetPath, "utf-8");
      if (existingContent === content) {
        return;
      }
    }

    writeFileSync(targetPath, content, "utf-8");
    console.log(`\nᚱ Rune: Created RUNE.md at ${targetPath}`);
    console.log("  This file teaches AI agents and Code LLMs how to write Rune applications correctly.\n");
  } catch (err) {
    console.warn("Rune CLI warning: Failed to auto-create RUNE.md:", err.message);
  }
}

const isMain = argv[1] && fileURLToPath(import.meta.url) === argv[1];
if (isMain || process.env.npm_lifecycle_event === "postinstall") {
  initRuneSkill();
}
