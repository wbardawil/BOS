// @bos/methodology — the founder-ratified 128-question diagnostic bank with
// authoritative citations, extracted verbatim from CDIO (Prompt 2).
// METHODOLOGY IP: do not reword questions or citations without founder
// sign-off. BDS additions (triangle vertex / DECIDE-stage tags) live in the
// question-tags.ts side table, never inside the bank itself.

export {
  DIAGNOSTIC_QUESTIONS,
  getModuleQuestions,
  getModuleNumbers,
  moduleHasV2Schema,
  type DiagnosticQuestion,
  type FrameworkCitation,
  type QuestionTags,
} from "./diagnostic-questions";

export {
  QUESTION_CITATIONS,
  getAuthoritativeCitation,
  type AuthoritativeCitation,
  type CitationGrade,
} from "./question-citations";

export {
  QUESTION_TRIANGLE_TAGS,
  getTaggedQuestions,
  getQuestionsByVertex,
  getDecideRelevantQuestions,
  type DecideStage,
  type QuestionTriangleTags,
  type TaggedDiagnosticQuestion,
  type Vertex,
} from "./question-tags";

export type { QuestionAreaTag, QuestionFunctionTag } from "./types";

export const PACKAGE_NAME = "@bos/methodology" as const;
