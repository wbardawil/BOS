// ============================================================
// AI-CDIO — Maturity Scoring & Prioritization Engine
// Implements the playbook's assessment and prioritization logic
// ============================================================

import type {
  MaturityLevel,
  ModuleScore,
  AssessmentSynthesis,
  PriorityClass,
  DivergencePoint,
  OrgSize,
  Industry,
  Initiative,
} from "../types/cdio.js";
import { MODULE_NAMES, SIZE_PRIORITY_SEQUENCES } from "../types/cdio.js";

// --- Size-band target maturity ceiling (Phase 1C Day 13) ---
//
// The "lean SMB defense": the rule that level-3-or-4 is the right ceiling
// for most modules at SMB scale. Pushing a 30-person SaaS toward Level 5
// governance is bank-grade theater. The narrative agent reads this ceiling
// to (a) treat the practitioner as already at ceiling when their score
// hits the band's target — no path-to-next-level, no recommendation
// pressure — and (b) to constrain "path to next level" recommendations
// to lean forms first (manual, spreadsheet, shared doc) rather than
// tool-buy escalation.
//
// Defaults are deliberately conservative — Year 1 audience is the
// founder's CEO clients (10-250 employees). The practitioner can
// override at the org level when an enterprise-grade engagement
// genuinely needs a higher ceiling (e.g. a mid-market company with
// regulatory exposure).
//
// Modules 5 (Security, Risk & Compliance) and 16 (Workforce, Skills &
// Change) get a +1 ceiling at small / medium because security is
// non-negotiable and workforce is irreducible — even small orgs need
// to be capable here.

const DEFAULT_CEILING: Record<OrgSize, MaturityLevel> = {
  small: 3,
  medium: 4,
  large: 5,
};

const MODULE_OVERRIDE: Partial<
  Record<number, Partial<Record<OrgSize, MaturityLevel>>>
> = {
  5: { small: 4, medium: 5 },
  16: { small: 4, medium: 5 },
};

export function getTargetLevelCeiling(
  moduleNumber: number,
  orgSize: OrgSize
): MaturityLevel {
  const override = MODULE_OVERRIDE[moduleNumber]?.[orgSize];
  if (override !== undefined) return override;
  return DEFAULT_CEILING[orgSize];
}

// --- Consensus Score (weighted average across stakeholders) ---
//
// Phase 1C semantics (2026-05-06): rows where maturity_score is null
// represent N/A respondents — they hit the module-gate or answered N/A
// on every question. Those rows are skipped from the consensus math
// rather than treated as a low score. A module where every respondent
// abstained returns 0 + an empty score-count, which the caller can use
// to surface a thin-coverage warning.

interface StakeholderWeight {
  stakeholder_id: string;
  influence_level: "decision_maker" | "influencer" | "contributor";
}

const INFLUENCE_WEIGHTS: Record<string, number> = {
  decision_maker: 3,
  influencer: 2,
  contributor: 1,
};

export function calculateConsensusScore(
  scores: Pick<ModuleScore, "stakeholder_id" | "maturity_score">[],
  stakeholderWeights: StakeholderWeight[]
): number {
  // Filter to scored rows only — N/A (null) abstentions don't pull the
  // average down. The synthesis caller separately tracks the abstain
  // count for the thin-coverage warning.
  type ScoredRow = { stakeholder_id: string; maturity_score: MaturityLevel };
  const scored: ScoredRow[] = scores
    .filter((s) => s.maturity_score != null)
    .map((s) => ({ stakeholder_id: s.stakeholder_id, maturity_score: s.maturity_score as MaturityLevel }));
  if (scored.length === 0) return 0;

  const weightMap = new Map(
    stakeholderWeights.map((sw) => [
      sw.stakeholder_id,
      INFLUENCE_WEIGHTS[sw.influence_level] ?? 1,
    ])
  );

  let weightedSum = 0;
  let totalWeight = 0;

  for (const score of scored) {
    const weight = weightMap.get(score.stakeholder_id) ?? 1;
    weightedSum += score.maturity_score * weight;
    totalWeight += weight;
  }

  // v8 ignore: the `: 0` arm is unreachable — every weight is ≥ 1 and scored is non-empty here
  /* v8 ignore next */
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;
}

// --- Divergence Score (standard deviation — high = disagreement) ---

export function calculateDivergenceScore(
  scores: Pick<ModuleScore, "maturity_score">[]
): number {
  // Skip N/A rows — they're not opinions, just absences.
  const values: number[] = [];
  for (const s of scores) {
    if (s.maturity_score != null) values.push(s.maturity_score);
  }
  if (values.length <= 1) return 0;

  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

  return Math.round(Math.sqrt(variance) * 100) / 100;
}

// --- Detect Divergence Points (where stakeholders disagree by 2+ levels) ---

export function detectDivergencePoints(
  moduleNumber: number,
  scores: (Pick<ModuleScore, "stakeholder_id" | "maturity_score" | "evidence"> & {
    stakeholder_name: string;
  })[]
): Omit<DivergencePoint, "framework_recommendation" | "projected_roi">[] {
  // Only opinions can diverge. N/A respondents are dropped from the
  // pairwise comparison before any gap is computed.
  const opinions = scores.filter(
    (s) => s.maturity_score != null
  ) as (typeof scores[number] & { maturity_score: MaturityLevel })[];

  const divergences: Omit<DivergencePoint, "framework_recommendation" | "projected_roi">[] = [];

  for (let i = 0; i < opinions.length; i++) {
    for (let j = i + 1; j < opinions.length; j++) {
      // non-null: i/j bounded by opinions.length (noUncheckedIndexedAccess)
      const a = opinions[i]!;
      const b = opinions[j]!;
      const gap = Math.abs(a.maturity_score - b.maturity_score);
      if (gap >= 2) {
        divergences.push({
          module_number: moduleNumber,
          module_name: MODULE_NAMES[moduleNumber] ?? `Module ${moduleNumber}`,
          stakeholder_a: {
            id: a.stakeholder_id,
            name: a.stakeholder_name,
            score: a.maturity_score as MaturityLevel,
            evidence: a.evidence,
          },
          stakeholder_b: {
            id: b.stakeholder_id,
            name: b.stakeholder_name,
            score: b.maturity_score as MaturityLevel,
            evidence: b.evidence,
          },
          score_gap: gap,
        });
      }
    }
  }

  return divergences;
}

// --- Value vs Effort Prioritization (from Roadmap Generator) ---

export interface ValueEffortInput {
  business_impact: number;       // 1-4
  strategic_alignment: number;   // 1-3
  stakeholder_priority: number;  // 1-3
  time_duration: number;         // 1-3
  resource_requirements: number; // 1-3
  technical_complexity: number;  // 1-2
  org_change_required: number;   // 1-2
}

export function calculateValueEffortScore(input: ValueEffortInput): {
  value_score: number;
  effort_score: number;
  priority_class: PriorityClass;
} {
  const value_score =
    input.business_impact + input.strategic_alignment + input.stakeholder_priority;
  const effort_score =
    input.time_duration +
    input.resource_requirements +
    input.technical_complexity +
    input.org_change_required;

  let priority_class: PriorityClass;

  if (value_score >= 7 && effort_score <= 4) {
    priority_class = "top_priority";
  } else if (value_score >= 7 && effort_score >= 7) {
    priority_class = "strategic_bet";
  } else if (value_score >= 4 && value_score <= 6 && effort_score <= 4) {
    priority_class = "quick_win";
  } else if (value_score <= 3) {
    priority_class = "defer";
  } else {
    priority_class = "maintain";
  }

  return { value_score, effort_score, priority_class };
}

// --- Quick Win Selector (7 criteria from Roadmap Generator) ---

export interface QuickWinCriteria {
  deliverable_in_90_days: boolean;
  minimal_budget: boolean;
  visible_business_impact: boolean;
  builds_credibility: boolean;
  addresses_known_pain: boolean;
  low_org_risk: boolean;
  provides_learning: boolean;
}

export function evaluateQuickWin(criteria: QuickWinCriteria): {
  qualifies: boolean;
  score: number;
  max_score: number;
} {
  const values = Object.values(criteria);
  const score = values.filter(Boolean).length;
  return {
    qualifies: score >= 5,
    score,
    max_score: 7,
  };
}

// --- Module Prioritization (combines maturity + business impact) ---

export function prioritizeModules(
  syntheses: Pick<AssessmentSynthesis, "module_number" | "consensus_score" | "business_impact">[]
): Pick<AssessmentSynthesis, "module_number" | "priority_rank" | "priority_class">[] {
  // Priority = high business impact + low maturity (biggest gap = biggest opportunity)
  const scored = syntheses.map((s) => ({
    module_number: s.module_number,
    // Invert maturity: lower maturity = higher priority
    priority_score: s.business_impact * (5 - s.consensus_score),
    consensus_score: s.consensus_score,
    business_impact: s.business_impact,
  }));

  // Sort by priority score descending
  scored.sort((a, b) => b.priority_score - a.priority_score);

  return scored.map((s, index) => {
    let priority_class: PriorityClass;

    if (s.business_impact >= 7 && s.consensus_score <= 2) {
      priority_class = "top_priority";
    } else if (s.business_impact >= 7 && s.consensus_score > 2) {
      priority_class = "maintain";
    } else if (s.business_impact < 4) {
      priority_class = "defer";
    } else if (s.consensus_score >= 3) {
      priority_class = "quick_win";
    } else {
      priority_class = "strategic_bet";
    }

    return {
      module_number: s.module_number,
      priority_rank: index + 1,
      priority_class,
    };
  });
}

// --- Module Stack Recommender (from Adaptation Guide) ---

export function recommendModuleStack(
  orgSize: OrgSize,
  industry: Industry,
  monthlyHours: number,
  primaryNeed?: string
): {
  recommended_stack: string;
  modules: number[];
  rationale: string;
} {
  // Step 1: Get base priority sequence by org size
  const basePriority = SIZE_PRIORITY_SEQUENCES[orgSize];

  // Step 2: Constrain by available hours
  let maxModules: number;
  if (monthlyHours <= 5) maxModules = 2;
  else if (monthlyHours <= 10) maxModules = 3;
  else if (monthlyHours <= 20) maxModules = 5;
  else maxModules = 8;

  const recommendedModules = basePriority.slice(0, maxModules);

  // Step 3: Industry adjustments
  const industryOverrides: Partial<Record<Industry, number[]>> = {
    healthcare: [5, 3, 8, 15, 9],       // HIPAA → EHR Architecture → Analytics → Automation → Patient CX
    financial_services: [5, 12, 8, 3, 15], // Security/Compliance → Financial → Analytics → Architecture → Automation
    manufacturing: [15, 4, 8, 5, 6],     // Automation → Cloud/IoT → Analytics → Security → Data/AI
    retail_ecommerce: [9, 7, 8, 4, 15],  // Customer CX → Platforms → Analytics → Cloud → Automation
  };

  const industryPriority = industryOverrides[industry];
  let finalModules = recommendedModules;
  let stackName = `${orgSize}_default`;
  let rationale = `Based on organization size (${orgSize}) with ${monthlyHours} hours/month.`;

  if (industryPriority) {
    // Merge: keep size-based priorities but boost industry-critical modules
    const merged = [...new Set([...industryPriority.slice(0, 2), ...recommendedModules])];
    finalModules = merged.slice(0, maxModules);
    stackName = `${industry}_${orgSize}`;
    rationale += ` Industry-specific priorities for ${industry} applied.`;
  }

  return {
    recommended_stack: stackName,
    modules: finalModules,
    rationale,
  };
}

// --- Engagement Model Selector (decision tree from Adaptation Guide) ---

export function recommendEngagementModel(
  employeeCount: number,
  hasExistingCIO: boolean,
  activeMajorTransformation: boolean
): {
  model: "advisory" | "strategic" | "hybrid" | "executive";
  hours: number;
  rationale: string;
} {
  if (employeeCount > 250 || activeMajorTransformation) {
    if (!hasExistingCIO) {
      return {
        model: "executive",
        hours: 40,
        rationale:
          "Large organization without technology leadership needs executive-level engagement to drive transformation.",
      };
    }
    return {
      model: "hybrid",
      hours: 20,
      rationale:
        "Large organization with existing CIO benefits from strategic + tactical support.",
    };
  }

  if (employeeCount > 50) {
    return {
      model: "strategic",
      hours: 10,
      rationale:
        "Mid-size organization needs strategic guidance with light execution support.",
    };
  }

  if (hasExistingCIO) {
    return {
      model: "advisory",
      hours: 5,
      rationale:
        "Small organization with existing technology leadership needs advisory direction only.",
    };
  }

  return {
    model: "strategic",
    hours: 10,
    rationale:
      "Small organization without technology leadership needs strategic guidance to establish foundations.",
  };
}
