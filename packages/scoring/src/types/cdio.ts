// @bos/scoring — CDIO types carved from CDIO/src/types/index.ts (Prompt 3).
// Only the types the maturity engine needs travel; definitions are verbatim.
// METHODOLOGY IP: module names and sequences are founder-ratified — do not reword.

// --- Organization ---

export type OrgSize = "small" | "medium" | "large";

export type Industry =
  | "healthcare"
  | "financial_services"
  | "manufacturing"
  | "professional_services"
  | "retail_ecommerce"
  | "technology"
  | "education"
  | "other";

// --- Module Scores ---

export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

// Maturity Level Definitions (standardized across AI-CDIO, AI-Strategist, AI-OME)
// Level 1: Initial — Ad hoc, reactive, minimal capability
// Level 2: Developing — Some processes, inconsistent execution
// Level 3: Defined — Documented processes, reliable execution
// Level 4: Managed — Measured, controlled, consistent outcomes
// Level 5: Optimizing — Continuous improvement, innovative, industry-leading

/**
 * "na" is the universal escape hatch — added Phase 1C 2026-05-06.
 * Synthesis treats N/A as missing data, never as a low score. Stakeholders
 * who genuinely can't speak to a question must have a way to say so honestly.
 */
export type DiagnosticAnswer = "yes" | "no" | "partial" | "na";

export interface DiagnosticResponse {
  question_id: string;
  question_text: string;
  answer: DiagnosticAnswer;
  evidence?: string;
}

export interface ModuleScore {
  id: string;
  assessment_id: string;
  stakeholder_id: string;
  module_number: number;
  /**
   * NULL when the stakeholder answered N/A on every question or hit the
   * module-gate. Synthesis layer skips NULL rows when computing consensus.
   */
  maturity_score: MaturityLevel | null;
  evidence: string;
  diagnostic_responses: DiagnosticResponse[];
  /**
   * True when the stakeholder hit the module-gate "Can you speak to this
   * area?" and answered N/A. Differentiates explicit module skip from
   * per-question abstention.
   */
  module_skipped: boolean;
  created_at: string;
}

// --- Assessment Synthesis (computed from all stakeholder scores) ---

export type PriorityClass = "top_priority" | "strategic_bet" | "quick_win" | "maintain" | "defer";

export interface AssessmentSynthesis {
  id: string;
  assessment_id: string;
  module_number: number;
  consensus_score: number;          // weighted avg across stakeholders (1.0-5.0)
  divergence_score: number;         // std deviation — high = disagreement
  business_impact: number;          // 1-10 from stakeholder ratings
  priority_rank: number;            // 1-16 ordering
  priority_class: PriorityClass;
  recommended_actions: string[];
}

// --- Divergence (the "politics detector") ---

export interface DivergencePoint {
  module_number: number;
  module_name: string;
  stakeholder_a: { id: string; name: string; score: MaturityLevel; evidence: string };
  stakeholder_b: { id: string; name: string; score: MaturityLevel; evidence: string };
  score_gap: number;
  framework_recommendation: string;
  projected_roi: string;
}

// --- Economic Outcomes ---

/**
 * The five economic outcomes a CEO buys at the SMB stage. The 16 modules
 * are HOW we measure; these five are HOW the CEO consumes the result.
 *
 * Every module declares ONE primary outcome it produces (modules can
 * touch others, but every module owns one). The roadmap output and
 * pain-point entry are grouped by these outcomes, not by module.
 */
export type EconomicOutcome =
  | "make_money"      // top-line: revenue, margin, retention
  | "save_money"      // cost takeout: SaaS, vendor, cloud, FinOps
  | "save_time"       // productivity: automation, delivery velocity
  | "preserve_money"  // risk to cash already earned: security, compliance
  | "preserve_time";  // avoid wasted hours: incidents, rework, firefighting

/**
 * Better/cheaper/faster proof claim, attached to every initiative produced
 * after the outcome reframe. Forces the strategy agent to declare WHY
 * each recommendation beats the CEO's alternatives (DIY, big consultancy,
 * full-time hire). Optional on persisted older roadmaps.
 */
export interface InitiativeProof {
  /** Why this approach is better than the alternative. One sentence. */
  better: string;
  /** Why this approach is cheaper. Concrete cost delta where possible. */
  cheaper: string;
  /** Why this approach is faster. Concrete time delta where possible. */
  faster: string;
}

export interface Initiative {
  id: string;
  roadmap_id: string;
  module_numbers: number[];
  title: string;
  description: string;
  priority_class: PriorityClass;
  value_score: number;    // 1-10
  effort_score: number;   // 1-10
  status: "planned" | "in_progress" | "completed" | "deferred";
  start_date?: string;
  end_date?: string;
  expected_roi?: string;
  owner?: string;
  /**
   * Primary economic outcome this initiative produces. Used by the UI to
   * group the roadmap into the five CEO-facing buckets. Optional for
   * backward compatibility with roadmaps generated before the reframe.
   */
  outcome?: EconomicOutcome;
  /**
   * Better/cheaper/faster proof. Populated by the strategy agent. Optional
   * for backward compatibility with roadmaps generated before the reframe.
   */
  proof?: InitiativeProof;
  /**
   * Hard-dollar quick-win anchor when one exists. Free-form so the agent
   * can say "$30K-$60K annual SaaS savings" or "10 hrs/week reclaimed at
   * $50/hr blended = $26K/yr." When present, the UI shows this prominently
   * instead of the abstract priority class.
   */
  dollar_anchor?: string;
}

// --- Module Definitions ---

export interface ModuleMeta {
  /** Outcome-led name shown across the UI. */
  name: string;
  /** Plain-English one-liner — what this module asks of the organization. */
  oneLiner: string;
  /** Anchor framework(s) — surfaced as authority in the workspace tooltip. */
  framework: string;
  /** Primary economic outcome this module produces. Used to group roadmap output for CEO consumption. */
  outcome: EconomicOutcome;
}

export const MODULE_META: Record<number, ModuleMeta> = {
  1: {
    name: "Technology Leadership at the Top",
    oneLiner: "Is there a real seat at the executive table for technology?",
    framework: "Gartner CIO Leadership Model",
    outcome: "make_money",
  },
  2: {
    name: "Tech Strategy & Business Alignment",
    oneLiner: "Is your technology strategy actually aligned with where the business is going?",
    framework: "KPMG 4-Practice Alignment + MIT Strategic Alignment Model",
    outcome: "make_money",
  },
  3: {
    name: "Tech Foundation & Modernization",
    oneLiner: "Is your tech foundation working with you or against you?",
    framework: "TOGAF (lite) + Gartner Application Modernization",
    outcome: "preserve_money",
  },
  4: {
    name: "Cloud & Infrastructure",
    oneLiner: "Is your cloud spend disciplined and your infrastructure resilient?",
    framework: "AWS Well-Architected + FinOps Foundation",
    outcome: "save_money",
  },
  5: {
    name: "Security, Risk & Compliance",
    oneLiner: "Are you protecting the business, or hoping nothing happens?",
    framework: "NIST CSF v2.0 + CMMI",
    outcome: "preserve_money",
  },
  6: {
    name: "Data & AI Capabilities",
    oneLiner: "Is your data ready to power AI, or is AI exposing a data problem?",
    framework: "NIST AI RMF + DAMA-DMBOK",
    outcome: "make_money",
  },
  7: {
    name: "Platforms, APIs & Digital Products",
    oneLiner: "Are your systems connected enough to create digital revenue?",
    framework: "TOGAF Integration + Postman API Maturity",
    outcome: "make_money",
  },
  8: {
    name: "Analytics & Data-Driven Decisions",
    oneLiner: "Are you making decisions on data, or on gut feel dressed up as data?",
    framework: "Gartner Analytics Maturity Model",
    outcome: "make_money",
  },
  9: {
    name: "Customer Experience & Journey",
    oneLiner: "Do you know what your customer feels at every touchpoint, and is it improving?",
    framework: "Forrester CX Index + Service Design Network",
    outcome: "make_money",
  },
  10: {
    name: "Executive Communication & Influence",
    oneLiner: "Does technology have a voice the rest of the executive team listens to?",
    framework: "HBR Leadership + IT-CMF",
    outcome: "make_money",
  },
  11: {
    name: "IT Team Structure & Operations",
    oneLiner: "Is your IT team set up to deliver, or set up to firefight?",
    framework: "ITIL 4",
    outcome: "preserve_time",
  },
  12: {
    name: "Tech Finance & Value Realization",
    oneLiner: "Do you know what your technology costs and what it returns?",
    framework: "TBM Council + KPMG Return on Objectives",
    outcome: "save_money",
  },
  13: {
    name: "Portfolio, Vendors & SaaS Spend",
    oneLiner: "Are you running your vendor portfolio, or is it running you?",
    framework: "Gartner ITPPM + SaaS Optimization",
    outcome: "save_money",
  },
  14: {
    name: "Delivery, DevOps & Innovation",
    oneLiner: "How fast can you ship a working change to your customer?",
    framework: "DORA Metrics + SAFe",
    outcome: "save_time",
  },
  15: {
    name: "Process Automation & Transformation",
    oneLiner: "Where is human time being wasted on work a machine could do reliably?",
    framework: "APQC PCF + Lean Six Sigma",
    outcome: "save_time",
  },
  16: {
    name: "Workforce, Skills & Change",
    oneLiner: "Is your team ready for the technology you're rolling out?",
    framework: "Prosci ADKAR + Kotter 8-Step",
    outcome: "preserve_time",
  },
};

/**
 * Backwards-compatible export. Many call sites still import MODULE_NAMES;
 * they keep working because the surface is unchanged.
 */
export const MODULE_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(MODULE_META).map(([k, v]) => [Number(k), v.name])
) as Record<number, string>;

// --- Org Size Priority Sequences (from adaptation guide) ---

export const SIZE_PRIORITY_SEQUENCES: Record<OrgSize, number[]> = {
  small: [5, 15, 4, 12, 2],        // Security → Automation → Cloud → Finance → Strategy
  medium: [2, 11, 8, 15, 14, 5],   // Strategy → Org → Analytics → Automation → Agile → Security
  large: [3, 10, 13, 6, 16, 7],    // Architecture → Leadership → Portfolio → Data/AI → Change → Ecosystems
};
