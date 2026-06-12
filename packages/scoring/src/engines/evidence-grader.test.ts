import { describe, expect, it } from "vitest";
import { gradeEvidence, toAIGradePayload, type EvidenceGradingInput } from "./evidence-grader.js";
import type { Evidence, MaturityLevel, Practice } from "../types/database.js";

// All names and content fictional — invented test fixtures only.

const PRACTICE: Practice = {
  id: 42,
  area_id: 1,
  name: "Fictional Practice",
  description: null,
  version: "1.0",
  sort_order: 1,
  created_at: "2026-01-01T00:00:00Z",
};

function level(n: number, criteria: string): MaturityLevel {
  return {
    id: n,
    practice_id: 42,
    level: n,
    descriptor: `Level ${n} descriptor`,
    evidence_criteria: criteria,
    expiry_period_days: null,
  };
}

const LEVELS: MaturityLevel[] = [
  level(1, "Anything at all"),
  level(2, "Some basics in place"),
  level(3, "Documented runbook exists; Quarterly review cadence operating; Ownership assigned clearly"),
  level(4, "Advanced things"),
  level(5, "World class things"),
];

function evidence(description: string): Evidence {
  return {
    id: "ev-fictional-1",
    initiative_id: "init-fictional-1",
    artifact_id: null,
    description,
    quality_score: null,
    ai_grading_rationale: null,
    ai_confidence: null,
    level_proposal: null,
    graded_at: null,
    created_at: "2026-06-01T00:00:00Z",
  };
}

function gradingInput(description: string, current_level = 2): EvidenceGradingInput {
  return { evidence: evidence(description), practice: PRACTICE, maturity_levels: LEVELS, current_level };
}

// Pads to an exact length so depth/quality goldens are deterministic.
// 'z' is never a rubric keyword, and the padding sits after the final period.
function pad(text: string, length: number): string {
  return text + "z".repeat(length - text.length);
}

describe("gradeEvidence — approve path (golden)", () => {
  const desc = pad(
    "The documented runbook exists in the wiki. A quarterly review cadence is operating with leadership. Ownership is assigned clearly to the fictional platform team.",
    250, // depth = round(250/500×100) = 50
  );
  const result = gradeEvidence(gradingInput(desc));

  it("meets all 3 criteria → completeness 100", () => {
    expect(result.completeness_score).toBe(100);
    expect(result.rubric_mapping.criteria_alignment).toHaveLength(3);
    expect(result.rubric_mapping.criteria_alignment.every((a) => a.met)).toBe(true);
  });

  it("quality = round(100×0.7 + 50×0.3) = 85", () => {
    expect(result.quality_score).toBe(85);
  });

  it("confidence = round(min(1, 1×0.6 + 0.85×0.4)×1000)/1000 = 0.94", () => {
    expect(result.confidence).toBe(0.94);
  });

  it("proposes the target level (current 2 → 3) and matches its descriptor", () => {
    expect(result.level_proposal).toBe(3);
    expect(result.rubric_mapping.matched_level).toBe(3);
    expect(result.rubric_mapping.matched_descriptor).toBe("Level 3 descriptor");
  });

  it("recommends approval with the criteria tally", () => {
    expect(result.recommendation).toEqual({
      action: "approve",
      reason: "Evidence meets 3/3 criteria with sufficient quality",
    });
  });

  it("raises no risk flags", () => {
    expect(result.risk_flags).toEqual([]);
  });

  it("builds the exact rationale sentence", () => {
    expect(result.rationale).toBe(
      'Evidence for "Fictional Practice" targeting Level 3: sufficient. 3 of 3 criteria addressed (100% completeness, 85% quality).',
    );
  });

  it("extracts a relevant excerpt per met criterion", () => {
    expect(result.rubric_mapping.criteria_alignment[0]!.evidence_excerpt).toBe(
      "The documented runbook exists in the wiki",
    );
  });
});

describe("gradeEvidence — partial path (golden)", () => {
  // Covers criteria 1 and 2 only — nothing about ownership.
  const desc = pad(
    "The documented runbook exists in the wiki. A quarterly review cadence is operating with leadership.",
    200, // depth = 40
  );
  const result = gradeEvidence(gradingInput(desc));

  it("meets 2 of 3 criteria → completeness 67", () => {
    expect(result.completeness_score).toBe(67);
  });

  it("quality = round(67×0.7 + 40×0.3) = 59", () => {
    expect(result.quality_score).toBe(59);
  });

  it("confidence = round((0.67×0.6 + 0.59×0.4)×1000)/1000 = 0.638", () => {
    expect(result.confidence).toBe(0.638);
  });

  it("holds the level at current (no upgrade below 80% completeness)", () => {
    expect(result.level_proposal).toBe(2);
  });

  it("requests more evidence naming the unmet criterion", () => {
    expect(result.recommendation).toEqual({
      action: "request_more_evidence",
      missing: ["Ownership assigned clearly"],
    });
  });

  it("unmet criterion has no excerpt", () => {
    const unmet = result.rubric_mapping.criteria_alignment.find((a) => !a.met)!;
    expect(unmet.evidence_excerpt).toBeNull();
  });
});

describe("gradeEvidence — flag-for-review path (golden)", () => {
  const result = gradeEvidence(gradingInput("Nothing relevant here at all.")); // 29 chars

  it("meets 0 criteria → completeness 0, quality 2", () => {
    expect(result.completeness_score).toBe(0);
    // depth = round(29/500×100) = 6 → quality = round(0×0.7 + 6×0.3) = 2
    expect(result.quality_score).toBe(2);
  });

  it("raises incomplete-evidence (high) and brevity (medium) flags", () => {
    expect(result.risk_flags).toEqual([
      { severity: "high", category: "incomplete_evidence", message: "Only 0 of 3 criteria addressed" },
      { severity: "medium", category: "quality_concern", message: "Evidence description is very brief; may lack sufficient detail" },
    ]);
  });

  it("flags for review with the flag messages as concerns", () => {
    expect(result.recommendation).toEqual({
      action: "flag_for_review",
      concerns: [
        "Only 0 of 3 criteria addressed",
        "Evidence description is very brief; may lack sufficient detail",
      ],
    });
  });

  it("holds the level at current with low confidence", () => {
    expect(result.level_proposal).toBe(2);
    expect(result.confidence).toBe(0.008); // round((0 + 0.02×0.4)×1000)/1000
  });
});

describe("gradeEvidence — rubric edge cases", () => {
  it("caps the target level at 5 (current 5 grades against the level-5 rubric)", () => {
    const result = gradeEvidence(gradingInput(pad("World class things everywhere.", 150), 5));
    // criteria 'World class things' → keywords world/class/things all present → met
    expect(result.completeness_score).toBe(100);
    expect(result.level_proposal).toBe(5);
  });

  it("returns the failed result when no rubric exists for the target level", () => {
    const input = gradingInput("anything", 5);
    input.maturity_levels = LEVELS.slice(0, 4); // levels 1–4 only, target is 5
    const result = gradeEvidence(input);
    expect(result.completeness_score).toBe(0);
    expect(result.quality_score).toBe(0);
    expect(result.level_proposal).toBe(0);
    expect(result.confidence).toBe(0);
    expect(result.rationale).toBe("No rubric found for target level");
    expect(result.risk_flags).toEqual([
      { severity: "high", category: "scope_mismatch", message: "No rubric found for target level" },
    ]);
    expect(result.recommendation).toEqual({
      action: "flag_for_review",
      concerns: ["No rubric found for target level"],
    });
  });

  it("a criterion with only short words can never be met", () => {
    const input = gradingInput(pad("Do it on me as is.", 150));
    input.maturity_levels = [...LEVELS.slice(0, 2), level(3, "Do it; as is on we")];
    const result = gradeEvidence(input);
    // every word ≤3 chars → zero keywords → met=false for both parsed criteria
    expect(result.completeness_score).toBe(0);
  });

  it("an empty criteria string yields 0 completeness, not a crash", () => {
    const input = gradingInput(pad("Plenty of words about everything.", 150));
    input.maturity_levels = [...LEVELS.slice(0, 2), level(3, "")];
    const result = gradeEvidence(input);
    expect(result.completeness_score).toBe(0);
    expect(result.rubric_mapping.criteria_alignment).toEqual([]);
  });

  it("parses criteria across ';', '.' and newline separators", () => {
    const input = gradingInput(pad("irrelevant text body for parsing test", 150));
    input.maturity_levels = [...LEVELS.slice(0, 2), level(3, "First criterion here. Second criterion there\nThird criterion everywhere")];
    const result = gradeEvidence(input);
    expect(result.rubric_mapping.criteria_alignment).toHaveLength(3);
  });

  it("requires ≥40% keyword overlap per criterion", () => {
    // 5 keywords; description hits exactly 2 (0.4 → met) vs exactly 1 (0.2 → not met)
    const criteria = "alphaone betatwo gammathree deltafour epsilonfive";
    const input2 = gradingInput(pad("Mentions alphaone and betatwo only.", 150));
    input2.maturity_levels = [...LEVELS.slice(0, 2), level(3, criteria)];
    expect(gradeEvidence(input2).completeness_score).toBe(100);

    const input1 = gradingInput(pad("Mentions alphaone exclusively today.", 150));
    input1.maturity_levels = [...LEVELS.slice(0, 2), level(3, criteria)];
    expect(gradeEvidence(input1).completeness_score).toBe(0);
  });
});

describe("toAIGradePayload", () => {
  it("flattens risk flags to '[severity] message' strings and keeps scores", () => {
    const result = gradeEvidence(gradingInput("Nothing relevant here at all."));
    const payload = toAIGradePayload(result);
    expect(payload).toEqual({
      rubric_mapping: {
        matched_level: result.rubric_mapping.matched_level,
        matched_descriptor: result.rubric_mapping.matched_descriptor,
      },
      completeness_score: 0,
      quality_score: 2,
      risk_flags: [
        "[high] Only 0 of 3 criteria addressed",
        "[medium] Evidence description is very brief; may lack sufficient detail",
      ],
      level_proposal: 2,
      confidence: 0.008,
      rationale: result.rationale,
    });
  });
});
