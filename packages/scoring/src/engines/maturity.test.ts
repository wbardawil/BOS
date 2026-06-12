import { describe, expect, it } from "vitest";
import {
  getTargetLevelCeiling,
  calculateConsensusScore,
  calculateDivergenceScore,
  detectDivergencePoints,
  calculateValueEffortScore,
  evaluateQuickWin,
  prioritizeModules,
  recommendModuleStack,
  recommendEngagementModel,
  type ValueEffortInput,
  type QuickWinCriteria,
} from "./maturity.js";
import type { MaturityLevel } from "../types/cdio.js";

// All stakeholder names fictional — invented test fixtures only.

describe("getTargetLevelCeiling — size-band ceilings", () => {
  it.each([
    [1, "small", 3],
    [1, "medium", 4],
    [1, "large", 5],
    [9, "small", 3], // any non-override module follows the default
  ] as const)("module %i / %s → %i (defaults)", (mod, size, ceiling) => {
    expect(getTargetLevelCeiling(mod, size)).toBe(ceiling);
  });

  it.each([
    [5, "small", 4],
    [5, "medium", 5],
    [5, "large", 5], // no large override → default
    [16, "small", 4],
    [16, "medium", 5],
  ] as const)("module %i / %s → %i (+1 overrides for Security and Workforce)", (mod, size, ceiling) => {
    expect(getTargetLevelCeiling(mod, size)).toBe(ceiling);
  });
});

describe("calculateConsensusScore — influence weighting", () => {
  const weights = [
    { stakeholder_id: "sa", influence_level: "decision_maker" as const }, // ×3
    { stakeholder_id: "sb", influence_level: "influencer" as const },    // ×2
    { stakeholder_id: "sc", influence_level: "contributor" as const },   // ×1
  ];

  it("weights decision makers 3× contributors: (4×3 + 2×1)/4 = 3.5", () => {
    expect(calculateConsensusScore(
      [{ stakeholder_id: "sa", maturity_score: 4 }, { stakeholder_id: "sc", maturity_score: 2 }],
      weights,
    )).toBe(3.5);
  });

  it("rounds to 2 decimals: (4×2 + 3×1)/3 = 3.67", () => {
    expect(calculateConsensusScore(
      [{ stakeholder_id: "sb", maturity_score: 4 }, { stakeholder_id: "sc", maturity_score: 3 }],
      weights,
    )).toBe(3.67);
  });

  it("skips N/A (null) rows instead of dragging the average down", () => {
    expect(calculateConsensusScore(
      [
        { stakeholder_id: "sa", maturity_score: 4 },
        { stakeholder_id: "sb", maturity_score: null },
        { stakeholder_id: "sc", maturity_score: 2 },
      ],
      weights,
    )).toBe(3.5);
  });

  it("returns 0 when every respondent abstained", () => {
    expect(calculateConsensusScore(
      [{ stakeholder_id: "sa", maturity_score: null }],
      weights,
    )).toBe(0);
  });

  it("defaults an unrecognized influence level to weight 1 (corrupt-data guard)", () => {
    const corrupt = [
      { stakeholder_id: "sx", influence_level: "observer" },
    ] as unknown as Parameters<typeof calculateConsensusScore>[1];
    expect(calculateConsensusScore([{ stakeholder_id: "sx", maturity_score: 4 }], corrupt)).toBe(4);
  });

  it("defaults unknown stakeholders to weight 1: (4×3 + 5×1)/4 = 4.25", () => {
    expect(calculateConsensusScore(
      [{ stakeholder_id: "sa", maturity_score: 4 }, { stakeholder_id: "unlisted", maturity_score: 5 }],
      weights,
    )).toBe(4.25);
  });
});

describe("calculateDivergenceScore — population standard deviation", () => {
  it("[3,5] → 1", () => {
    expect(calculateDivergenceScore([{ maturity_score: 3 }, { maturity_score: 5 }])).toBe(1);
  });

  it("[1,5] → 2", () => {
    expect(calculateDivergenceScore([{ maturity_score: 1 }, { maturity_score: 5 }])).toBe(2);
  });

  it("[1,2,4] → 1.25 (2-decimal rounding)", () => {
    expect(calculateDivergenceScore([{ maturity_score: 1 }, { maturity_score: 2 }, { maturity_score: 4 }])).toBe(1.25);
  });

  it("unanimous scores → 0", () => {
    expect(calculateDivergenceScore([{ maturity_score: 2 }, { maturity_score: 2 }, { maturity_score: 2 }])).toBe(0);
  });

  it("single opinion or none → 0", () => {
    expect(calculateDivergenceScore([{ maturity_score: 4 }])).toBe(0);
    expect(calculateDivergenceScore([])).toBe(0);
  });

  it("N/A rows are absences, not opinions: [3, null, 5] → 1", () => {
    expect(calculateDivergenceScore([{ maturity_score: 3 }, { maturity_score: null }, { maturity_score: 5 }])).toBe(1);
  });
});

describe("detectDivergencePoints — the politics detector", () => {
  function opinion(id: string, name: string, score: MaturityLevel | null) {
    return { stakeholder_id: id, stakeholder_name: name, maturity_score: score, evidence: `evidence from ${name}` };
  }

  it("flags pairs that disagree by 2+ levels, resolving the module name", () => {
    const points = detectDivergencePoints(5, [opinion("sa", "Fictional CEO", 1), opinion("sb", "Fictional CTO", 4)]);
    expect(points).toEqual([
      {
        module_number: 5,
        module_name: "Security, Risk & Compliance",
        stakeholder_a: { id: "sa", name: "Fictional CEO", score: 1, evidence: "evidence from Fictional CEO" },
        stakeholder_b: { id: "sb", name: "Fictional CTO", score: 4, evidence: "evidence from Fictional CTO" },
        score_gap: 3,
      },
    ]);
  });

  it("compares all pairs: scores 1/4/3 → two divergences (gaps 3 and 2)", () => {
    const points = detectDivergencePoints(2, [
      opinion("sa", "Fictional CEO", 1),
      opinion("sb", "Fictional CTO", 4),
      opinion("sc", "Fictional COO", 3),
    ]);
    expect(points.map((p) => p.score_gap)).toEqual([3, 2]);
  });

  it("gap of 1 is agreement, not politics", () => {
    expect(detectDivergencePoints(2, [opinion("sa", "A", 3), opinion("sb", "B", 4)])).toEqual([]);
  });

  it("drops N/A respondents before any pairwise comparison", () => {
    expect(detectDivergencePoints(2, [opinion("sa", "A", 1), opinion("sb", "B", null)])).toEqual([]);
  });

  it("falls back to 'Module N' for unknown module numbers", () => {
    const points = detectDivergencePoints(99, [opinion("sa", "A", 1), opinion("sb", "B", 5)]);
    expect(points[0]!.module_name).toBe("Module 99");
  });
});

describe("calculateValueEffortScore — priority classes", () => {
  function input(overrides: Partial<ValueEffortInput>): ValueEffortInput {
    return {
      business_impact: 1, strategic_alignment: 1, stakeholder_priority: 1,
      time_duration: 1, resource_requirements: 1, technical_complexity: 1, org_change_required: 1,
      ...overrides,
    };
  }

  it("high value, low effort → top_priority (v7 e4)", () => {
    const r = calculateValueEffortScore(input({ business_impact: 4, strategic_alignment: 2, stakeholder_priority: 1 }));
    expect(r).toEqual({ value_score: 7, effort_score: 4, priority_class: "top_priority" });
  });

  it("high value, high effort → strategic_bet (v7 e7)", () => {
    const r = calculateValueEffortScore(input({
      business_impact: 4, strategic_alignment: 2, stakeholder_priority: 1,
      time_duration: 3, resource_requirements: 2, technical_complexity: 1, org_change_required: 1,
    }));
    expect(r.priority_class).toBe("strategic_bet");
  });

  it("mid value, low effort → quick_win (v4 e4)", () => {
    const r = calculateValueEffortScore(input({ business_impact: 2 }));
    expect(r).toEqual({ value_score: 4, effort_score: 4, priority_class: "quick_win" });
  });

  it("low value → defer regardless of effort (v3)", () => {
    expect(calculateValueEffortScore(input({})).priority_class).toBe("defer");
  });

  it("high value, middling effort (5–6) falls through to maintain", () => {
    const r = calculateValueEffortScore(input({
      business_impact: 4, strategic_alignment: 2, stakeholder_priority: 1,
      time_duration: 2, resource_requirements: 1, technical_complexity: 1, org_change_required: 1,
    }));
    expect(r).toEqual({ value_score: 7, effort_score: 5, priority_class: "maintain" });
  });
});

describe("evaluateQuickWin — 5-of-7 threshold", () => {
  function criteria(trueCount: number): QuickWinCriteria {
    const keys: (keyof QuickWinCriteria)[] = [
      "deliverable_in_90_days", "minimal_budget", "visible_business_impact",
      "builds_credibility", "addresses_known_pain", "low_org_risk", "provides_learning",
    ];
    return Object.fromEntries(keys.map((k, i) => [k, i < trueCount])) as unknown as QuickWinCriteria;
  }

  it("5 criteria met → qualifies", () => {
    expect(evaluateQuickWin(criteria(5))).toEqual({ qualifies: true, score: 5, max_score: 7 });
  });

  it("4 criteria met → does not qualify", () => {
    expect(evaluateQuickWin(criteria(4))).toEqual({ qualifies: false, score: 4, max_score: 7 });
  });

  it("all 7 → perfect score", () => {
    expect(evaluateQuickWin(criteria(7))).toEqual({ qualifies: true, score: 7, max_score: 7 });
  });
});

describe("prioritizeModules — impact × inverted maturity", () => {
  it("ranks by business_impact × (5 − consensus) and classifies (golden)", () => {
    const result = prioritizeModules([
      { module_number: 1, consensus_score: 1, business_impact: 8 }, // 32 → top_priority
      { module_number: 2, consensus_score: 3, business_impact: 8 }, // 16 → maintain (high impact, decent maturity)
      { module_number: 3, consensus_score: 1, business_impact: 3 }, // 12 → defer (low impact)
      { module_number: 4, consensus_score: 4, business_impact: 5 }, // 5  → quick_win (maturity ≥ 3)
      { module_number: 5, consensus_score: 2, business_impact: 5 }, // 15 → strategic_bet
    ]);
    expect(result).toEqual([
      { module_number: 1, priority_rank: 1, priority_class: "top_priority" },
      { module_number: 2, priority_rank: 2, priority_class: "maintain" },
      { module_number: 5, priority_rank: 3, priority_class: "strategic_bet" },
      { module_number: 3, priority_rank: 4, priority_class: "defer" },
      { module_number: 4, priority_rank: 5, priority_class: "quick_win" },
    ]);
  });
});

describe("recommendModuleStack — size, hours, industry", () => {
  it("small org, 5 hrs/month → top 2 of the small sequence", () => {
    expect(recommendModuleStack("small", "technology", 5)).toEqual({
      recommended_stack: "small_default",
      modules: [5, 15],
      rationale: "Based on organization size (small) with 5 hours/month.",
    });
  });

  it.each([
    [5, 2], [6, 3], [10, 3], [11, 5], [20, 5], [21, 8],
  ])("%i hrs/month allows %i modules", (hours, max) => {
    expect(recommendModuleStack("large", "other", hours).modules.length).toBe(Math.min(max, 6));
  });

  it("healthcare boosts compliance modules ahead of the size sequence", () => {
    const r = recommendModuleStack("medium", "healthcare", 10);
    // merge: healthcare top-2 [5,3] + medium base [2,11,8] → first 3
    expect(r).toEqual({
      recommended_stack: "healthcare_medium",
      modules: [5, 3, 2],
      rationale: "Based on organization size (medium) with 10 hours/month. Industry-specific priorities for healthcare applied.",
    });
  });

  it("industries without overrides keep the size default", () => {
    const r = recommendModuleStack("medium", "education", 25);
    expect(r.recommended_stack).toBe("medium_default");
    expect(r.modules).toEqual([2, 11, 8, 15, 14, 5]);
  });
});

describe("recommendEngagementModel — decision tree", () => {
  it("large org without CIO → executive 40h", () => {
    expect(recommendEngagementModel(300, false, false).model).toBe("executive");
    expect(recommendEngagementModel(300, false, false).hours).toBe(40);
  });

  it("large org with CIO → hybrid 20h", () => {
    expect(recommendEngagementModel(300, true, false).model).toBe("hybrid");
  });

  it("active transformation escalates a mid-size org", () => {
    expect(recommendEngagementModel(100, false, true).model).toBe("executive");
    expect(recommendEngagementModel(100, true, true).model).toBe("hybrid");
  });

  it("mid-size org (>50) → strategic 10h", () => {
    const r = recommendEngagementModel(100, false, false);
    expect(r.model).toBe("strategic");
    expect(r.hours).toBe(10);
  });

  it("small org with CIO → advisory 5h", () => {
    const r = recommendEngagementModel(30, true, false);
    expect(r.model).toBe("advisory");
    expect(r.hours).toBe(5);
  });

  it("small org without CIO → strategic 10h", () => {
    expect(recommendEngagementModel(30, false, false).model).toBe("strategic");
  });
});
