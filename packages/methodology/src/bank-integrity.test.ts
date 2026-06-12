import { describe, expect, it } from "vitest";
import {
  DIAGNOSTIC_QUESTIONS,
  getModuleNumbers,
  getModuleQuestions,
} from "./diagnostic-questions";
import { getAuthoritativeCitation, QUESTION_CITATIONS } from "./question-citations";
import {
  getDecideRelevantQuestions,
  getQuestionsByVertex,
  getTaggedQuestions,
  QUESTION_TRIANGLE_TAGS,
} from "./question-tags";

// The bank is founder-ratified methodology IP. These tests prove the
// extraction was behavior-preserving: exact counts, full citation coverage,
// and that every citation actually names a construct (the defensibility bar).

describe("bank integrity (CDIO extraction)", () => {
  it("has exactly 128 questions across 16 modules, 8 each", () => {
    expect(DIAGNOSTIC_QUESTIONS).toHaveLength(128);
    expect(getModuleNumbers()).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1),
    );
    for (const moduleNumber of getModuleNumbers()) {
      expect(getModuleQuestions(moduleNumber)).toHaveLength(8);
    }
  });

  it("has unique, well-formed question ids", () => {
    const ids = DIAGNOSTIC_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(128);
    for (const id of ids) {
      expect(id).toMatch(/^m\d{1,2}_q[1-8]$/);
    }
  });

  it("every question has non-empty text, subcategory, and module number", () => {
    for (const q of DIAGNOSTIC_QUESTIONS) {
      expect(q.question.trim().length, q.id).toBeGreaterThan(0);
      expect(q.subcategory.trim().length, q.id).toBeGreaterThan(0);
      expect(q.module_number).toBeGreaterThanOrEqual(1);
      expect(q.module_number).toBeLessThanOrEqual(16);
    }
  });

  it("every question has an authoritative citation", () => {
    for (const q of DIAGNOSTIC_QUESTIONS) {
      const citation = getAuthoritativeCitation(q.id);
      expect(citation, `missing citation for ${q.id}`).toBeDefined();
    }
  });

  it("every citation names a construct and meets the schema bar", () => {
    const grades = new Set(["strong", "weak", "indefensible"]);
    for (const [id, citation] of Object.entries(QUESTION_CITATIONS)) {
      // "Named construct" = a named framework AND a specific reference into it.
      expect(citation.framework.trim().length, `${id}: framework`).toBeGreaterThan(0);
      expect(citation.reference.trim().length, `${id}: reference`).toBeGreaterThan(0);
      expect(citation.rationale.trim().length, `${id}: rationale`).toBeGreaterThan(0);
      expect(grades.has(citation.grade), `${id}: grade ${citation.grade}`).toBe(true);
      expect(typeof citation.clientVisible, id).toBe("boolean");
      expect(typeof citation.semanticPass, id).toBe("boolean");
    }
  });

  it("citations cover exactly the question ids (no orphans either way)", () => {
    const questionIds = new Set(DIAGNOSTIC_QUESTIONS.map((q) => q.id));
    for (const citationId of Object.keys(QUESTION_CITATIONS)) {
      expect(questionIds.has(citationId), `citation for unknown ${citationId}`).toBe(true);
    }
  });
});

describe("BDS triangle tags (additive metadata)", () => {
  it("every one of the 128 questions has a vertex tag — no more, no fewer", () => {
    const tagged = getTaggedQuestions(); // throws on any untagged question
    expect(tagged).toHaveLength(128);
    expect(Object.keys(QUESTION_TRIANGLE_TAGS)).toHaveLength(128);
  });

  it("vertex values partition the bank", () => {
    const strategy = getQuestionsByVertex("strategy").length;
    const operating = getQuestionsByVertex("operating_model").length;
    const initiatives = getQuestionsByVertex("initiatives").length;
    expect(strategy + operating + initiatives).toBe(128);
    // CDIO is the operating-model source (SPEC §4 M2) — sanity-check the skew.
    expect(operating).toBeGreaterThan(strategy);
    expect(operating).toBeGreaterThan(initiatives);
  });

  it("decide_stage appears only where tagged, with valid stage names", () => {
    const stages = new Set([
      "define",
      "establish_criteria",
      "consider_alternatives",
      "identify_best",
      "develop_plan",
      "evaluate",
    ]);
    const decideQuestions = getDecideRelevantQuestions();
    expect(decideQuestions.length).toBeGreaterThan(0);
    for (const q of decideQuestions) {
      expect(stages.has(q.triangle.decide_stage as string), q.id).toBe(true);
    }
  });

  it("tags are a pure overlay — the bank objects are not mutated", () => {
    for (const q of DIAGNOSTIC_QUESTIONS) {
      expect("triangle" in q).toBe(false);
    }
  });
});
