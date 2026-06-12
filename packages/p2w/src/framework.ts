// Framework constants — single source of truth for the cascade, checklists, and 7 RE categories.
// CLIENT-SAFE: no node-only imports. The fs-backed loader lives in framework.server.ts.

export type CascadeBox =
  | "ASPIRATION"
  | "WHERE_TO_PLAY"
  | "HOW_TO_WIN"
  | "CAPABILITIES"
  | "MGMT_SYSTEMS";

export const CASCADE_ORDER: CascadeBox[] = [
  "ASPIRATION",
  "WHERE_TO_PLAY",
  "HOW_TO_WIN",
  "CAPABILITIES",
  "MGMT_SYSTEMS",
];

export const CASCADE_META: Record<
  CascadeBox,
  { title: string; question: string; checklist: { key: string; label: string; help: string }[] }
> = {
  ASPIRATION: {
    title: "Winning Aspiration",
    question: "What is our guiding purpose — what does winning look like?",
    checklist: [
      { key: "consumer_centric", label: "Consumer-centric", help: "Starts with the value provided to people, not money." },
      { key: "competitive", label: "Competitive dimension", help: "Defines who we are winning against." },
      { key: "specific", label: "Specific & concrete", help: "Could not plausibly fit every other company in the industry." },
      { key: "ambitious", label: "Ambitious", help: "Forces difficult choices and inspires the org." },
    ],
  },
  WHERE_TO_PLAY: {
    title: "Where to Play",
    question: "On which playing field — and explicitly, where will we NOT play?",
    checklist: [
      { key: "geography", label: "Geography defined", help: "Specific regions where incumbents under-serve." },
      { key: "product", label: "Product / job-to-be-done", help: "The specific job and which offerings are incapable of it." },
      { key: "segment", label: "Consumer segment", help: "Unarticulated tensions / pain points beyond demographics." },
      { key: "channel", label: "Channel", help: "Where friction in the journey can become a barrier to entry." },
      { key: "vertical", label: "Vertical stage", help: "The stage of the value chain we have the right to own." },
      { key: "where_not", label: "Where NOT to play", help: "Explicit list of fields we are forfeiting." },
    ],
  },
  HOW_TO_WIN: {
    title: "How to Win",
    question: "What is our value proposition and the source of advantage on this field?",
    checklist: [
      { key: "path", label: "Cost or differentiation chosen", help: "One dominant path; mixing them collapses advantage." },
      { key: "distinct", label: "Distinct from rivals", help: "Hard to copy and structurally reinforced." },
      { key: "wtp_fit", label: "Tightly bound to Where-to-Play", help: "Recipe matches the chosen field." },
      { key: "customer_value", label: "Customer-perceived value", help: "Articulated benefit a real buyer would recognize." },
    ],
  },
  CAPABILITIES: {
    title: "Core Capabilities",
    question: "What reinforcing activities must we excel at to deliver the How-to-Win?",
    checklist: [
      { key: "activity_system", label: "Reinforcing activity system", help: "Capabilities reinforce each other." },
      { key: "verbed", label: "Stated as active verbs", help: "Things we DO, not nouns we have." },
      { key: "scarce", label: "Hard to replicate", help: "Structurally difficult for rivals to copy." },
      { key: "covered", label: "Coverage of HTW", help: "Every HTW promise has a capability backing it." },
    ],
  },
  MGMT_SYSTEMS: {
    title: "Management Systems",
    question: "What rules, measures, and processes will sustain and adjust the strategy?",
    checklist: [
      { key: "dialogues", label: "Strategy dialogues", help: "Forum that converts plans into a feedback loop." },
      { key: "innovation", label: "Innovation reviews", help: "Pipeline prioritized by HTW, not vanity." },
      { key: "talent", label: "Talent assessments", help: "Muscle mapped to required capabilities." },
      { key: "budget", label: "Budgeting redirects capital", help: "Resources flow from status quo to winning choices." },
    ],
  },
};

export type ReCategory =
  | "SEGMENTS"
  | "STRUCTURE"
  | "CHANNELS"
  | "END_CUSTOMERS"
  | "CAPABILITIES"
  | "COSTS"
  | "REACTION";

export const RE_CATEGORIES: { key: ReCategory; label: string; standardOfProof: string }[] = [
  { key: "SEGMENTS", label: "Segments", standardOfProof: "Primary research showing the target segment is large enough and willing to pay to support our margin requirements." },
  { key: "STRUCTURE", label: "Structure", standardOfProof: "Analysis showing entry barriers are high enough to prevent rapid commoditization by fast-followers." },
  { key: "CHANNELS", label: "Channels", standardOfProof: "Data showing buyers will allocate space / attention for the offering at the proposed price." },
  { key: "END_CUSTOMERS", label: "End Customers", standardOfProof: "End-users perceive the differentiated benefit as significantly superior to the best competitor." },
  { key: "CAPABILITIES", label: "Capabilities", standardOfProof: "Internal activity system can perform the required tasks at a level rivals cannot replicate." },
  { key: "COSTS", label: "Costs", standardOfProof: "Cost structure allows attractive returns even if competitors initiate a price war." },
  { key: "REACTION", label: "Reaction", standardOfProof: "Modeled scenario where competitor responses are too slow or too localized to neutralize advantage." },
];

export const TEST_LEVELS = [
  { key: "GUERRILLA", label: "Guerrilla-style", help: "Very low cost / fast — sniff test from existing data." },
  { key: "SMALL_SCALE", label: "Small-scale", help: "Moderate cost — pilots / new data on specific attributes." },
  { key: "DEFINITIVE", label: "Definitive", help: "High cost / slower — full in-market simulation." },
];

export function computeConfidence(checklist: Record<string, boolean>, box: CascadeBox): number {
  const meta = CASCADE_META[box];
  if (!meta) return 0;
  const total = meta.checklist.length;
  if (total === 0) return 0;
  const yes = meta.checklist.filter((c) => checklist[c.key]).length;
  return Math.round((yes / total) * 100);
}
