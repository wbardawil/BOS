import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EXEMPLARS_MD, FRAMEWORK_MD } from "./content";
import { COACH_PERSONA } from "./persona";

const SRC_DIR = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(SRC_DIR, "..", "assets");

// TS template literals normalize CRLF to LF at parse time (ECMA-262), and the
// asset files carry git/Windows CRLF — so fidelity is char-exact modulo line
// endings. Normalizing both sides keeps the comparison honest about content.
const lf = (s: string) => s.replace(/\r\n/g, "\n");

describe("content fidelity — embedded constants match the copied P2W-OS docs", () => {
  it("FRAMEWORK_MD === assets/framework.md (modulo line endings)", () => {
    expect(lf(FRAMEWORK_MD)).toBe(
      lf(readFileSync(join(ASSETS_DIR, "framework.md"), "utf8")),
    );
  });

  it("EXEMPLARS_MD === assets/exemplars.md (modulo line endings)", () => {
    expect(lf(EXEMPLARS_MD)).toBe(
      lf(readFileSync(join(ASSETS_DIR, "exemplars.md"), "utf8")),
    );
  });

  it("COACH_PERSONA carries the load-bearing persona content", () => {
    // Spot-check verbatim anchor phrases from the P2W-OS source persona —
    // a paraphrased or truncated carve fails here.
    for (const anchor of [
      "Playing-to-Win Strategy Coach",
      "USD $10M–$150M revenue band",
      '"What would have to be true?"',
      "Segments, Structure, Channels, End Customers, Capabilities, Costs, Reaction",
      "Low-Cost Leadership OR Differentiation",
      '"shorten the odds,"',
      "Default to <= 200 words",
    ]) {
      expect(COACH_PERSONA).toContain(anchor);
    }
  });
});

describe("law #6 — @bos/p2w is pure (no IO, no SDK imports)", () => {
  it("no runtime module imports anything non-relative", () => {
    const files = readdirSync(SRC_DIR).filter(
      (f) => f.endsWith(".ts") && !f.endsWith(".test.ts"),
    );
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(join(SRC_DIR, file), "utf8");
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
