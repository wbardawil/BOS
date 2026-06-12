import { describe, expect, it } from "vitest";
import { computeOPI } from "./opi.js";
import { DEFAULT_LIFECYCLE_WEIGHTS, LIFECYCLE_MODIFIERS } from "../constants/lifecycle-weights.js";
import type { LifecycleWeights, OPIInput } from "../types/opi.js";

// Identity weights isolate the gap term so final_opi === gap — lets boundary
// goldens hit exact phase thresholds without floating noise.
const GAP_ONLY: LifecycleWeights = { w1_gap: 1, w2_pnl: 0, w3_speed: 0, w4_dependency: 0, w5_risk: 0 };

function input(overrides: Partial<OPIInput>): OPIInput {
  return {
    practice_id: 1,
    importance_score: 3,
    competency_score: 3,
    pnl_impact: 0,
    speed_to_impact: 0,
    dependency_score: 0,
    risk_floor: false,
    risk_floor_level: null,
    ...overrides,
  };
}

describe("computeOPI — formula golden cases", () => {
  it("computes the weighted formula with startup weights and modifier (hand-verified)", () => {
    // gap = 5-2 = 3 → 3×0.35 = 1.05; pnl 4×0.20 = 0.8; speed 3×0.25 = 0.75;
    // dep 2×0.10 = 0.2; risk 0 → sum 2.8 × 1.2 = 3.36
    const [r] = computeOPI(
      [input({ importance_score: 5, competency_score: 2, pnl_impact: 4, speed_to_impact: 3, dependency_score: 2 })],
      DEFAULT_LIFECYCLE_WEIGHTS.startup,
      LIFECYCLE_MODIFIERS.startup,
    );
    expect(r!.gap).toBe(3);
    expect(r!.weighted_gap).toBe(1.05);
    expect(r!.pnl_score).toBe(0.8);
    expect(r!.speed_score).toBe(0.75);
    expect(r!.dependency_score).toBe(0.2);
    expect(r!.risk_score).toBe(0);
    expect(r!.lifecycle_mod).toBe(1.2);
    expect(r!.final_opi).toBe(3.36);
    expect(r!.phase_number).toBe(2);
    expect(r!.phase_label).toBe("Structure");
    expect(r!.risk_floor_triggered).toBe(false);
  });

  it("adds the risk term and triggers the floor when competency < risk_floor_level", () => {
    // gap = 5-1 = 4 → 1.4; pnl 0.8; speed 0.75; dep 0.2; risk 3×0.10 = 0.3
    // sum 3.45 × 1.2 = 4.14 → Phase 1 by score AND by floor
    const [r] = computeOPI(
      [input({ importance_score: 5, competency_score: 1, pnl_impact: 4, speed_to_impact: 3, dependency_score: 2, risk_floor: true, risk_floor_level: 3 })],
      DEFAULT_LIFECYCLE_WEIGHTS.startup,
      LIFECYCLE_MODIFIERS.startup,
    );
    expect(r!.risk_floor_triggered).toBe(true);
    expect(r!.risk_score).toBe(0.3);
    expect(r!.final_opi).toBe(4.14);
    expect(r!.phase_number).toBe(1);
    expect(r!.phase_label).toBe("Proof");
  });

  it("rounds final and component scores to 3 decimals", () => {
    const [r] = computeOPI(
      [input({ importance_score: 4, competency_score: 3 })], // gap 1
      { ...GAP_ONLY, w1_gap: 1 / 3 },
      1,
    );
    expect(r!.weighted_gap).toBe(0.333);
    expect(r!.final_opi).toBe(0.333);
  });
});

describe("computeOPI — gap clamping", () => {
  it("clamps negative gaps to 0", () => {
    const [r] = computeOPI([input({ importance_score: 1, competency_score: 5 })], GAP_ONLY, 1);
    expect(r!.gap).toBe(0);
    expect(r!.final_opi).toBe(0);
  });

  it("clamps gaps above 5 to 5", () => {
    const [r] = computeOPI([input({ importance_score: 10, competency_score: 1 })], GAP_ONLY, 1);
    expect(r!.gap).toBe(5);
  });
});

describe("computeOPI — phase assignment at boundaries", () => {
  const phaseAt = (gap: number) =>
    computeOPI([input({ importance_score: gap, competency_score: 0 })], GAP_ONLY, 1)[0]!.phase_number;

  it("OPI exactly 3.5 → Phase 1 (Proof)", () => expect(phaseAt(3.5)).toBe(1));
  it("OPI just below 3.5 → Phase 2 (Structure)", () => expect(phaseAt(3.499)).toBe(2));
  it("OPI exactly 2.0 → Phase 2 (Structure)", () => expect(phaseAt(2.0)).toBe(2));
  it("OPI just below 2.0 → Phase 3 (Scale)", () => expect(phaseAt(1.999)).toBe(3));
  it("OPI 0 → Phase 3 (Scale)", () => expect(phaseAt(0)).toBe(3));

  it("risk floor forces Phase 1 even when the score lands in Phase 3", () => {
    const [r] = computeOPI(
      [input({ importance_score: 1, competency_score: 1, risk_floor: true, risk_floor_level: 3 })],
      GAP_ONLY,
      1,
    );
    expect(r!.final_opi).toBeLessThan(2);
    expect(r!.phase_number).toBe(1);
    expect(r!.risk_floor_triggered).toBe(true);
  });
});

describe("computeOPI — risk floor trigger conditions", () => {
  it("does not trigger when competency meets the floor", () => {
    const [r] = computeOPI(
      [input({ competency_score: 3, risk_floor: true, risk_floor_level: 3 })],
      GAP_ONLY,
      1,
    );
    expect(r!.risk_floor_triggered).toBe(false);
    expect(r!.risk_score).toBe(0);
  });

  it("does not trigger when risk_floor is false", () => {
    const [r] = computeOPI(
      [input({ competency_score: 1, risk_floor: false, risk_floor_level: 3 })],
      GAP_ONLY,
      1,
    );
    expect(r!.risk_floor_triggered).toBe(false);
  });

  it("does not trigger when risk_floor_level is null", () => {
    const [r] = computeOPI(
      [input({ competency_score: 1, risk_floor: true, risk_floor_level: null })],
      GAP_ONLY,
      1,
    );
    expect(r!.risk_floor_triggered).toBe(false);
  });
});

describe("computeOPI — ranking", () => {
  it("ranks globally: phase ascending, OPI descending within phase", () => {
    const results = computeOPI(
      [
        input({ practice_id: 10, importance_score: 1.5, competency_score: 0 }), // 1.5 → phase 3
        input({ practice_id: 20, importance_score: 4, competency_score: 0 }),   // 4.0 → phase 1
        input({ practice_id: 30, importance_score: 2.5, competency_score: 0 }), // 2.5 → phase 2
        input({ practice_id: 40, importance_score: 5, competency_score: 0 }),   // 5.0 → phase 1
        input({ practice_id: 50, importance_score: 3, competency_score: 0 }),   // 3.0 → phase 2
      ],
      GAP_ONLY,
      1,
    );
    expect(results.map((r) => r.practice_id)).toEqual([40, 20, 50, 30, 10]);
    expect(results.map((r) => r.priority_rank)).toEqual([1, 2, 3, 4, 5]);
  });

  it("returns an empty array for empty input", () => {
    expect(computeOPI([], GAP_ONLY, 1)).toEqual([]);
  });
});

describe("lifecycle weight profiles — invariants the OPI formula assumes", () => {
  it("W1–W5 sum to 1.000 for every stage", () => {
    for (const w of Object.values(DEFAULT_LIFECYCLE_WEIGHTS)) {
      expect(w.w1_gap + w.w2_pnl + w.w3_speed + w.w4_dependency + w.w5_risk).toBeCloseTo(1, 10);
    }
  });

  it("modifiers match the ratified stage multipliers", () => {
    expect(LIFECYCLE_MODIFIERS).toEqual({ startup: 1.2, growth: 1.1, scale: 1.0, mature: 0.9 });
  });
});
