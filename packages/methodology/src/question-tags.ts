// BDS-NEW metadata (Prompt 2, additive — TECH-SPEC Phase 0a). The founder-
// ratified question bank in diagnostic-questions.ts is methodology IP and is
// copied byte-stable from CDIO; these tags therefore live in a SIDE TABLE
// keyed by question id instead of being edited into the bank.
//
// vertex: which Strategy Triangle vertex the question illuminates.
// decide_stage: only where the question directly probes the M4 DECIDE
//   technology-decision method.
//
// ⚠️ PROVISIONAL: the six DecideStage names below follow the classic published
// DECIDE decision model (Define → Establish criteria → Consider alternatives →
// Identify best → Develop plan → Evaluate). The founder has NOT yet ratified
// BDS's own M4 stage names — rename these in ONE place (this type) when he does.

import { DIAGNOSTIC_QUESTIONS, type DiagnosticQuestion } from "./diagnostic-questions";

export type Vertex = "strategy" | "operating_model" | "initiatives";

export type DecideStage =
  | "define"
  | "establish_criteria"
  | "consider_alternatives"
  | "identify_best"
  | "develop_plan"
  | "evaluate";

export interface QuestionTriangleTags {
  vertex: Vertex;
  decide_stage?: DecideStage;
}

export const QUESTION_TRIANGLE_TAGS: Record<string, QuestionTriangleTags> = {
  // M1 — Role of the CIDO
  m1_q1: { vertex: "operating_model" },
  m1_q2: { vertex: "operating_model" },
  m1_q3: { vertex: "initiatives" }, // alignment of initiatives to strategy = the S↔I edge
  m1_q4: { vertex: "operating_model" },
  m1_q5: { vertex: "strategy" },
  m1_q6: { vertex: "strategy" },
  m1_q7: { vertex: "operating_model" },
  m1_q8: { vertex: "strategy" },

  // M2 — IT/Digital Transformation Strategy
  m2_q1: { vertex: "strategy" },
  m2_q2: { vertex: "strategy" },
  m2_q3: { vertex: "strategy" },
  m2_q4: { vertex: "initiatives" },
  m2_q5: { vertex: "initiatives" },
  m2_q6: { vertex: "initiatives" },
  m2_q7: { vertex: "initiatives" },
  m2_q8: { vertex: "strategy" },

  // M3 — Enterprise Architecture & IT Modernization
  m3_q1: { vertex: "operating_model" },
  m3_q2: { vertex: "operating_model" },
  m3_q3: { vertex: "operating_model" },
  m3_q4: { vertex: "operating_model" },
  m3_q5: { vertex: "initiatives" },
  m3_q6: { vertex: "initiatives" },
  m3_q7: { vertex: "strategy" },
  m3_q8: { vertex: "operating_model", decide_stage: "establish_criteria" },

  // M4 — Cloud Computing & Infrastructure Strategy
  m4_q1: { vertex: "strategy" },
  m4_q2: { vertex: "operating_model" },
  m4_q3: { vertex: "operating_model" },
  m4_q4: { vertex: "initiatives" },
  m4_q5: { vertex: "operating_model" },
  m4_q6: { vertex: "operating_model" },
  m4_q7: { vertex: "operating_model" },
  m4_q8: { vertex: "operating_model" },

  // M5 — Cybersecurity, Risk Management & Compliance
  m5_q1: { vertex: "operating_model" },
  m5_q2: { vertex: "operating_model" },
  m5_q3: { vertex: "operating_model" },
  m5_q4: { vertex: "operating_model" },
  m5_q5: { vertex: "operating_model" },
  m5_q6: { vertex: "operating_model" },
  m5_q7: { vertex: "operating_model", decide_stage: "evaluate" },
  m5_q8: { vertex: "operating_model" },

  // M6 — Data & AI Engineering
  m6_q1: { vertex: "operating_model" },
  m6_q2: { vertex: "operating_model" },
  m6_q3: { vertex: "operating_model" },
  m6_q4: { vertex: "operating_model" },
  m6_q5: { vertex: "strategy" },
  m6_q6: { vertex: "operating_model" },
  m6_q7: { vertex: "operating_model" },
  m6_q8: { vertex: "operating_model" },

  // M7 — Digital Ecosystems: Platforms & Products
  m7_q1: { vertex: "strategy" },
  m7_q2: { vertex: "operating_model" },
  m7_q3: { vertex: "operating_model" },
  m7_q4: { vertex: "operating_model" },
  m7_q5: { vertex: "operating_model" },
  m7_q6: { vertex: "operating_model" },
  m7_q7: { vertex: "operating_model", decide_stage: "define" },
  m7_q8: { vertex: "operating_model" },

  // M8 — Data Analytics, BI & Decision Science
  m8_q1: { vertex: "operating_model" },
  m8_q2: { vertex: "operating_model" },
  m8_q3: { vertex: "operating_model" },
  m8_q4: { vertex: "operating_model" },
  m8_q5: { vertex: "operating_model" },
  m8_q6: { vertex: "operating_model" },
  m8_q7: { vertex: "operating_model" },
  m8_q8: { vertex: "operating_model" },

  // M9 — Human Centered Design & Customer Journey
  m9_q1: { vertex: "operating_model" },
  m9_q2: { vertex: "operating_model" },
  m9_q3: { vertex: "operating_model" },
  m9_q4: { vertex: "operating_model" },
  m9_q5: { vertex: "operating_model" },
  m9_q6: { vertex: "operating_model" },
  m9_q7: { vertex: "operating_model" },
  m9_q8: { vertex: "operating_model" },

  // M10 — Leadership, Business Strategy & Communications
  m10_q1: { vertex: "operating_model" },
  m10_q2: { vertex: "operating_model" },
  m10_q3: { vertex: "operating_model" },
  m10_q4: { vertex: "operating_model" },
  m10_q5: { vertex: "strategy" },
  m10_q6: { vertex: "operating_model" },
  m10_q7: { vertex: "strategy" },
  m10_q8: { vertex: "operating_model" },

  // M11 — CIDO Organization Structure & Operations
  m11_q1: { vertex: "operating_model" },
  m11_q2: { vertex: "operating_model" },
  m11_q3: { vertex: "operating_model" },
  m11_q4: { vertex: "operating_model" },
  m11_q5: { vertex: "operating_model" },
  m11_q6: { vertex: "operating_model" },
  m11_q7: { vertex: "operating_model" },
  m11_q8: { vertex: "operating_model" },

  // M12 — Financial Acumen
  m12_q1: { vertex: "operating_model" },
  m12_q2: { vertex: "operating_model" },
  m12_q3: { vertex: "operating_model" },
  m12_q4: { vertex: "operating_model" },
  m12_q5: { vertex: "initiatives", decide_stage: "evaluate" },
  m12_q6: { vertex: "initiatives", decide_stage: "define" },
  m12_q7: { vertex: "initiatives", decide_stage: "evaluate" },
  m12_q8: { vertex: "operating_model" },

  // M13 — Portfolio & Vendor Management
  m13_q1: { vertex: "initiatives" },
  m13_q2: { vertex: "initiatives" },
  m13_q3: { vertex: "initiatives" },
  m13_q4: { vertex: "initiatives" },
  m13_q5: { vertex: "operating_model", decide_stage: "evaluate" },
  m13_q6: { vertex: "operating_model", decide_stage: "evaluate" },
  m13_q7: { vertex: "operating_model", decide_stage: "develop_plan" },
  m13_q8: { vertex: "operating_model", decide_stage: "evaluate" },

  // M14 — Agile, DevOps & Innovation Management
  m14_q1: { vertex: "operating_model" },
  m14_q2: { vertex: "operating_model" },
  m14_q3: { vertex: "operating_model" },
  m14_q4: { vertex: "operating_model" },
  m14_q5: { vertex: "operating_model" },
  m14_q6: { vertex: "operating_model" },
  m14_q7: { vertex: "operating_model" },
  m14_q8: { vertex: "initiatives" },

  // M15 — Business Process Transformation & Automation
  m15_q1: { vertex: "operating_model" },
  m15_q2: { vertex: "operating_model" },
  m15_q3: { vertex: "operating_model" },
  m15_q4: { vertex: "operating_model" },
  m15_q5: { vertex: "operating_model" },
  m15_q6: { vertex: "initiatives" },
  m15_q7: { vertex: "operating_model" },
  m15_q8: { vertex: "initiatives", decide_stage: "evaluate" },

  // M16 — Future of Work & Workforce Development
  m16_q1: { vertex: "operating_model" },
  m16_q2: { vertex: "operating_model" },
  m16_q3: { vertex: "operating_model" },
  m16_q4: { vertex: "operating_model" },
  m16_q5: { vertex: "operating_model" },
  m16_q6: { vertex: "operating_model" },
  m16_q7: { vertex: "operating_model" },
  m16_q8: { vertex: "operating_model" },
};

export interface TaggedDiagnosticQuestion extends DiagnosticQuestion {
  triangle: QuestionTriangleTags;
}

/** The bank with BDS triangle tags merged in. Throws if a question is untagged
 *  — a new question without a vertex assignment is a build-stopping bug. */
export function getTaggedQuestions(): TaggedDiagnosticQuestion[] {
  return DIAGNOSTIC_QUESTIONS.map((q) => {
    const triangle = QUESTION_TRIANGLE_TAGS[q.id];
    if (!triangle) {
      throw new Error(`@bos/methodology: question ${q.id} has no triangle tag`);
    }
    return { ...q, triangle };
  });
}

export function getQuestionsByVertex(vertex: Vertex): TaggedDiagnosticQuestion[] {
  return getTaggedQuestions().filter((q) => q.triangle.vertex === vertex);
}

export function getDecideRelevantQuestions(): TaggedDiagnosticQuestion[] {
  return getTaggedQuestions().filter((q) => q.triangle.decide_stage !== undefined);
}
