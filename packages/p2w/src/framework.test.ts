import { describe, expect, it } from "vitest";
import {
  CASCADE_META,
  CASCADE_ORDER,
  computeConfidence,
  RE_CATEGORIES,
  TEST_LEVELS,
  type CascadeBox,
} from "./framework";

describe("cascade meta completeness (P2W-OS extraction)", () => {
  it("has the five cascade boxes in canonical order", () => {
    expect(CASCADE_ORDER).toEqual([
      "ASPIRATION",
      "WHERE_TO_PLAY",
      "HOW_TO_WIN",
      "CAPABILITIES",
      "MGMT_SYSTEMS",
    ]);
  });

  it("every box has a title, guiding question, and complete checklist", () => {
    for (const box of CASCADE_ORDER) {
      const meta = CASCADE_META[box];
      expect(meta.title.trim().length, box).toBeGreaterThan(0);
      expect(meta.question.trim().length, box).toBeGreaterThan(0);
      expect(meta.checklist.length, box).toBeGreaterThan(0);
      const keys = meta.checklist.map((c) => c.key);
      expect(new Set(keys).size, `${box}: duplicate checklist keys`).toBe(keys.length);
      for (const item of meta.checklist) {
        expect(item.label.trim().length, `${box}.${item.key}`).toBeGreaterThan(0);
        expect(item.help.trim().length, `${box}.${item.key}`).toBeGreaterThan(0);
      }
    }
  });

  it("preserves the exact extracted checklist sizes", () => {
    // Golden counts from the P2W-OS source — a silently dropped checklist
    // item would change computeConfidence denominators.
    expect(CASCADE_META.ASPIRATION.checklist).toHaveLength(4);
    expect(CASCADE_META.WHERE_TO_PLAY.checklist).toHaveLength(6);
    expect(CASCADE_META.HOW_TO_WIN.checklist).toHaveLength(4);
    expect(CASCADE_META.CAPABILITIES.checklist).toHaveLength(4);
    expect(CASCADE_META.MGMT_SYSTEMS.checklist).toHaveLength(4);
  });

  it("has the 7 WWHTBT reverse-engineering categories with standards of proof", () => {
    expect(RE_CATEGORIES).toHaveLength(7);
    expect(RE_CATEGORIES.map((c) => c.key)).toEqual([
      "SEGMENTS",
      "STRUCTURE",
      "CHANNELS",
      "END_CUSTOMERS",
      "CAPABILITIES",
      "COSTS",
      "REACTION",
    ]);
    for (const category of RE_CATEGORIES) {
      expect(category.label.trim().length, category.key).toBeGreaterThan(0);
      expect(category.standardOfProof.trim().length, category.key).toBeGreaterThan(0);
    }
  });

  it("has the three test levels", () => {
    expect(TEST_LEVELS.map((l) => l.key)).toEqual([
      "GUERRILLA",
      "SMALL_SCALE",
      "DEFINITIVE",
    ]);
  });
});

describe("computeConfidence golden cases", () => {
  const aspiration = (keys: string[]) =>
    computeConfidence(Object.fromEntries(keys.map((k) => [k, true])), "ASPIRATION");

  it("ASPIRATION (4 items): 0/4 → 0, 1/4 → 25, 2/4 → 50, 3/4 → 75, 4/4 → 100", () => {
    expect(aspiration([])).toBe(0);
    expect(aspiration(["consumer_centric"])).toBe(25);
    expect(aspiration(["consumer_centric", "competitive"])).toBe(50);
    expect(aspiration(["consumer_centric", "competitive", "specific"])).toBe(75);
    expect(
      aspiration(["consumer_centric", "competitive", "specific", "ambitious"]),
    ).toBe(100);
  });

  it("WHERE_TO_PLAY (6 items): rounds to nearest integer (1/6 → 17, 5/6 → 83)", () => {
    const wtp = (n: number) => {
      const keys = CASCADE_META.WHERE_TO_PLAY.checklist.slice(0, n).map((c) => c.key);
      return computeConfidence(
        Object.fromEntries(keys.map((k) => [k, true])),
        "WHERE_TO_PLAY",
      );
    };
    expect(wtp(1)).toBe(17); // 16.67 rounds up
    expect(wtp(2)).toBe(33);
    expect(wtp(3)).toBe(50);
    expect(wtp(5)).toBe(83); // 83.33 rounds down
    expect(wtp(6)).toBe(100);
  });

  it("ignores keys that are not in the box's checklist", () => {
    expect(
      computeConfidence({ bogus_key: true, another: true }, "ASPIRATION"),
    ).toBe(0);
    expect(
      computeConfidence({ consumer_centric: true, bogus_key: true }, "ASPIRATION"),
    ).toBe(25);
  });

  it("treats explicit false the same as absent", () => {
    expect(
      computeConfidence(
        { consumer_centric: true, competitive: false },
        "ASPIRATION",
      ),
    ).toBe(25);
  });

  it("returns 0 for an unknown box", () => {
    expect(computeConfidence({ anything: true }, "NOT_A_BOX" as CascadeBox)).toBe(0);
  });
});
