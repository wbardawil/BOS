// ============================================================
// AI-CDIO — Diagnostic Questions
//
// PLAYBOOK-GROUNDED REWRITE (2026-05-09).
//
// Every question in this file is a verbatim diagnostic question
// from the AI-CDIO source playbook (`source-playbook/`), specifically
// from `01_ASSESSMENT_FRAMEWORK.md` Section "MODULE ASSESSMENTS".
// Each question is paired with the playbook's verbatim Level 1-4
// maturity descriptions for the same module.
//
// Provenance per question (required field) records: source file,
// section, subcategory, and which fields are verbatim playbook
// content vs which are AI-CDIO extensions on top.
//
// AI-CDIO extensions (clearly marked in provenance):
//   - level_indicators.level_5  — "Optimizing" tier extending
//     the playbook's Level 4 "Advanced". Module-wide rather
//     than per-question.
//   - tags.function / tags.area — role-filter tagging used by
//     `filterQuestionsForRole()` so a CEO doesn't see questions
//     a CTO is better-positioned to answer. Inferred from
//     question content; not in the playbook.
//   - framework_citation        — points back to the playbook
//     section (and any external framework reference the
//     playbook explicitly cites).
//   - na_eligible (default true) — every question can be marked
//     N/A by the respondent.
//
// Replaces the 90-question strict cut (commit aa8e42a). The cut
// removed AI-CDIO interpolation but kept some external-framework
// synthesis. The playbook supersedes that synthesis: this file
// is the canonical, grounded question bank.
// ============================================================

import type {
  QuestionFunctionTag,
  QuestionAreaTag,
} from "./types";
import { getAuthoritativeCitation } from "./question-citations";

export interface QuestionTags {
  function: QuestionFunctionTag[];
  area: QuestionAreaTag[];
}

export interface FrameworkCitation {
  /** Human-readable source name shown to the respondent. */
  framework: string;
  /** The specific subcategory / process area / control reference. */
  reference: string;
  /** Plain-English one-liner explaining why the framework cares about this. */
  rationale: string;
}

export interface DiagnosticQuestion {
  id: string;
  module_number: number;
  subcategory: string;
  question: string;
  level_indicators: {
    level_1: string;
    level_2: string;
    level_3: string;
    level_4: string;
    level_5?: string;
  };
  tags?: QuestionTags;
  framework_citation?: FrameworkCitation;
  na_eligible?: boolean;
  /** Where this question's content originated. */
  provenance?: string;
}

// --- Per-module level rubrics (verbatim from playbook 01_ASSESSMENT_FRAMEWORK.md) ---
// Indexed by module number. Level 1-4 are verbatim from the playbook.
// Level 5 is an AI-CDIO extension beyond the playbook's Advanced tier.

const LEVEL_RUBRIC: Record<number, { l1: string; l2: string; l3: string; l4: string; l5: string }> = {
  1: {
    l1: "No formal technology leadership role; IT is reactive and operational.",
    l2: "Technology manager exists but limited strategic influence.",
    l3: "Defined CIDO/CIO role with some board interaction and strategic input.",
    l4: "CIDO is strategic partner, drives innovation, full board engagement.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): technology leadership shapes the company's competitive identity; the board references CIDO position before major bets; tech leadership pipeline produces external talent.",
  },
  2: {
    l1: "No formal strategy; reactive technology decisions.",
    l2: "Strategy exists but not well-documented or communicated.",
    l3: "Documented strategy with roadmap and some execution.",
    l4: "Comprehensive strategy, strong execution, measurable business impact.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): strategy is institutional muscle — executives recite it consistently; the company adapts at the speed of strategic insight.",
  },
  3: {
    l1: "No architecture framework; siloed, legacy systems.",
    l2: "Some architecture documentation; ad hoc modernization.",
    l3: "Defined EA framework; planned modernization initiatives.",
    l4: "Comprehensive EA program; continuous modernization; innovation leadership.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): architecture is a strategic asset; modernization runs continuously; technical debt is balance-sheet-managed.",
  },
  4: {
    l1: "On-premise only; manual infrastructure management.",
    l2: "Beginning cloud adoption; some cloud workloads.",
    l3: "Defined cloud strategy; active migration; hybrid approach.",
    l4: "Cloud-first strategy; FinOps practices; optimized multi-cloud.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): cloud posture is a competitive advantage; FinOps is institutional; infrastructure scales independently of demand spikes.",
  },
  5: {
    l1: "Reactive security; no formal framework; compliance gaps.",
    l2: "Basic security controls; some compliance tracking.",
    l3: "Formal security program; proactive risk management; compliance focus.",
    l4: "Advanced security; predictive threat management; zero trust architecture.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): security is a strategic enabler; AI-driven threat detection is predictive; the company is recognizable as security-mature at audit.",
  },
  6: {
    l1: "Siloed data; no AI capabilities; manual processes.",
    l2: "Some data integration; experimenting with AI.",
    l3: "Integrated data platform; AI models in production; governance established.",
    l4: "Real-time data fabric; AI-first culture; scalable ML operations.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): data and AI are competitive moats; AI-first culture is institutional; the company's capability is gated by imagination, not data.",
  },
  7: {
    l1: "Monolithic systems; no API strategy; project-based thinking.",
    l2: "Some APIs; beginning platform thinking.",
    l3: "Platform strategy defined; API-first approach; product mindset emerging.",
    l4: "Full platform ecosystem; thriving marketplace; product-led organization.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): platform-as-product is institutional; partners and customers consume capability with self-service ease.",
  },
  8: {
    l1: "Manual reporting; spreadsheet-based; descriptive only.",
    l2: "Basic BI tools; some automated reporting; limited adoption.",
    l3: "Comprehensive BI; self-service analytics; predictive models in use.",
    l4: "AI-driven insights; automated decision-making; analytics embedded everywhere.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): analytics is consequential; the company moves at the speed of its observations; data literacy is cultural.",
  },
  9: {
    l1: "Technology-first; no user research; poor CX.",
    l2: "Some user testing; basic CX awareness.",
    l3: "Design thinking integrated; customer journey mapping; CX metrics tracked.",
    l4: "Human-centered culture; continuous CX innovation; industry-leading experience.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): CX is a competitive identity; customer voice is institutional; major decisions are co-designed with customer representatives.",
  },
  10: {
    l1: "Weak leadership; poor communication; IT isolated.",
    l2: "Transactional leadership; inconsistent communication.",
    l3: "Strong leadership; regular stakeholder engagement; clear communication.",
    l4: "Transformational leadership; storytelling mastery; trusted advisor to C-suite.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): technology leadership consistently demonstrates the full range of transformational leadership (idealized influence, inspirational motivation, intellectual stimulation, individualized consideration) across the organization; leadership development and succession are institutionalized so the leadership bench renews itself; stakeholder relationships are managed as a sustained capability rather than individual rapport.",
  },
  11: {
    l1: "Ad hoc structure; unclear roles; reactive operations.",
    l2: "Basic structure; some processes; inconsistent execution.",
    l3: "Well-defined structure; standard processes; metrics tracked.",
    l4: "Optimized organization; adaptive structure; high-performing teams.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): operating model is adaptive; team topology evolves with strategy; high performance is institutional muscle.",
  },
  12: {
    l1: "Limited budget visibility; no ROI tracking; reactive spending.",
    l2: "Basic budgeting; some cost tracking; ad hoc ROI analysis.",
    l3: "Comprehensive budget; ROI required; value tracking; cost optimization.",
    l4: "Strategic investment planning; rigorous value management; FinOps excellence.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): tech finance is board-grade; investment realization is a known number; FinOps excellence is competitive advantage.",
  },
  13: {
    l1: "No PMO; ad hoc vendor management; poor visibility.",
    l2: "Basic project tracking; reactive vendor management.",
    l3: "Mature PMO; structured vendor management; contract optimization.",
    l4: "Strategic portfolio management; vendor partnerships; value maximization.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): portfolio and vendors are strategic assets; vendor partnerships drive innovation; portfolio realizes value reliably.",
  },
  14: {
    l1: "Waterfall only; no automation; risk-averse culture.",
    l2: "Some Agile teams; basic automation; limited innovation.",
    l3: "Agile standard; DevOps practices; structured innovation.",
    l4: "Scaled Agile; full DevOps; innovation embedded; continuous improvement.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): scaled Agile + DevOps maturity; innovation runs continuously; the company is recognized for delivery velocity.",
  },
  15: {
    l1: "Manual processes; no documentation; no automation.",
    l2: "Some process documentation; basic automation.",
    l3: "Process management discipline; strategic automation; RPA in use.",
    l4: "Intelligent automation; AI-driven processes; continuous optimization.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): intelligent automation is institutional; processes self-improve through AI feedback loops; throughput is a competitive moat.",
  },
  16: {
    l1: "Poor change management; no training; high resistance.",
    l2: "Ad hoc change management; basic training available.",
    l3: "Structured change management; systematic training; skill development focus.",
    l4: "Change-ready culture; continuous learning; future-ready workforce.",
    l5: "AI-CDIO Optimizing tier (extension beyond playbook): change-ready culture is institutional; continuous learning is muscle memory; the workforce adapts at the speed of new technology.",
  },
};

// Helper to spread a module's rubric onto a question.
function rubric(moduleNumber: number) {
  const r = LEVEL_RUBRIC[moduleNumber];
  // BOS edit (type-level only): noUncheckedIndexedAccess guard. The CDIO
  // source would throw on the undefined deref below anyway; behavior identical.
  if (!r) throw new Error(`no level rubric for module ${moduleNumber}`);
  return {
    level_1: r.l1,
    level_2: r.l2,
    level_3: r.l3,
    level_4: r.l4,
    level_5: r.l5,
  };
}

// Common provenance prefix per module.
function prov(moduleNumber: number, subsection: string, qIndex: number): string {
  return `Source playbook source-playbook/01_ASSESSMENT_FRAMEWORK.md, Module ${moduleNumber}, section ${subsection}, question ${qIndex} — verbatim diagnostic question. Level 1-4 indicators verbatim from the same module's "Maturity Scoring" section. Level 5 indicator is AI-CDIO extension beyond the playbook's Advanced tier. Role/area tags inferred by AI-CDIO from question content; not in playbook.`;
}

// cite(id) is the Step C-2 wiring for the defensibility-bar rebuild
// (locked 2026-05-19). It resolves a question's framework_citation from
// the authoritative citation map (question-citations.ts) when the question's
// module has been founder-ratified (clientVisible:true) and the grade is not
// indefensible; otherwise it falls back to a generic playbook citation.
// Result: the product UI now surfaces the authoritative named-construct
// citation (e.g. "COBIT 2019 (ISACA) — EDM01 'Ensured Governance Framework
// Setting and Maintenance'") in place of the prior generic "AI-CDIO Source
// Playbook" label, without changing the FrameworkCitation type shape.
function cite(questionId: string): FrameworkCitation {
  const a = getAuthoritativeCitation(questionId);
  if (a && a.clientVisible && a.grade !== "indefensible") {
    return { framework: a.framework, reference: a.reference, rationale: a.rationale };
  }
  const m = questionId.match(/^m(\d+)_/);
  // BOS edit (type-level only): noUncheckedIndexedAccess needs the capture
  // group bound before parseInt. Behavior identical to the CDIO source.
  const moduleDigits = m?.[1];
  const moduleNumber = moduleDigits ? parseInt(moduleDigits, 10) : 0;
  return {
    framework: "AI-CDIO Source Playbook (01_ASSESSMENT_FRAMEWORK.md)",
    reference: `Module ${moduleNumber} — (authoritative citation pending)`,
    rationale: "Verbatim diagnostic question from the AI-CDIO source playbook. The module's authoritative named-construct citation has not yet been founder-ratified.",
  };
}

export const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  // ============================================================
  // MODULE 1: Role of the CIDO
  // ============================================================
  {
    id: "m1_q1", module_number: 1, subcategory: "Leadership & Governance",
    question: "Is there a clearly defined technology leadership role at the executive level?",
    level_indicators: rubric(1),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m1_q1"),
    provenance: prov(1, "1.1 Leadership & Governance", 1),
  },
  {
    id: "m1_q2", module_number: 1, subcategory: "Leadership & Governance",
    question: "Does the technology leader report directly to CEO or Board?",
    level_indicators: rubric(1),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m1_q2"),
    provenance: prov(1, "1.1 Leadership & Governance", 2),
  },
  {
    id: "m1_q3", module_number: 1, subcategory: "Leadership & Governance",
    question: "Are technology initiatives aligned with business strategy?",
    level_indicators: rubric(1),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m1_q3"),
    provenance: prov(1, "1.1 Leadership & Governance", 3),
  },
  {
    id: "m1_q4", module_number: 1, subcategory: "Leadership & Governance",
    question: "Is there a formal IT governance structure?",
    level_indicators: rubric(1),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m1_q4"),
    provenance: prov(1, "1.1 Leadership & Governance", 4),
  },
  {
    id: "m1_q5", module_number: 1, subcategory: "Strategic Influence",
    question: "Does technology leadership participate in strategic business planning?",
    level_indicators: rubric(1),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m1_q5"),
    provenance: prov(1, "1.2 Strategic Influence", 1),
  },
  {
    id: "m1_q6", module_number: 1, subcategory: "Strategic Influence",
    question: "Is IT viewed as a strategic enabler vs. cost center?",
    level_indicators: rubric(1),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m1_q6"),
    provenance: prov(1, "1.2 Strategic Influence", 2),
  },
  {
    id: "m1_q7", module_number: 1, subcategory: "Strategic Influence",
    question: "Are there regular executive briefings on technology initiatives?",
    level_indicators: rubric(1),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m1_q7"),
    provenance: prov(1, "1.2 Strategic Influence", 3),
  },
  {
    id: "m1_q8", module_number: 1, subcategory: "Strategic Influence",
    question: "Does technology leadership influence product/service strategy?",
    level_indicators: rubric(1),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m1_q8"),
    provenance: prov(1, "1.2 Strategic Influence", 4),
  },

  // ============================================================
  // MODULE 2: IT/Digital Transformation Strategy
  // ============================================================
  {
    id: "m2_q1", module_number: 2, subcategory: "Strategy Development",
    question: "Is there a documented digital transformation strategy?",
    level_indicators: rubric(2),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m2_q1"),
    provenance: prov(2, "2.1 Strategy Development", 1),
  },
  {
    id: "m2_q2", module_number: 2, subcategory: "Strategy Development",
    question: "Does the strategy align with business objectives?",
    level_indicators: rubric(2),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m2_q2"),
    provenance: prov(2, "2.1 Strategy Development", 2),
  },
  {
    id: "m2_q3", module_number: 2, subcategory: "Strategy Development",
    question: "Are transformation goals measurable and time-bound?",
    level_indicators: rubric(2),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m2_q3"),
    provenance: prov(2, "2.1 Strategy Development", 3),
  },
  {
    id: "m2_q4", module_number: 2, subcategory: "Strategy Development",
    question: "Is there executive sponsorship for transformation initiatives?",
    level_indicators: rubric(2),
    tags: { function: ["strategic"], area: ["cross_functional"] },
    framework_citation: cite("m2_q4"),
    provenance: prov(2, "2.1 Strategy Development", 4),
  },
  {
    id: "m2_q5", module_number: 2, subcategory: "Strategy Execution",
    question: "Is there a roadmap for digital transformation implementation?",
    level_indicators: rubric(2),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m2_q5"),
    provenance: prov(2, "2.2 Strategy Execution", 1),
  },
  {
    id: "m2_q6", module_number: 2, subcategory: "Strategy Execution",
    question: "Are resources allocated to support transformation goals?",
    level_indicators: rubric(2),
    tags: { function: ["strategic", "financial"], area: ["IT", "finance"] },
    framework_citation: cite("m2_q6"),
    provenance: prov(2, "2.2 Strategy Execution", 2),
  },
  {
    id: "m2_q7", module_number: 2, subcategory: "Strategy Execution",
    question: "Are transformation initiatives tracked and measured?",
    level_indicators: rubric(2),
    tags: { function: ["operational", "strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m2_q7"),
    provenance: prov(2, "2.2 Strategy Execution", 3),
  },
  {
    id: "m2_q8", module_number: 2, subcategory: "Strategy Execution",
    question: "Is the strategy communicated across the organization?",
    level_indicators: rubric(2),
    tags: { function: ["strategic", "operational"], area: ["cross_functional"] },
    framework_citation: cite("m2_q8"),
    provenance: prov(2, "2.2 Strategy Execution", 4),
  },

  // ============================================================
  // MODULE 3: Enterprise Architecture & IT Modernization
  // ============================================================
  {
    id: "m3_q1", module_number: 3, subcategory: "Architecture Planning",
    question: "Is there a documented enterprise architecture framework?",
    level_indicators: rubric(3),
    tags: { function: ["technical", "strategic"], area: ["IT"] },
    framework_citation: cite("m3_q1"),
    provenance: prov(3, "3.1 Architecture Planning", 1),
  },
  {
    id: "m3_q2", module_number: 3, subcategory: "Architecture Planning",
    question: "Are current and future state architectures defined?",
    level_indicators: rubric(3),
    tags: { function: ["technical", "strategic"], area: ["IT"] },
    framework_citation: cite("m3_q2"),
    provenance: prov(3, "3.1 Architecture Planning", 2),
  },
  {
    id: "m3_q3", module_number: 3, subcategory: "Architecture Planning",
    question: "Is there a technology standards governance process?",
    level_indicators: rubric(3),
    tags: { function: ["technical", "operational"], area: ["IT"] },
    framework_citation: cite("m3_q3"),
    provenance: prov(3, "3.1 Architecture Planning", 3),
  },
  {
    id: "m3_q4", module_number: 3, subcategory: "Architecture Planning",
    question: "Are architecture decisions aligned with business capabilities?",
    level_indicators: rubric(3),
    tags: { function: ["strategic", "technical"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m3_q4"),
    provenance: prov(3, "3.1 Architecture Planning", 4),
  },
  {
    id: "m3_q5", module_number: 3, subcategory: "Modernization Approach",
    question: "Is there a plan to address technical debt?",
    level_indicators: rubric(3),
    tags: { function: ["technical", "operational", "financial"], area: ["IT"] },
    framework_citation: cite("m3_q5"),
    provenance: prov(3, "3.2 Modernization Approach", 1),
  },
  {
    id: "m3_q6", module_number: 3, subcategory: "Modernization Approach",
    question: "Are legacy systems being systematically modernized?",
    level_indicators: rubric(3),
    tags: { function: ["technical", "strategic"], area: ["IT"] },
    framework_citation: cite("m3_q6"),
    provenance: prov(3, "3.2 Modernization Approach", 2),
  },
  {
    id: "m3_q7", module_number: 3, subcategory: "Modernization Approach",
    question: "Is cloud adoption part of the modernization strategy?",
    level_indicators: rubric(3),
    tags: { function: ["technical", "strategic"], area: ["IT"] },
    framework_citation: cite("m3_q7"),
    provenance: prov(3, "3.2 Modernization Approach", 3),
  },
  {
    id: "m3_q8", module_number: 3, subcategory: "Modernization Approach",
    question: "Are new technologies evaluated against architecture standards?",
    level_indicators: rubric(3),
    tags: { function: ["technical", "operational"], area: ["IT"] },
    framework_citation: cite("m3_q8"),
    provenance: prov(3, "3.2 Modernization Approach", 4),
  },

  // ============================================================
  // MODULE 4: Cloud Computing & Infrastructure Strategy
  // ============================================================
  {
    id: "m4_q1", module_number: 4, subcategory: "Cloud Strategy",
    question: "Is there a documented cloud strategy (public, private, hybrid)?",
    level_indicators: rubric(4),
    tags: { function: ["strategic", "technical"], area: ["IT"] },
    framework_citation: cite("m4_q1"),
    provenance: prov(4, "4.1 Cloud Strategy", 1),
  },
  {
    id: "m4_q2", module_number: 4, subcategory: "Cloud Strategy",
    question: "Has a cloud assessment been conducted?",
    level_indicators: rubric(4),
    tags: { function: ["technical", "strategic"], area: ["IT"] },
    framework_citation: cite("m4_q2"),
    provenance: prov(4, "4.1 Cloud Strategy", 2),
  },
  {
    id: "m4_q3", module_number: 4, subcategory: "Cloud Strategy",
    question: "Are workloads categorized for cloud suitability?",
    level_indicators: rubric(4),
    tags: { function: ["technical"], area: ["IT"] },
    framework_citation: cite("m4_q3"),
    provenance: prov(4, "4.1 Cloud Strategy", 3),
  },
  {
    id: "m4_q4", module_number: 4, subcategory: "Cloud Strategy",
    question: "Is there a cloud migration roadmap?",
    level_indicators: rubric(4),
    tags: { function: ["strategic", "technical", "operational"], area: ["IT"] },
    framework_citation: cite("m4_q4"),
    provenance: prov(4, "4.1 Cloud Strategy", 4),
  },
  {
    id: "m4_q5", module_number: 4, subcategory: "Infrastructure Management",
    question: "Are infrastructure costs tracked and optimized?",
    level_indicators: rubric(4),
    tags: { function: ["financial", "technical", "operational"], area: ["IT", "finance"] },
    framework_citation: cite("m4_q5"),
    provenance: prov(4, "4.2 Infrastructure Management", 1),
  },
  {
    id: "m4_q6", module_number: 4, subcategory: "Infrastructure Management",
    question: "Is there automated infrastructure provisioning?",
    level_indicators: rubric(4),
    tags: { function: ["technical", "operational"], area: ["IT"] },
    framework_citation: cite("m4_q6"),
    provenance: prov(4, "4.2 Infrastructure Management", 2),
  },
  {
    id: "m4_q7", module_number: 4, subcategory: "Infrastructure Management",
    question: "Are disaster recovery and backup strategies cloud-ready?",
    level_indicators: rubric(4),
    tags: { function: ["technical", "operational", "risk"], area: ["IT"] },
    framework_citation: cite("m4_q7"),
    provenance: prov(4, "4.2 Infrastructure Management", 3),
  },
  {
    id: "m4_q8", module_number: 4, subcategory: "Infrastructure Management",
    question: "Is infrastructure performance monitored and optimized?",
    level_indicators: rubric(4),
    tags: { function: ["technical", "operational"], area: ["IT"] },
    framework_citation: cite("m4_q8"),
    provenance: prov(4, "4.2 Infrastructure Management", 4),
  },

  // ============================================================
  // MODULE 5: Cybersecurity, Risk Management & Compliance
  // ============================================================
  {
    id: "m5_q1", module_number: 5, subcategory: "Security Posture",
    question: "Is there a documented cybersecurity framework (NIST, ISO, etc.)?",
    level_indicators: rubric(5),
    tags: { function: ["strategic", "technical", "risk"], area: ["IT"] },
    framework_citation: cite("m5_q1"),
    provenance: prov(5, "5.1 Security Posture", 1),
  },
  {
    id: "m5_q2", module_number: 5, subcategory: "Security Posture",
    question: "Are security policies and procedures current and enforced?",
    level_indicators: rubric(5),
    tags: { function: ["operational", "risk"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m5_q2"),
    provenance: prov(5, "5.1 Security Posture", 2),
  },
  {
    id: "m5_q3", module_number: 5, subcategory: "Security Posture",
    question: "Is security training provided to all employees?",
    level_indicators: rubric(5),
    tags: { function: ["operational", "risk"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m5_q3"),
    provenance: prov(5, "5.1 Security Posture", 3),
  },
  {
    id: "m5_q4", module_number: 5, subcategory: "Security Posture",
    question: "Are security incidents tracked and responded to systematically?",
    level_indicators: rubric(5),
    tags: { function: ["technical", "operational", "risk"], area: ["IT"] },
    framework_citation: cite("m5_q4"),
    provenance: prov(5, "5.1 Security Posture", 4),
  },
  {
    id: "m5_q5", module_number: 5, subcategory: "Risk & Compliance",
    question: "Is there a formal risk management program?",
    level_indicators: rubric(5),
    tags: { function: ["strategic", "risk"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m5_q5"),
    provenance: prov(5, "5.2 Risk & Compliance", 1),
  },
  {
    id: "m5_q6", module_number: 5, subcategory: "Risk & Compliance",
    question: "Are regulatory compliance requirements identified and tracked?",
    level_indicators: rubric(5),
    tags: { function: ["risk", "operational"], area: ["IT", "finance", "cross_functional"] },
    framework_citation: cite("m5_q6"),
    provenance: prov(5, "5.2 Risk & Compliance", 2),
  },
  {
    id: "m5_q7", module_number: 5, subcategory: "Risk & Compliance",
    question: "Is there third-party risk assessment for vendors?",
    level_indicators: rubric(5),
    tags: { function: ["risk", "financial"], area: ["IT", "finance"] },
    framework_citation: cite("m5_q7"),
    provenance: prov(5, "5.2 Risk & Compliance", 3),
  },
  {
    id: "m5_q8", module_number: 5, subcategory: "Risk & Compliance",
    question: "Are security audits conducted regularly?",
    level_indicators: rubric(5),
    tags: { function: ["risk", "operational"], area: ["IT"] },
    framework_citation: cite("m5_q8"),
    provenance: prov(5, "5.2 Risk & Compliance", 4),
  },

  // ============================================================
  // MODULE 6: Data & AI Engineering
  // ============================================================
  {
    id: "m6_q1", module_number: 6, subcategory: "Data Infrastructure",
    question: "Is there a data architecture strategy?",
    level_indicators: rubric(6),
    tags: { function: ["technical", "strategic"], area: ["IT"] },
    framework_citation: cite("m6_q1"),
    provenance: prov(6, "6.1 Data Infrastructure", 1),
  },
  {
    id: "m6_q2", module_number: 6, subcategory: "Data Infrastructure",
    question: "Are data sources integrated and accessible?",
    level_indicators: rubric(6),
    tags: { function: ["technical", "operational"], area: ["IT"] },
    framework_citation: cite("m6_q2"),
    provenance: prov(6, "6.1 Data Infrastructure", 2),
  },
  {
    id: "m6_q3", module_number: 6, subcategory: "Data Infrastructure",
    question: "Is there a data governance program?",
    level_indicators: rubric(6),
    tags: { function: ["strategic", "operational", "risk"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m6_q3"),
    provenance: prov(6, "6.1 Data Infrastructure", 3),
  },
  {
    id: "m6_q4", module_number: 6, subcategory: "Data Infrastructure",
    question: "Are data quality and metadata managed?",
    level_indicators: rubric(6),
    tags: { function: ["technical", "operational"], area: ["IT"] },
    framework_citation: cite("m6_q4"),
    provenance: prov(6, "6.1 Data Infrastructure", 4),
  },
  {
    id: "m6_q5", module_number: 6, subcategory: "AI/ML Capabilities",
    question: "Is AI strategy aligned with business objectives?",
    level_indicators: rubric(6),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m6_q5"),
    provenance: prov(6, "6.2 AI/ML Capabilities", 1),
  },
  {
    id: "m6_q6", module_number: 6, subcategory: "AI/ML Capabilities",
    question: "Are AI/ML models in production use?",
    level_indicators: rubric(6),
    tags: { function: ["technical", "strategic"], area: ["IT"] },
    framework_citation: cite("m6_q6"),
    provenance: prov(6, "6.2 AI/ML Capabilities", 2),
  },
  {
    id: "m6_q7", module_number: 6, subcategory: "AI/ML Capabilities",
    question: "Is there MLOps or model management capability?",
    level_indicators: rubric(6),
    tags: { function: ["technical", "operational"], area: ["IT"] },
    framework_citation: cite("m6_q7"),
    provenance: prov(6, "6.2 AI/ML Capabilities", 3),
  },
  {
    id: "m6_q8", module_number: 6, subcategory: "AI/ML Capabilities",
    question: "Are ethical AI principles defined and followed?",
    level_indicators: rubric(6),
    tags: { function: ["strategic", "risk"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m6_q8"),
    provenance: prov(6, "6.2 AI/ML Capabilities", 4),
  },

  // ============================================================
  // MODULE 7: Digital Ecosystems: Platforms & Products
  // ============================================================
  {
    id: "m7_q1", module_number: 7, subcategory: "Platform Strategy",
    question: "Is there a platform or ecosystem strategy?",
    level_indicators: rubric(7),
    tags: { function: ["strategic", "technical"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m7_q1"),
    provenance: prov(7, "7.1 Platform Strategy", 1),
  },
  {
    id: "m7_q2", module_number: 7, subcategory: "Platform Strategy",
    question: "Are APIs documented and managed?",
    level_indicators: rubric(7),
    tags: { function: ["technical"], area: ["IT"] },
    framework_citation: cite("m7_q2"),
    provenance: prov(7, "7.1 Platform Strategy", 2),
  },
  {
    id: "m7_q3", module_number: 7, subcategory: "Platform Strategy",
    question: "Is there an API gateway or management platform?",
    level_indicators: rubric(7),
    tags: { function: ["technical"], area: ["IT"] },
    framework_citation: cite("m7_q3"),
    provenance: prov(7, "7.1 Platform Strategy", 3),
  },
  {
    id: "m7_q4", module_number: 7, subcategory: "Platform Strategy",
    question: "Are partner integrations enabled through APIs?",
    level_indicators: rubric(7),
    tags: { function: ["technical", "strategic"], area: ["IT", "sales"] },
    framework_citation: cite("m7_q4"),
    provenance: prov(7, "7.1 Platform Strategy", 4),
  },
  {
    id: "m7_q5", module_number: 7, subcategory: "Product Thinking",
    question: "Are technology solutions designed as products?",
    level_indicators: rubric(7),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m7_q5"),
    provenance: prov(7, "7.2 Product Thinking", 1),
  },
  {
    id: "m7_q6", module_number: 7, subcategory: "Product Thinking",
    question: "Is there a product management function for technology?",
    level_indicators: rubric(7),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m7_q6"),
    provenance: prov(7, "7.2 Product Thinking", 2),
  },
  {
    id: "m7_q7", module_number: 7, subcategory: "Product Thinking",
    question: "Are customer/user needs central to technology decisions?",
    level_indicators: rubric(7),
    tags: { function: ["strategic", "operational"], area: ["IT", "sales", "marketing"] },
    framework_citation: cite("m7_q7"),
    provenance: prov(7, "7.2 Product Thinking", 3),
  },
  {
    id: "m7_q8", module_number: 7, subcategory: "Product Thinking",
    question: "Is there continuous improvement of technology products?",
    level_indicators: rubric(7),
    tags: { function: ["operational", "strategic"], area: ["IT"] },
    framework_citation: cite("m7_q8"),
    provenance: prov(7, "7.2 Product Thinking", 4),
  },

  // ============================================================
  // MODULE 8: Data Analytics, BI & Decision Science
  // ============================================================
  {
    id: "m8_q1", module_number: 8, subcategory: "Analytics Capabilities",
    question: "Are business intelligence tools in use?",
    level_indicators: rubric(8),
    tags: { function: ["operational", "technical"], area: ["IT", "finance", "operations"] },
    framework_citation: cite("m8_q1"),
    provenance: prov(8, "8.1 Analytics Capabilities", 1),
  },
  {
    id: "m8_q2", module_number: 8, subcategory: "Analytics Capabilities",
    question: "Is data accessible for analysis by business users?",
    level_indicators: rubric(8),
    tags: { function: ["operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m8_q2"),
    provenance: prov(8, "8.1 Analytics Capabilities", 2),
  },
  {
    id: "m8_q3", module_number: 8, subcategory: "Analytics Capabilities",
    question: "Are dashboards and reports regularly used for decisions?",
    level_indicators: rubric(8),
    tags: { function: ["operational", "strategic"], area: ["cross_functional"] },
    framework_citation: cite("m8_q3"),
    provenance: prov(8, "8.1 Analytics Capabilities", 3),
  },
  {
    id: "m8_q4", module_number: 8, subcategory: "Analytics Capabilities",
    question: "Is there a data analytics team or function?",
    level_indicators: rubric(8),
    tags: { function: ["operational", "strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m8_q4"),
    provenance: prov(8, "8.1 Analytics Capabilities", 4),
  },
  {
    id: "m8_q5", module_number: 8, subcategory: "Advanced Analytics",
    question: "Is predictive or prescriptive analytics in use?",
    level_indicators: rubric(8),
    tags: { function: ["technical", "strategic"], area: ["IT", "finance", "operations"] },
    framework_citation: cite("m8_q5"),
    provenance: prov(8, "8.2 Advanced Analytics", 1),
  },
  {
    id: "m8_q6", module_number: 8, subcategory: "Advanced Analytics",
    question: "Are analytics models integrated into business processes?",
    level_indicators: rubric(8),
    tags: { function: ["technical", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m8_q6"),
    provenance: prov(8, "8.2 Advanced Analytics", 2),
  },
  {
    id: "m8_q7", module_number: 8, subcategory: "Advanced Analytics",
    question: "Is there a center of excellence for analytics?",
    level_indicators: rubric(8),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m8_q7"),
    provenance: prov(8, "8.2 Advanced Analytics", 3),
  },
  {
    id: "m8_q8", module_number: 8, subcategory: "Advanced Analytics",
    question: "Are analytics outcomes measured and improved?",
    level_indicators: rubric(8),
    tags: { function: ["operational", "strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m8_q8"),
    provenance: prov(8, "8.2 Advanced Analytics", 4),
  },

  // ============================================================
  // MODULE 9: Human Centered Design & Customer Journey
  // ============================================================
  {
    id: "m9_q1", module_number: 9, subcategory: "Design Approach",
    question: "Are user research and testing conducted?",
    level_indicators: rubric(9),
    tags: { function: ["operational", "strategic"], area: ["sales", "marketing", "IT"] },
    framework_citation: cite("m9_q1"),
    provenance: prov(9, "9.1 Design Approach", 1),
  },
  {
    id: "m9_q2", module_number: 9, subcategory: "Design Approach",
    question: "Is there a design thinking process?",
    level_indicators: rubric(9),
    tags: { function: ["operational", "strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m9_q2"),
    provenance: prov(9, "9.1 Design Approach", 2),
  },
  {
    id: "m9_q3", module_number: 9, subcategory: "Design Approach",
    question: "Are customer personas defined and used?",
    level_indicators: rubric(9),
    tags: { function: ["operational"], area: ["sales", "marketing"] },
    framework_citation: cite("m9_q3"),
    provenance: prov(9, "9.1 Design Approach", 3),
  },
  {
    id: "m9_q4", module_number: 9, subcategory: "Design Approach",
    question: "Is UX/UI design integrated in development?",
    level_indicators: rubric(9),
    tags: { function: ["operational", "technical"], area: ["IT"] },
    framework_citation: cite("m9_q4"),
    provenance: prov(9, "9.1 Design Approach", 4),
  },
  {
    id: "m9_q5", module_number: 9, subcategory: "Customer Experience",
    question: "Are customer journeys mapped and optimized?",
    level_indicators: rubric(9),
    tags: { function: ["strategic", "operational"], area: ["sales", "operations"] },
    framework_citation: cite("m9_q5"),
    provenance: prov(9, "9.2 Customer Experience", 1),
  },
  {
    id: "m9_q6", module_number: 9, subcategory: "Customer Experience",
    question: "Is customer feedback systematically collected?",
    level_indicators: rubric(9),
    tags: { function: ["operational", "strategic"], area: ["sales", "operations"] },
    framework_citation: cite("m9_q6"),
    provenance: prov(9, "9.2 Customer Experience", 2),
  },
  {
    id: "m9_q7", module_number: 9, subcategory: "Customer Experience",
    question: "Are CX metrics tracked and acted upon?",
    level_indicators: rubric(9),
    tags: { function: ["strategic", "operational"], area: ["sales", "operations"] },
    framework_citation: cite("m9_q7"),
    provenance: prov(9, "9.2 Customer Experience", 3),
  },
  {
    id: "m9_q8", module_number: 9, subcategory: "Customer Experience",
    question: "Is there cross-functional ownership of customer experience?",
    level_indicators: rubric(9),
    tags: { function: ["strategic", "operational"], area: ["cross_functional", "sales"] },
    framework_citation: cite("m9_q8"),
    provenance: prov(9, "9.2 Customer Experience", 4),
  },

  // ============================================================
  // MODULE 10: Leadership, Business Strategy & Communications
  // ============================================================
  {
    id: "m10_q1", module_number: 10, subcategory: "Leadership Effectiveness",
    question: "Does technology leadership inspire and motivate teams?",
    level_indicators: rubric(10),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m10_q1"),
    provenance: prov(10, "10.1 Leadership Effectiveness", 1),
  },
  {
    id: "m10_q2", module_number: 10, subcategory: "Leadership Effectiveness",
    question: "Are leadership principles defined and modeled?",
    level_indicators: rubric(10),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m10_q2"),
    provenance: prov(10, "10.1 Leadership Effectiveness", 2),
  },
  {
    id: "m10_q3", module_number: 10, subcategory: "Leadership Effectiveness",
    question: "Is there succession planning for technology roles?",
    level_indicators: rubric(10),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m10_q3"),
    provenance: prov(10, "10.1 Leadership Effectiveness", 3),
  },
  {
    id: "m10_q4", module_number: 10, subcategory: "Leadership Effectiveness",
    question: "Are cross-functional relationships strong?",
    level_indicators: rubric(10),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m10_q4"),
    provenance: prov(10, "10.1 Leadership Effectiveness", 4),
  },
  {
    id: "m10_q5", module_number: 10, subcategory: "Strategic Communication",
    question: "Is there regular communication of technology strategy?",
    level_indicators: rubric(10),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m10_q5"),
    provenance: prov(10, "10.2 Strategic Communication", 1),
  },
  {
    id: "m10_q6", module_number: 10, subcategory: "Strategic Communication",
    question: "Are stakeholders engaged in technology decisions?",
    level_indicators: rubric(10),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m10_q6"),
    provenance: prov(10, "10.2 Strategic Communication", 2),
  },
  {
    id: "m10_q7", module_number: 10, subcategory: "Strategic Communication",
    question: "Is business value clearly articulated?",
    level_indicators: rubric(10),
    tags: { function: ["strategic", "financial"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m10_q7"),
    provenance: prov(10, "10.2 Strategic Communication", 3),
  },
  {
    id: "m10_q8", module_number: 10, subcategory: "Strategic Communication",
    question: "Are technology stories used to influence and inspire?",
    level_indicators: rubric(10),
    tags: { function: ["strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m10_q8"),
    provenance: prov(10, "10.2 Strategic Communication", 4),
  },

  // ============================================================
  // MODULE 11: CIDO Organization Structure & Operations
  // ============================================================
  {
    id: "m11_q1", module_number: 11, subcategory: "Team Structure",
    question: "Is the technology organization well-structured?",
    level_indicators: rubric(11),
    tags: { function: ["operational", "strategic"], area: ["IT"] },
    framework_citation: cite("m11_q1"),
    provenance: prov(11, "11.1 Team Structure", 1),
  },
  {
    id: "m11_q2", module_number: 11, subcategory: "Team Structure",
    question: "Are roles and responsibilities clearly defined?",
    level_indicators: rubric(11),
    tags: { function: ["operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m11_q2"),
    provenance: prov(11, "11.1 Team Structure", 2),
  },
  {
    id: "m11_q3", module_number: 11, subcategory: "Team Structure",
    question: "Is there appropriate staffing for strategic goals?",
    level_indicators: rubric(11),
    tags: { function: ["strategic", "operational"], area: ["IT"] },
    framework_citation: cite("m11_q3"),
    provenance: prov(11, "11.1 Team Structure", 3),
  },
  {
    id: "m11_q4", module_number: 11, subcategory: "Team Structure",
    question: "Are team capabilities regularly assessed?",
    level_indicators: rubric(11),
    tags: { function: ["operational", "strategic"], area: ["IT"] },
    framework_citation: cite("m11_q4"),
    provenance: prov(11, "11.1 Team Structure", 4),
  },
  {
    id: "m11_q5", module_number: 11, subcategory: "Operating Model",
    question: "Is there a defined operating model for technology?",
    level_indicators: rubric(11),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m11_q5"),
    provenance: prov(11, "11.2 Operating Model", 1),
  },
  {
    id: "m11_q6", module_number: 11, subcategory: "Operating Model",
    question: "Are processes documented and optimized?",
    level_indicators: rubric(11),
    tags: { function: ["operational"], area: ["IT"] },
    framework_citation: cite("m11_q6"),
    provenance: prov(11, "11.2 Operating Model", 2),
  },
  {
    id: "m11_q7", module_number: 11, subcategory: "Operating Model",
    question: "Is there effective governance?",
    level_indicators: rubric(11),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m11_q7"),
    provenance: prov(11, "11.2 Operating Model", 3),
  },
  {
    id: "m11_q8", module_number: 11, subcategory: "Operating Model",
    question: "Are metrics tracked for team performance?",
    level_indicators: rubric(11),
    tags: { function: ["operational"], area: ["IT"] },
    framework_citation: cite("m11_q8"),
    provenance: prov(11, "11.2 Operating Model", 4),
  },

  // ============================================================
  // MODULE 12: Financial Acumen
  // ============================================================
  {
    id: "m12_q1", module_number: 12, subcategory: "Budgeting & Planning",
    question: "Is there a comprehensive IT budget aligned with strategy?",
    level_indicators: rubric(12),
    tags: { function: ["financial", "strategic"], area: ["IT", "finance"] },
    framework_citation: cite("m12_q1"),
    provenance: prov(12, "12.1 Budgeting & Planning", 1),
  },
  {
    id: "m12_q2", module_number: 12, subcategory: "Budgeting & Planning",
    question: "Are IT costs tracked by category and business unit?",
    level_indicators: rubric(12),
    tags: { function: ["financial", "operational"], area: ["IT", "finance"] },
    framework_citation: cite("m12_q2"),
    provenance: prov(12, "12.1 Budgeting & Planning", 2),
  },
  {
    id: "m12_q3", module_number: 12, subcategory: "Budgeting & Planning",
    question: "Is there multi-year financial planning for technology?",
    level_indicators: rubric(12),
    tags: { function: ["financial", "strategic"], area: ["IT", "finance"] },
    framework_citation: cite("m12_q3"),
    provenance: prov(12, "12.1 Budgeting & Planning", 3),
  },
  {
    id: "m12_q4", module_number: 12, subcategory: "Budgeting & Planning",
    question: "Are budget variances analyzed and explained?",
    level_indicators: rubric(12),
    tags: { function: ["financial", "operational"], area: ["IT", "finance"] },
    framework_citation: cite("m12_q4"),
    provenance: prov(12, "12.1 Budgeting & Planning", 4),
  },
  {
    id: "m12_q5", module_number: 12, subcategory: "Value Demonstration",
    question: "Is ROI calculated for major technology investments?",
    level_indicators: rubric(12),
    tags: { function: ["financial", "strategic"], area: ["IT", "finance"] },
    framework_citation: cite("m12_q5"),
    provenance: prov(12, "12.2 Value Demonstration", 1),
  },
  {
    id: "m12_q6", module_number: 12, subcategory: "Value Demonstration",
    question: "Are business cases required for new initiatives?",
    level_indicators: rubric(12),
    tags: { function: ["financial", "strategic"], area: ["IT", "finance", "cross_functional"] },
    framework_citation: cite("m12_q6"),
    provenance: prov(12, "12.2 Value Demonstration", 2),
  },
  {
    id: "m12_q7", module_number: 12, subcategory: "Value Demonstration",
    question: "Is value realization tracked post-implementation?",
    level_indicators: rubric(12),
    tags: { function: ["financial", "strategic"], area: ["IT", "finance"] },
    framework_citation: cite("m12_q7"),
    provenance: prov(12, "12.2 Value Demonstration", 3),
  },
  {
    id: "m12_q8", module_number: 12, subcategory: "Value Demonstration",
    question: "Is technology spend optimized (FinOps practices)?",
    level_indicators: rubric(12),
    tags: { function: ["financial", "technical", "operational"], area: ["IT", "finance"] },
    framework_citation: cite("m12_q8"),
    provenance: prov(12, "12.2 Value Demonstration", 4),
  },

  // ============================================================
  // MODULE 13: Portfolio & Vendor Management
  // ============================================================
  {
    id: "m13_q1", module_number: 13, subcategory: "Portfolio Management",
    question: "Is there a PMO or portfolio management function?",
    level_indicators: rubric(13),
    tags: { function: ["operational", "strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m13_q1"),
    provenance: prov(13, "13.1 Portfolio Management", 1),
  },
  {
    id: "m13_q2", module_number: 13, subcategory: "Portfolio Management",
    question: "Are all projects tracked in a portfolio system?",
    level_indicators: rubric(13),
    tags: { function: ["operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m13_q2"),
    provenance: prov(13, "13.1 Portfolio Management", 2),
  },
  {
    id: "m13_q3", module_number: 13, subcategory: "Portfolio Management",
    question: "Is portfolio prioritization based on business value?",
    level_indicators: rubric(13),
    tags: { function: ["strategic", "financial"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m13_q3"),
    provenance: prov(13, "13.1 Portfolio Management", 3),
  },
  {
    id: "m13_q4", module_number: 13, subcategory: "Portfolio Management",
    question: "Are project metrics and health monitored?",
    level_indicators: rubric(13),
    tags: { function: ["operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m13_q4"),
    provenance: prov(13, "13.1 Portfolio Management", 4),
  },
  {
    id: "m13_q5", module_number: 13, subcategory: "Vendor Management",
    question: "Is there a vendor management strategy?",
    level_indicators: rubric(13),
    tags: { function: ["financial", "operational", "strategic"], area: ["IT", "finance"] },
    framework_citation: cite("m13_q5"),
    provenance: prov(13, "13.2 Vendor Management", 1),
  },
  {
    id: "m13_q6", module_number: 13, subcategory: "Vendor Management",
    question: "Are vendor relationships formally managed?",
    level_indicators: rubric(13),
    tags: { function: ["financial", "operational"], area: ["IT", "finance"] },
    framework_citation: cite("m13_q6"),
    provenance: prov(13, "13.2 Vendor Management", 2),
  },
  {
    id: "m13_q7", module_number: 13, subcategory: "Vendor Management",
    question: "Are contracts negotiated effectively?",
    level_indicators: rubric(13),
    tags: { function: ["financial", "risk"], area: ["IT", "finance"] },
    framework_citation: cite("m13_q7"),
    provenance: prov(13, "13.2 Vendor Management", 3),
  },
  {
    id: "m13_q8", module_number: 13, subcategory: "Vendor Management",
    question: "Is vendor performance measured and managed?",
    level_indicators: rubric(13),
    tags: { function: ["financial", "operational"], area: ["IT", "finance"] },
    framework_citation: cite("m13_q8"),
    provenance: prov(13, "13.2 Vendor Management", 4),
  },

  // ============================================================
  // MODULE 14: Agile, DevOps & Innovation Management
  // ============================================================
  {
    id: "m14_q1", module_number: 14, subcategory: "Agile Practices",
    question: "Are Agile methodologies used for development?",
    level_indicators: rubric(14),
    tags: { function: ["operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m14_q1"),
    provenance: prov(14, "14.1 Agile Practices", 1),
  },
  {
    id: "m14_q2", module_number: 14, subcategory: "Agile Practices",
    question: "Is there training and coaching for Agile practices?",
    level_indicators: rubric(14),
    tags: { function: ["operational"], area: ["IT"] },
    framework_citation: cite("m14_q2"),
    provenance: prov(14, "14.1 Agile Practices", 2),
  },
  {
    id: "m14_q3", module_number: 14, subcategory: "Agile Practices",
    question: "Are Agile metrics tracked (velocity, burndown, etc.)?",
    level_indicators: rubric(14),
    tags: { function: ["operational"], area: ["IT"] },
    framework_citation: cite("m14_q3"),
    provenance: prov(14, "14.1 Agile Practices", 3),
  },
  {
    id: "m14_q4", module_number: 14, subcategory: "Agile Practices",
    question: "Is Agile scaled across the organization?",
    level_indicators: rubric(14),
    tags: { function: ["operational", "strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m14_q4"),
    provenance: prov(14, "14.1 Agile Practices", 4),
  },
  {
    id: "m14_q5", module_number: 14, subcategory: "DevOps & Innovation",
    question: "Is there CI/CD pipeline automation?",
    level_indicators: rubric(14),
    tags: { function: ["technical", "operational"], area: ["IT"] },
    framework_citation: cite("m14_q5"),
    provenance: prov(14, "14.2 DevOps & Innovation", 1),
  },
  {
    id: "m14_q6", module_number: 14, subcategory: "DevOps & Innovation",
    question: "Are development and operations integrated?",
    level_indicators: rubric(14),
    tags: { function: ["technical", "operational"], area: ["IT"] },
    framework_citation: cite("m14_q6"),
    provenance: prov(14, "14.2 DevOps & Innovation", 2),
  },
  {
    id: "m14_q7", module_number: 14, subcategory: "DevOps & Innovation",
    question: "Is there a culture of experimentation?",
    level_indicators: rubric(14),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m14_q7"),
    provenance: prov(14, "14.2 DevOps & Innovation", 3),
  },
  {
    id: "m14_q8", module_number: 14, subcategory: "DevOps & Innovation",
    question: "Are innovation initiatives funded and supported?",
    level_indicators: rubric(14),
    tags: { function: ["strategic", "financial"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m14_q8"),
    provenance: prov(14, "14.2 DevOps & Innovation", 4),
  },

  // ============================================================
  // MODULE 15: Business Process Transformation & Automation
  // ============================================================
  {
    id: "m15_q1", module_number: 15, subcategory: "Process Management",
    question: "Are key business processes documented?",
    level_indicators: rubric(15),
    tags: { function: ["operational"], area: ["operations", "cross_functional"] },
    framework_citation: cite("m15_q1"),
    provenance: prov(15, "15.1 Process Management", 1),
  },
  {
    id: "m15_q2", module_number: 15, subcategory: "Process Management",
    question: "Is there continuous process improvement?",
    level_indicators: rubric(15),
    tags: { function: ["operational"], area: ["operations", "cross_functional"] },
    framework_citation: cite("m15_q2"),
    provenance: prov(15, "15.1 Process Management", 2),
  },
  {
    id: "m15_q3", module_number: 15, subcategory: "Process Management",
    question: "Are process metrics tracked?",
    level_indicators: rubric(15),
    tags: { function: ["operational"], area: ["operations"] },
    framework_citation: cite("m15_q3"),
    provenance: prov(15, "15.1 Process Management", 3),
  },
  {
    id: "m15_q4", module_number: 15, subcategory: "Process Management",
    question: "Is process redesign aligned with technology?",
    level_indicators: rubric(15),
    tags: { function: ["operational", "strategic", "technical"], area: ["operations", "IT"] },
    framework_citation: cite("m15_q4"),
    provenance: prov(15, "15.1 Process Management", 4),
  },
  {
    id: "m15_q5", module_number: 15, subcategory: "Automation",
    question: "Is RPA or automation technology in use?",
    level_indicators: rubric(15),
    tags: { function: ["technical", "operational"], area: ["operations", "IT"] },
    framework_citation: cite("m15_q5"),
    provenance: prov(15, "15.2 Automation", 1),
  },
  {
    id: "m15_q6", module_number: 15, subcategory: "Automation",
    question: "Are automation opportunities identified systematically?",
    level_indicators: rubric(15),
    tags: { function: ["operational", "strategic"], area: ["operations", "IT"] },
    framework_citation: cite("m15_q6"),
    provenance: prov(15, "15.2 Automation", 2),
  },
  {
    id: "m15_q7", module_number: 15, subcategory: "Automation",
    question: "Is AI used for process automation?",
    level_indicators: rubric(15),
    tags: { function: ["technical", "strategic"], area: ["IT", "operations"] },
    framework_citation: cite("m15_q7"),
    provenance: prov(15, "15.2 Automation", 3),
  },
  {
    id: "m15_q8", module_number: 15, subcategory: "Automation",
    question: "Is automation ROI measured?",
    level_indicators: rubric(15),
    tags: { function: ["financial", "operational"], area: ["operations", "finance"] },
    framework_citation: cite("m15_q8"),
    provenance: prov(15, "15.2 Automation", 4),
  },

  // ============================================================
  // MODULE 16: Future of Work & Workforce Development
  // ============================================================
  {
    id: "m16_q1", module_number: 16, subcategory: "Change Management",
    question: "Is there a change management methodology?",
    level_indicators: rubric(16),
    tags: { function: ["operational", "strategic"], area: ["cross_functional"] },
    framework_citation: cite("m16_q1"),
    provenance: prov(16, "16.1 Change Management", 1),
  },
  {
    id: "m16_q2", module_number: 16, subcategory: "Change Management",
    question: "Are employees prepared for technology changes?",
    level_indicators: rubric(16),
    tags: { function: ["operational"], area: ["cross_functional"] },
    framework_citation: cite("m16_q2"),
    provenance: prov(16, "16.1 Change Management", 2),
  },
  {
    id: "m16_q3", module_number: 16, subcategory: "Change Management",
    question: "Is change adoption measured?",
    level_indicators: rubric(16),
    tags: { function: ["operational"], area: ["cross_functional"] },
    framework_citation: cite("m16_q3"),
    provenance: prov(16, "16.1 Change Management", 3),
  },
  {
    id: "m16_q4", module_number: 16, subcategory: "Change Management",
    question: "Is there leadership support for change?",
    level_indicators: rubric(16),
    tags: { function: ["strategic", "operational"], area: ["cross_functional"] },
    framework_citation: cite("m16_q4"),
    provenance: prov(16, "16.1 Change Management", 4),
  },
  {
    id: "m16_q5", module_number: 16, subcategory: "Talent Development",
    question: "Are skills gaps identified and addressed?",
    level_indicators: rubric(16),
    tags: { function: ["operational", "strategic"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m16_q5"),
    provenance: prov(16, "16.2 Talent Development", 1),
  },
  {
    id: "m16_q6", module_number: 16, subcategory: "Talent Development",
    question: "Is there training and development for technology skills?",
    level_indicators: rubric(16),
    tags: { function: ["operational", "strategic"], area: ["cross_functional"] },
    framework_citation: cite("m16_q6"),
    provenance: prov(16, "16.2 Talent Development", 2),
  },
  {
    id: "m16_q7", module_number: 16, subcategory: "Talent Development",
    question: "Is there a culture of continuous learning?",
    level_indicators: rubric(16),
    tags: { function: ["strategic", "operational"], area: ["cross_functional"] },
    framework_citation: cite("m16_q7"),
    provenance: prov(16, "16.2 Talent Development", 3),
  },
  {
    id: "m16_q8", module_number: 16, subcategory: "Talent Development",
    question: "Are emerging skills (AI, cloud, etc.) being developed?",
    level_indicators: rubric(16),
    tags: { function: ["strategic", "operational"], area: ["IT", "cross_functional"] },
    framework_citation: cite("m16_q8"),
    provenance: prov(16, "16.2 Talent Development", 4),
  },
];

// --- Helper: Get questions for a specific module ---

export function getModuleQuestions(moduleNumber: number): DiagnosticQuestion[] {
  return DIAGNOSTIC_QUESTIONS.filter((q) => q.module_number === moduleNumber);
}

// --- Helper: Get all module numbers ---

export function getModuleNumbers(): number[] {
  return [...new Set(DIAGNOSTIC_QUESTIONS.map((q) => q.module_number))].sort(
    (a, b) => a - b
  );
}

// --- Helper: Whether a module has the new (Phase 1C v2) schema ---
// Used by the assessment UI to decide whether to render the role-filtered
// view + per-question N/A + framework citations + the level-5 indicator,
// or fall back to the legacy 4-level layout.
export function moduleHasV2Schema(moduleNumber: number): boolean {
  const qs = getModuleQuestions(moduleNumber);
  return qs.length > 0 && qs.every((q) => q.tags !== undefined && q.level_indicators.level_5 !== undefined);
}
