import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateOperatingDebt, type OperatingDebtInput } from "./operating-debt.js";
import type { PracticeMetadata } from "../types/database.js";

// Evidence expiry is measured against Date.now() — pin the clock.
const NOW = "2026-06-11T00:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});
afterEach(() => vi.useRealTimers());

function meta(practice_id: number, risk_floor: boolean, risk_floor_level: number | null): PracticeMetadata {
  return { id: practice_id, practice_id, pnl_impact: 3, speed_to_impact: 3, dependency_score: 3, risk_floor, risk_floor_level };
}

function daysAgo(days: number): string {
  return new Date(Date.parse(NOW) - days * 24 * 60 * 60 * 1000).toISOString();
}

function makeInput(overrides: Partial<OperatingDebtInput>): OperatingDebtInput {
  return {
    practice_scores: [],
    practice_metadata: [],
    evidence_items: [],
    practice_names: new Map([[1, "Fictional Practice One"], [2, "Fictional Practice Two"], [3, "Fictional Practice Three"], [4, "Fictional Practice Four"]]),
    area_names: new Map([[1, "Fictional Area"]]),
    practice_area_map: new Map([[1, 1], [2, 1], [3, 1], [4, 1]]),
    ...overrides,
  };
}

describe("calculateOperatingDebt — golden composite case", () => {
  // 3 practices below L2 (+2 each, breached practices count too), 1 expired
  // evidence (+1), 2 risk floor breaches (+3 each) = 13
  // Computed lazily inside each test so the fake clock from beforeEach applies.
  const compute = () => calculateOperatingDebt(makeInput({
    practice_scores: [
      { practice_id: 1, competency_score: 1 },   // below level 2
      { practice_id: 2, competency_score: 2 },   // at level 2 — not debt
      { practice_id: 3, competency_score: 1 },   // breach: floor 3, gap 2 → critical
      { practice_id: 4, competency_score: 1 },   // breach: floor 2, gap 1 → warning
    ],
    practice_metadata: [
      meta(1, false, null),
      meta(2, false, null),
      meta(3, true, 3),
      meta(4, true, 2),
    ],
    evidence_items: [
      { evidence_id: "ev-1", practice_id: 1, created_at: daysAgo(100), expiry_period_days: 30 }, // expired 70 days ago
      { evidence_id: "ev-2", practice_id: 2, created_at: daysAgo(10), expiry_period_days: 30 },  // fresh
      { evidence_id: "ev-3", practice_id: 2, created_at: daysAgo(400), expiry_period_days: null }, // never expires
    ],
  }));

  it("total debt = 3×2 + 1×1 + 2×3 = 13", () => {
    expect(compute().total_debt_score).toBe(13);
  });

  it("lists practices below Level 2 with names, areas, and floor status", () => {
    expect(compute().practices_below_level_2).toEqual([
      { practice_id: 1, practice_name: "Fictional Practice One", area_name: "Fictional Area", current_level: 1, risk_floor: false },
      { practice_id: 3, practice_name: "Fictional Practice Three", area_name: "Fictional Area", current_level: 1, risk_floor: true },
      { practice_id: 4, practice_name: "Fictional Practice Four", area_name: "Fictional Area", current_level: 1, risk_floor: true },
    ]);
  });

  it("counts only truly expired evidence and computes days overdue", () => {
    const result = compute();
    expect(result.expired_evidence_count).toBe(1);
    expect(result.expired_evidence_items).toEqual([
      {
        evidence_id: "ev-1",
        practice_id: 1,
        practice_name: "Fictional Practice One",
        expired_at: daysAgo(70),
        days_overdue: 70,
      },
    ]);
  });

  it("grades breach severity: gap ≥ 2 critical, below warning", () => {
    expect(compute().risk_floor_breaches).toEqual([
      { practice_id: 3, practice_name: "Fictional Practice Three", risk_floor_level: 3, current_level: 1, gap: 2, severity: "critical" },
      { practice_id: 4, practice_name: "Fictional Practice Four", risk_floor_level: 2, current_level: 1, gap: 1, severity: "warning" },
    ]);
  });

  it("reports a stable trend (single-point calculation)", () => {
    expect(compute().debt_trend).toBe("stable");
  });
});

describe("calculateOperatingDebt — breach skip conditions", () => {
  it("skips metadata without a floor, with a null level, or with no score", () => {
    const result = calculateOperatingDebt(makeInput({
      practice_scores: [{ practice_id: 1, competency_score: 1 }],
      practice_metadata: [
        meta(1, false, 3),  // risk_floor false → skip
        meta(1, true, null), // null level → skip
        meta(2, true, 3),    // no score row for practice 2 → skip
      ],
    }));
    expect(result.risk_floor_breaches).toEqual([]);
  });

  it("no breach when competency meets the floor", () => {
    const result = calculateOperatingDebt(makeInput({
      practice_scores: [{ practice_id: 1, competency_score: 3 }],
      practice_metadata: [meta(1, true, 3)],
    }));
    expect(result.risk_floor_breaches).toEqual([]);
    expect(result.total_debt_score).toBe(0);
  });
});

describe("calculateOperatingDebt — name fallbacks", () => {
  it("falls back to 'Practice N' / 'Area N' when maps have no entry", () => {
    const result = calculateOperatingDebt(makeInput({
      practice_scores: [{ practice_id: 7, competency_score: 1 }],
      practice_metadata: [],
      practice_names: new Map(),
      area_names: new Map(),
      practice_area_map: new Map(),
    }));
    expect(result.practices_below_level_2).toEqual([
      { practice_id: 7, practice_name: "Practice 7", area_name: "Area 0", current_level: 1, risk_floor: false },
    ]);
  });

  it("falls back to 'Practice N' in expired evidence and breach items", () => {
    const result = calculateOperatingDebt(makeInput({
      practice_scores: [{ practice_id: 9, competency_score: 2 }],
      practice_metadata: [meta(9, true, 4)],
      evidence_items: [{ evidence_id: "ev-9", practice_id: 9, created_at: daysAgo(100), expiry_period_days: 30 }],
      practice_names: new Map(),
    }));
    expect(result.expired_evidence_items[0]!.practice_name).toBe("Practice 9");
    expect(result.risk_floor_breaches[0]!.practice_name).toBe("Practice 9");
  });

  it("empty input → zero debt", () => {
    const result = calculateOperatingDebt(makeInput({}));
    expect(result.total_debt_score).toBe(0);
    expect(result.practices_below_level_2).toEqual([]);
    expect(result.expired_evidence_count).toBe(0);
    expect(result.risk_floor_breaches).toEqual([]);
  });
});
