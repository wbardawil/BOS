// Carved verbatim from CDIO/src/types/index.ts (2026-06-11) so this package
// has zero CDIO imports. Do not extend here without checking the source repo.

/**
 * Layer 1 — what kind of concern the question probes.
 * Used by filterQuestionsForRole() so each respondent sees their lane.
 */
export type QuestionFunctionTag =
  | "strategic"     // governance, vision, business alignment
  | "financial"     // budget, ROI, vendor cost
  | "technical"     // architecture, implementation, controls
  | "operational"   // processes, day-to-day execution
  | "risk";         // compliance, threat, mitigation

/**
 * Layer 2 — which part of the company the question applies to.
 * Used primarily to route Director/Manager-level respondents (who own a
 * narrower slice of the org) to questions that fall in their lane.
 */
export type QuestionAreaTag =
  | "operations"
  | "sales"
  | "IT"
  | "finance"
  | "marketing"
  | "cross_functional";   // applies organization-wide
