// @bos/scoring — CDIO maturity engine + the six bds-OS engines (Prompt 3).
// LAW (CLAUDE.md #6): pure functions only — no IO, no Supabase imports.
// METHODOLOGY IP: behavior changes require founder approval. Where the bds-OS
// edge functions drifted from these engines, THIS package is canonical — see DRIFT.md.

export const PACKAGE_NAME = "@bos/scoring" as const;

// ─── Engines ─────────────────────────────────────────────────────────────────
export { computeOPI } from "./engines/opi.js";
export { selectFocusPortfolio, type FocusPortfolioInput } from "./engines/focus-portfolio.js";
export { determineLifecycleStage, type LifecycleInput } from "./engines/lifecycle.js";
export {
  gradeEvidence,
  toAIGradePayload,
  type EvidenceGradingInput,
  type EvidenceGradingResult,
  type CriteriaAlignmentItem,
  type RiskFlag,
  type GradingRecommendation,
} from "./engines/evidence-grader.js";
export {
  calculateDelegationIndex,
  type DelegationInput,
  type ApprovalWithRole,
  type ScoreChangeRequestTiming,
} from "./engines/delegation-index.js";
export {
  calculateOperatingDebt,
  type OperatingDebtInput,
  type PracticeScoreSnapshot,
  type EvidenceWithExpiry,
} from "./engines/operating-debt.js";
export {
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
} from "./engines/maturity.js";

// ─── Constants ───────────────────────────────────────────────────────────────
export { WIP_LIMITS, type WIPLimitConfig } from "./constants/wip-limits.js";
export {
  DEFAULT_LIFECYCLE_WEIGHTS,
  LIFECYCLE_MODIFIERS,
} from "./constants/lifecycle-weights.js";

// ─── bds-OS types ────────────────────────────────────────────────────────────
export * from "./types/database.js";
export * from "./types/governance.js";
export * from "./types/opi.js";

// ─── CDIO types (aliased where they clash with bds-OS names) ────────────────
export {
  MODULE_META,
  MODULE_NAMES,
  SIZE_PRIORITY_SEQUENCES,
  type OrgSize,
  type Industry,
  type DiagnosticAnswer,
  type DiagnosticResponse,
  type ModuleScore,
  type PriorityClass,
  type AssessmentSynthesis,
  type DivergencePoint,
  type EconomicOutcome,
  type InitiativeProof,
  type ModuleMeta,
  type MaturityLevel as CdioMaturityLevel,
  type Initiative as CdioInitiative,
} from "./types/cdio.js";
