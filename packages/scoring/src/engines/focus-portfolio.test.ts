import { describe, expect, it } from "vitest";
import { selectFocusPortfolio, type FocusPortfolioInput } from "./focus-portfolio.js";
import { WIP_LIMITS } from "../constants/wip-limits.js";
import type { OPIResult } from "../types/opi.js";
import type { LifecycleStage, PracticeDependency } from "../types/database.js";

function score(overrides: Partial<OPIResult>): OPIResult {
  return {
    practice_id: 1,
    gap: 0,
    weighted_gap: 0,
    pnl_score: 0,
    speed_score: 0,
    dependency_score: 0,
    risk_score: 0,
    lifecycle_mod: 1,
    final_opi: 3,
    phase_number: 1,
    phase_label: "Proof",
    priority_rank: 0,
    risk_floor_triggered: false,
    ...overrides,
  };
}

function dep(practice_id: number, depends_on: number): PracticeDependency {
  return { id: 0, practice_id, depends_on_practice_id: depends_on, dependency_type: "requires" };
}

function makeInput(overrides: Partial<FocusPortfolioInput>): FocusPortfolioInput {
  return {
    opi_scores: [],
    lifecycle_stage: "startup",
    practice_area_map: new Map(),
    dependencies: [],
    current_levels: new Map(),
    organization_id: "org-fictional-1",
    round_id: "round-1",
    quarter: "2026-Q2",
    ...overrides,
  };
}

describe("selectFocusPortfolio — WIP caps", () => {
  it("caps at the stage WIP limit (startup = 5) with a risk-floor seed", () => {
    // One risk-floor seed opens the portfolio; concentration then admits
    // distinct-area Phase 1 practices until the cap.
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }),
      ...[2, 3, 4, 5, 6, 7].map((id, i) =>
        score({ practice_id: id, final_opi: 4.8 - i * 0.2 }),
      ),
    ];
    // distinct areas, deliberately avoiding area 7 (Delivery & Operations triggers Rule 4)
    const areaMap = new Map(scores.map((s) => [s.practice_id, s.practice_id * 10]));
    const result = selectFocusPortfolio(
      makeInput({ opi_scores: scores, practice_area_map: areaMap }),
    );
    expect(result.max_active).toBe(5);
    expect(result.selected_practice_ids).toEqual([1, 2, 3, 4, 5]);
    expect(result.selection_rationale[0]!.reason).toBe("risk_floor_override");
    expect(result.selection_rationale.slice(1).every((r) => r.reason === "phase_1_priority")).toBe(true);
  });

  it.each([
    ["startup", 5],
    ["growth", 7],
    ["scale", 9],
    ["mature", 9],
  ] as [LifecycleStage, number][])("%s stage uses max_active %i", (stage, max) => {
    const result = selectFocusPortfolio(makeInput({ lifecycle_stage: stage }));
    expect(result.max_active).toBe(max);
    expect(result.max_active).toBe(WIP_LIMITS[stage].max_active_practices);
  });

  it("risk-floor practices override the WIP limit", () => {
    const scores = [1, 2, 3, 4, 5, 6].map((id) =>
      score({ practice_id: id, risk_floor_triggered: true, final_opi: 4 }),
    );
    const areaMap = new Map(scores.map((s) => [s.practice_id, s.practice_id]));
    const result = selectFocusPortfolio(
      makeInput({ opi_scores: scores, practice_area_map: areaMap }),
    );
    expect(result.selected_practice_ids).toHaveLength(6); // > startup cap of 5
    expect(result.selection_rationale.every((r) => r.reason === "risk_floor_override")).toBe(true);
  });
});

describe("selectFocusPortfolio — area concentration (≤60%)", () => {
  it("skips a practice whose area would exceed 60% of the portfolio", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }), // area 1
      score({ practice_id: 2, final_opi: 4.5 }), // area 2
      score({ practice_id: 3, final_opi: 4.0 }), // area 2 — (1+1)/3 = 0.67 > 0.6 → skipped
      score({ practice_id: 4, final_opi: 3.8 }), // area 3 — admitted
    ];
    const areaMap = new Map([[1, 1], [2, 2], [3, 2], [4, 3]]);
    const result = selectFocusPortfolio(
      makeInput({ opi_scores: scores, practice_area_map: areaMap }),
    );
    expect(result.selected_practice_ids).toEqual([1, 2, 4]);
  });

  it("with no risk-floor seed, the first candidate always trips the 60% check (documented engine behavior)", () => {
    // (0+1)/(0+1) = 1 > 0.6 on an empty portfolio — Phase 1/2 loops admit
    // nothing until something seeds the selection. Behavior-preserving: the
    // bds-OS engine and edge function share this quirk. See DRIFT.md.
    const scores = [score({ practice_id: 1, final_opi: 5 }), score({ practice_id: 2, final_opi: 4 })];
    const areaMap = new Map([[1, 1], [2, 2]]);
    const result = selectFocusPortfolio(
      makeInput({ opi_scores: scores, practice_area_map: areaMap }),
    );
    expect(result.selected_practice_ids).toEqual([]);
  });
});

describe("selectFocusPortfolio — dependency rules", () => {
  it("skips a Phase 1 practice whose dependency is unselected and below Level 3", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }),
      score({ practice_id: 2, final_opi: 4.5 }), // depends on 9 (level 1) → skipped
      score({ practice_id: 3, final_opi: 4.0 }),
    ];
    const areaMap = new Map([[1, 1], [2, 2], [3, 3]]);
    const result = selectFocusPortfolio(
      makeInput({
        opi_scores: scores,
        practice_area_map: areaMap,
        dependencies: [dep(2, 9)],
        current_levels: new Map([[9, 1]]),
      }),
    );
    expect(result.selected_practice_ids).toEqual([1, 3]);
  });

  it("admits the dependent practice when the dependency is at Level 3+", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }),
      score({ practice_id: 2, final_opi: 4.5 }),
    ];
    const areaMap = new Map([[1, 1], [2, 2]]);
    const result = selectFocusPortfolio(
      makeInput({
        opi_scores: scores,
        practice_area_map: areaMap,
        dependencies: [dep(2, 9)],
        current_levels: new Map([[9, 3]]),
      }),
    );
    expect(result.selected_practice_ids).toEqual([1, 2]);
  });

  it("admits the dependent practice when the dependency is itself selected", () => {
    const scores = [
      score({ practice_id: 9, risk_floor_triggered: true, final_opi: 5 }),
      score({ practice_id: 2, final_opi: 4.5 }),
    ];
    const areaMap = new Map([[9, 1], [2, 2]]);
    const result = selectFocusPortfolio(
      makeInput({
        opi_scores: scores,
        practice_area_map: areaMap,
        dependencies: [dep(2, 9)],
        current_levels: new Map([[9, 1]]),
      }),
    );
    expect(result.selected_practice_ids).toEqual([9, 2]);
  });

  it("pulls in a missing dependency of a selected practice (Rule 6)", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }),
      score({ practice_id: 9, phase_number: 3, phase_label: "Scale", final_opi: 1 }),
    ];
    const areaMap = new Map([[1, 1], [9, 2]]);
    const result = selectFocusPortfolio(
      makeInput({
        opi_scores: scores,
        practice_area_map: areaMap,
        dependencies: [dep(1, 9)],
        current_levels: new Map([[9, 1]]),
      }),
    );
    expect(result.selected_practice_ids).toContain(9);
    expect(result.selection_rationale.find((r) => r.practice_id === 9)!.reason).toBe("dependency_inclusion");
  });

  it("cannot pull in a dependency that has no OPI score", () => {
    const scores = [score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 })];
    const result = selectFocusPortfolio(
      makeInput({
        opi_scores: scores,
        practice_area_map: new Map([[1, 1]]),
        dependencies: [dep(1, 9)], // practice 9 was never scored
        current_levels: new Map([[9, 1]]),
      }),
    );
    expect(result.selected_practice_ids).toEqual([1]);
  });

  it("does not pull in a dependency already at Level 3+", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }),
      score({ practice_id: 9, phase_number: 3, phase_label: "Scale", final_opi: 1 }),
    ];
    const areaMap = new Map([[1, 1], [9, 2]]);
    const result = selectFocusPortfolio(
      makeInput({
        opi_scores: scores,
        practice_area_map: areaMap,
        dependencies: [dep(1, 9)],
        current_levels: new Map([[9, 4]]),
      }),
    );
    expect(result.selected_practice_ids).toEqual([1]);
  });
});

describe("selectFocusPortfolio — defensive defaults", () => {
  it("unmapped practices fall into pseudo-area 0, duplicates select once, unknown dependency levels read as 0", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }),
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }), // duplicate row
      score({ practice_id: 2, final_opi: 4 }), // depends on 9, absent from current_levels → level 0
    ];
    const result = selectFocusPortfolio(
      makeInput({
        opi_scores: scores,
        practice_area_map: new Map(), // nothing mapped → area 0 everywhere
        dependencies: [dep(2, 9)],
        current_levels: new Map(),
      }),
    );
    expect(result.selected_practice_ids).toEqual([1]);
  });
});

describe("selectFocusPortfolio — Phase 2 fill", () => {
  it("applies dependency and concentration gates to Phase 2 candidates too", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }), // area 1 seed
      score({ practice_id: 2, phase_number: 2, phase_label: "Structure", final_opi: 3.0 }),  // area 1 → concentration skip
      score({ practice_id: 3, phase_number: 2, phase_label: "Structure", final_opi: 2.8 }),  // dep unmet → skip
      score({ practice_id: 4, phase_number: 2, phase_label: "Structure", final_opi: 2.5 }),  // area 3 → admitted
    ];
    const areaMap = new Map([[1, 1], [2, 1], [3, 2], [4, 3]]);
    const result = selectFocusPortfolio(
      makeInput({
        opi_scores: scores,
        practice_area_map: areaMap,
        dependencies: [dep(3, 9)],
        current_levels: new Map([[9, 1]]),
      }),
    );
    expect(result.selected_practice_ids).toEqual([1, 4]);
    expect(result.selection_rationale.find((r) => r.practice_id === 4)!.reason).toBe("phase_2_fill");
  });

  it("stops filling from Phase 2 once the WIP limit is reached", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }),
      score({ practice_id: 2, final_opi: 4.8 }),
      score({ practice_id: 3, final_opi: 4.6 }),
      score({ practice_id: 4, final_opi: 4.4 }),
      score({ practice_id: 5, final_opi: 4.2 }),
      score({ practice_id: 6, phase_number: 2, phase_label: "Structure", final_opi: 3.0 }),
    ];
    const areaMap = new Map(scores.map((s) => [s.practice_id, s.practice_id * 10]));
    const result = selectFocusPortfolio(
      makeInput({ opi_scores: scores, practice_area_map: areaMap }),
    );
    expect(result.selected_practice_ids).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("selectFocusPortfolio — execution-heavy guarantee (Delivery & Operations, area 7)", () => {
  it("grows past the WIP limit when every selected practice is a risk-floor override", () => {
    // Nothing is replaceable, so the Delivery practice is appended instead.
    const scores = [
      ...[1, 2, 3, 4, 5].map((id) => score({ practice_id: id, risk_floor_triggered: true, final_opi: 5 })),
      score({ practice_id: 70, phase_number: 3, phase_label: "Scale", final_opi: 1.0 }),
    ];
    const areaMap = new Map<number, number>([[1, 10], [2, 20], [3, 30], [4, 40], [5, 50], [70, 7]]);
    const result = selectFocusPortfolio(
      makeInput({ opi_scores: scores, practice_area_map: areaMap }),
    );
    expect(result.selected_practice_ids).toEqual([1, 2, 3, 4, 5, 70]);
  });

  it("adds the best Delivery & Operations practice when none is selected", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }), // area 1
      score({ practice_id: 70, phase_number: 2, phase_label: "Structure", final_opi: 2.5 }), // area 7
    ];
    const areaMap = new Map([[1, 1], [70, 7]]);
    const result = selectFocusPortfolio(
      makeInput({ opi_scores: scores, practice_area_map: areaMap }),
    );
    // 70 enters via Phase-2 fill (distinct area, capacity available)
    expect(result.selected_practice_ids).toContain(70);
  });

  it("replaces the lowest non-risk-floor practice when at the WIP limit", () => {
    const scores = [
      score({ practice_id: 1, risk_floor_triggered: true, final_opi: 5 }),
      score({ practice_id: 2, final_opi: 4.8 }),
      score({ practice_id: 3, final_opi: 4.6 }),
      score({ practice_id: 4, final_opi: 4.4 }),
      score({ practice_id: 5, final_opi: 4.2 }),
      score({ practice_id: 70, phase_number: 3, phase_label: "Scale", final_opi: 1.0 }), // area 7, too weak to enter
    ];
    const areaMap = new Map([[1, 1], [2, 2], [3, 3], [4, 4], [5, 5], [70, 7]]);
    const result = selectFocusPortfolio(
      makeInput({ opi_scores: scores, practice_area_map: areaMap }),
    );
    // Portfolio was full at [1,2,3,4,5]; 5 (lowest non-risk-floor) is evicted for 70.
    expect(result.selected_practice_ids).toEqual([1, 2, 3, 4, 70]);
    expect(result.selection_rationale.find((r) => r.practice_id === 70)!.reason).toBe("dependency_inclusion");
    expect(result.selected_practice_ids).toHaveLength(5);
  });

  it("echoes org/round/quarter/stage in the result envelope", () => {
    const result = selectFocusPortfolio(makeInput({ lifecycle_stage: "growth" }));
    expect(result.organization_id).toBe("org-fictional-1");
    expect(result.round_id).toBe("round-1");
    expect(result.quarter).toBe("2026-Q2");
    expect(result.lifecycle_stage).toBe("growth");
  });
});
