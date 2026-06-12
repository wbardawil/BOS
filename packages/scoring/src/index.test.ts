import { describe, expect, it } from "vitest";
import * as scoring from "./index.js";
import { toOPIInput } from "./types/opi.js";
import type { PracticeMetadata, RoundResponse } from "./types/database.js";

describe("@bos/scoring public surface", () => {
  it("exports every engine entry point", () => {
    expect(scoring.PACKAGE_NAME).toBe("@bos/scoring");
    for (const fn of [
      scoring.computeOPI,
      scoring.selectFocusPortfolio,
      scoring.determineLifecycleStage,
      scoring.gradeEvidence,
      scoring.toAIGradePayload,
      scoring.calculateDelegationIndex,
      scoring.calculateOperatingDebt,
      scoring.getTargetLevelCeiling,
      scoring.calculateConsensusScore,
      scoring.calculateDivergenceScore,
      scoring.detectDivergencePoints,
      scoring.calculateValueEffortScore,
      scoring.evaluateQuickWin,
      scoring.prioritizeModules,
      scoring.recommendModuleStack,
      scoring.recommendEngagementModel,
    ]) {
      expect(typeof fn).toBe("function");
    }
    expect(scoring.WIP_LIMITS.startup.max_active_practices).toBe(5);
    expect(scoring.DEFAULT_LIFECYCLE_WEIGHTS.mature.w5_risk).toBe(0.3);
    expect(scoring.MODULE_NAMES[5]).toBe("Security, Risk & Compliance");
    expect(Object.keys(scoring.MODULE_META)).toHaveLength(16);
    expect(scoring.SIZE_PRIORITY_SEQUENCES.small).toEqual([5, 15, 4, 12, 2]);
  });
});

describe("toOPIInput — response/metadata merge helper", () => {
  it("joins a round response with practice metadata", () => {
    const response: RoundResponse = {
      id: "rr-1",
      round_id: "round-1",
      organization_id: "org-fictional-1",
      practice_id: 12,
      importance_score: 5,
      competency_score: 2,
      responded_by: null,
      created_at: "2026-06-01T00:00:00Z",
    };
    const metadata: PracticeMetadata = {
      id: 12,
      practice_id: 12,
      pnl_impact: 4,
      speed_to_impact: 3,
      dependency_score: 2,
      risk_floor: true,
      risk_floor_level: 3,
    };
    expect(toOPIInput(response, metadata)).toEqual({
      practice_id: 12,
      importance_score: 5,
      competency_score: 2,
      pnl_impact: 4,
      speed_to_impact: 3,
      dependency_score: 2,
      risk_floor: true,
      risk_floor_level: 3,
    });
  });
});
