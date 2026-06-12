import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const SRC_DIR = dirname(fileURLToPath(import.meta.url));

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectSourceFiles(full));
    else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")) out.push(full);
  }
  return out;
}

describe("law #6 — @bos/scoring is pure (no IO, no SDK imports)", () => {
  it("no runtime module imports anything non-relative", () => {
    const files = collectSourceFiles(SRC_DIR);
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const imports = [...source.matchAll(/^\s*import[^;]*?from\s+["']([^"']+)["']/gm)]
        .map((m) => m[1] as string);
      for (const spec of imports) {
        expect(
          spec.startsWith("./") || spec.startsWith("../"),
          `${file} imports "${spec}" — engines stay pure (CLAUDE.md law #6)`,
        ).toBe(true);
      }
    }
  });
});
