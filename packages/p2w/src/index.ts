// @bos/p2w — Playing-to-Win framework layer, extracted verbatim from P2W-OS
// (branch claude/strategy-app-mvp-QQmbo — that repo has NO main) in Prompt 2.
// METHODOLOGY IP: behavior changes require founder approval.
// LAW #6: this package is pure — no IO, no Supabase, no Anthropic imports.
// Prompt assembly that consumes COACH_PERSONA / FRAMEWORK_MD lives in @bos/ai.

export {
  CASCADE_META,
  CASCADE_ORDER,
  computeConfidence,
  POSSIBILITY_STATUS,
  RE_CATEGORIES,
  TEST_LEVELS,
  type CascadeBox,
  type PossibilityStatus,
  type ReCategory,
} from "./framework";

export { COACH_PERSONA } from "./persona";
export { EXEMPLARS_MD, FRAMEWORK_MD } from "./content";

export const PACKAGE_NAME = "@bos/p2w" as const;
