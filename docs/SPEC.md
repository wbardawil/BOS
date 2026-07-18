# SPEC v0.8 — The Digital Chief of Staff
## A Chief of Staff's hands with a CSIO's brain: strategy, operating model, technology decisions, and execution alignment in one workspace

**Version:** 0.8 · 2026-06-11 · supersedes v0.1–v0.7 (consolidated rewrite — one document, one idea)
**⚠ Extended by `SPEC-ADDENDUM.md` (v0.9, 2026-07-17):** AI-OS vision, the connect→audit→prioritize loop, org-based pricing, coach-led GTM, hypotheses H1–H8, new screens + schema. Read both.
**Owner:** Wadi Bardawil
**North-star outcome:** $30M+ founder net worth at Year 5 via strategic exit. Bootstrapped; ≤30% dilution only as late accelerant. Stretch: $12M revenue Years 3–5 (§9.1).
**Founder role:** Customer #1 from week 1, closer, product designer, CEO.
**Runway:** 4 months → V1 must serve the founder's paying engagements immediately.
**Brand:** **BDS — Business Design Shop** (decided 2026-06-11). Repo: `github.com/wbardawil/BOS`. "DECIDE" stays as the M4 method name.

---

## 0. The product in one sentence

> **A Digital Chief of Staff: the AI workspace that orchestrates a company's executive function — strategy set and challenged, operating model measured, technology decisions made well, initiatives executed with alignment — doing the work of a $150–300K/yr Chief of Staff, powered by the methodology of a Chief Strategy & Information Officer, at 2–5% of the cost.**

---

## 1. Chief of Staff vs. CSIO — the distinction that defines the architecture

The founder spent his career becoming a Chief Strategy & Information Officer. The product is not that role digitized — it's the role that *supports* it, carrying its brain.

| | **Chief of Staff** | **Chief Strategy & Information Officer** |
|---|---|---|
| Owns | The executive *system*: cadence, follow-through, decision tracking, cross-functional alignment, board prep, communication flow | Two *functions*: strategy formation (aspiration, choices, operating model) + technology (IT decisions, vendors, digital initiatives) |
| Authority | Borrowed — acts in the CEO's name, decides nothing alone | Own — a C-level peer who makes the calls |
| Daily output | Nothing falls through the cracks; everyone aligned; meetings produce decisions; decisions produce action | The strategy itself, and the technology that enables it |
| Failure mode without them | Drift, dropped balls, strategy decay between sessions | Wrong strategy, bad tech bets, no transformation |

**The synthesis — and the product thesis:**

> **The agentic layer performs the Chief of Staff function. The methodology libraries and AI advisor carry the CSIO's brain. The human keeps the judgment.**

- For **consultants** (segment 1): the consultant *is* the CSIO; the product is the Chief of Staff they never had — orchestrating every client engagement.
- For **executives** (segment 2): the CEO keeps judgment and authority; the product is the CoS they can't afford ($150–300K/yr human) plus fractional-CSIO-grade methodology in the advisor.
- For **the founder personally:** the role he was pushing to become is the archetype encoded in the product. His CSIO methodology becomes the brain; the agents become the hands. He stops selling his hours as either role.

**Positioning consequence:** "Digital Chief of Staff" is the category (instantly understood, painfully priced in the buyer's mind). "With a CSIO brain — strategy, operating model, and technology decisions built in" is the differentiator vs. any generic CoS/productivity tool.

---

## 2. The core model: the Strategy Triangle (carried from v0.6, unchanged)

```
                    STRATEGY
            (winning aspiration,
          where-to-play / how-to-win,
            testable assumptions)
                   ▲       ▲
                  ╱           ╲
                 ╱  CHALLENGE  ╲
                ╱     LOOP      ╲
               ▼                 ▼
   OPERATING MODEL ◄──────► INITIATIVES
   (capabilities, mgmt        (the weapons: few,
    systems, dashboards)       WIP-capped, linked)

      CADENCE = the heartbeat (weekly/daily)
      run by the Chief of Staff agents
```

**Three design laws:**
1. **Enter anywhere** — failing initiative, messy operating model, or strategy refresh. No vertex is a prerequisite.
2. **Independent but interconnected** — each vertex matures on its own; edges carry the relationships; full linkage (a de facto cascade) is a state to converge toward, never a gate.
3. **Loose first, strict later** — unlinked objects flagged, never blocked. The Coherence Score measures convergence.

**Explicitly outside:** task management, tickets, sprints, Gantt charts. PM lives in the client's existing tools (read-sync at most). The boundary IS the category.

---

## 3. Signature mechanics

### 3.1 The Challenge Loop
When cadence data shows a miss, traverse the edges upward: execution problem → initiative problem → operating-model problem → assumption broken → **aspiration itself wrong**. Symmetrically on wins: "is this a strategic edge to 10x?" The founder's two-rail philosophy (10x what works / root-cause what's broken, both terminating in fundamentals) is the loop's engine. Strategy is a hypothesis under permanent test.

### 3.2 The Coherence Score
Measured strategic integrity: % initiatives anchored to choices, % metrics tied to assumptions, % assumptions under test, recency of aspiration challenge. Nudges, never blocks. The consultant's renewal story in one number.

### 3.3 The Agentic Execution Layer (the "Chief of Staff hands")

| Phase | Capability | Examples |
|---|---|---|
| **V1** Chat + drafting | Vertex-aware advisor; drafts artifacts, agendas, minutes; challenges weak choices | "Draft the board readout from this month's cadence" |
| **V2** Working agents | Execute between sessions with approval gates: follow-ups to decision owners, meeting documentation into the decision log, evidence collection for assumption tests, solution/vendor research, orphan detection | "Initiative 3's owner is 9 days silent — nudge drafted, awaiting your approval" |
| **V3** Autonomous cadence agent | The full digital CoS: prepares every session, chases inputs, updates dashboards, raises Challenge flags, maintains coherence — human approval on anything outbound | The forcing function that makes segment 2 (executive direct) viable |

### 3.4 The headline promise: technology and initiative success rate
The CDIO module's founding promise, now the platform's paramount instrumented claim: **work run through this workspace succeeds at a measurably higher rate than baseline** (baseline is public and grim: 34% of software buyers avoid disruption/regret — Capterra 2026; most transformations fail). Telemetry from day one; target public claim by Year 2: "≥2x baseline," published quarterly as the *State of Strategic Execution* report. Simultaneously the marketing engine, renewal argument, moat, and exit-diligence asset.

---

## 4. The six modules (resolving the three repos into one architecture)

The three prior codebases were each one piece of the triangle. The product is the triangle. Mapping:

| # | Module | Vertex | What it does | Source |
|---|---|---|---|---|
| M1 | **Strategy Studio** | Strategy | Play-to-Win cascade: aspiration, choices, WWHTBT assumptions with test status | **P2W-OS** (methodology layer audited complete: framework.ts, exemplars, mid-market coach persona) |
| M2 | **Operating Model** | Operating Model | Diagnostics (128-question cited bank + 82 practices), maturity scoring, capability dashboards trending vs. aspiration | **CDIO** (question bank + citations + scoring engine) + **bds-OS** (practices, OPI engine) |
| M3 | **Initiative Portfolio** | Initiatives | WIP-capped portfolio, prioritization, dollar-anchored initiative records linked to choices | **bds-OS** (focus-portfolio engine, lifecycle weights) |
| M4 | **DECIDE** | Initiatives/Decisions | Technology & vendor decisions: 6-stage method, machine-readable vendor corpus, BATNA, contract red-flags, TCO | **CDIO** (tech-eval agent) + new corpus build. Also the Capterra-validated acquisition wedge + Year-2 API/data product |
| M5 | **Cadence & Decisions** | Heartbeat | Sessions, agendas, minutes, decision log with rationale, follow-up orchestration — the CoS agents' home | **New build** (memory patterns referenced from confident-mind-coach) |
| M6 | **Artifact Engine** | Output | Board decks, readouts, strategy one-pagers — generated, versioned, branded per consultant/firm | **New build** |

Cross-cutting: AI Advisor (all modules), Challenge Loop + Coherence (edges), agent runtime (M5-centered, reaches everywhere), usage metering (everything).

---

## 5. Users and segments

| Segment | User | Price logic | Sequence |
|---|---|---|---|
| 1. **Consultants / fractional CXOs** | Runs 3–8 client workspaces; the consultant is the CSIO, the product is their CoS | Saves 5–10 prep hrs/client/month; <1 billable hour | **First** — months 1–9, founder's 12K LinkedIn is the audience |
| 2. **C-level at $20M–$150M companies** | CEO/CSO/CIO runs strategy in-house; V3 agent is the CoS forcing function | 2–5% of a human CoS; substitutes advisor spend they can't afford | **Phase 3** — gated on V3 agents working (else abandoned-tool failure mode) |
| Beneficiaries | Leadership teams (view/contribute portal seats) | Clarity is the renewal driver | Both segments |

---

## 6. Pricing and the TRUE cost model

### 6.1 The pricing structure: subscription + included credits + metered usage (both, always)

Every tier carries BOTH components — base subscription (predictable revenue, covers fixed costs) and usage metering (covers variable AI burn, captures upside from heavy users). No unlimited-AI tier exists at any price: an uncapped agent loop on a large document corpus can burn hundreds of dollars per month, and pricing must make that impossible to lose money on.

| Tier | Base/mo | Included credits (≈ token COGS covered) | Overage price | Hard cap |
|---|---|---|---|---|
| **Solo Consultant** | $299 | $40 COGS ≈ typical 3-workspace advisor+agent load | $25 per $10 COGS block (~60% margin) | User-set, default $150/mo |
| **Practice** (4–15 workspaces) | $999 | $150 COGS pooled | Same block pricing | Default $500/mo |
| **Firm** | $2,500+ | $400 COGS pooled | Negotiated | Custom |
| **Executive** (segment 2) | $749 | $80 COGS (V3 cadence agent daily) | Same blocks | Default $300/mo |
| Portal contributor seats | $49/seat | Marginal | — | — |
| Founder DFY engagements | $5–15K fixed | N/A (COGS absorbed, ~$200–400/engagement) | — | — |

### 6.2 Token economics — the actual math (2026 model pricing: Haiku-class ~$1/$5 per M in/out, Sonnet-class ~$3/$15, Opus-class reserved)

| Action | Tokens (in/out) | Model | Cost/action | Volume/workspace/mo | Cost/workspace/mo |
|---|---|---|---|---|---|
| Advisor chat turn | 5–15K / 1K (workspace context **prompt-cached**) | Sonnet | $0.01–0.04 (cached) | 150 turns | $2–6 |
| Artifact generation (deck/readout) | 30–80K / 5–10K | Sonnet | $0.20–0.50 | 8 | $2–4 |
| Agent run (follow-up batch, evidence chase) | 20–50K / 2–5K | **Haiku** (routine) | $0.03–0.10 | 40 runs | $1–4 |
| V3 daily cadence agent | 30–60K / 3–6K | Haiku + Sonnet escalation | $0.10–0.30/day | 30 days | $3–9 |
| RAG/embeddings | — | embedding model | negligible | — | <$1 |
| **Typical workspace total** | | | | | **$8–24/mo** |
| **Heavy workspace (V3 + artifact-loop power user)** | | | | | **$40–90/mo** |

**Cost engineering levers (mandatory, not optional):**
1. **Prompt caching** — workspace state is highly repetitive across turns; cached input is ~90% cheaper. This single lever cuts advisor costs 5–10x.
2. **Model routing** — Haiku for ~80% of agent actions (follow-ups, documentation, formatting); Sonnet for strategy reasoning; Opus-class only for flagship artifacts. (Pattern proven in confident-mind-coach: structured flows on Haiku, depth on demand.)
3. **Batch API** — overnight agent runs (follow-up batches, evidence collection) at 50% discount; perfect fit since CoS work between sessions isn't latency-sensitive.
4. **Context budgets** per action type; summarized memory instead of raw transcripts (CMC session-summary pattern).
5. **Per-account cost telemetry from day 1** (CMC usage-logger lifted near-verbatim): burner detection, cap enforcement, margin-per-account visible weekly.

### 6.3 Per-account P&L (steady state)

| Tier | Revenue/mo | Token COGS | Infra (Supabase/Vercel/storage) | Support alloc | **Gross margin** |
|---|---|---|---|---|---|
| Solo ($299 + avg $30 usage) | $329 | $25–60 | $10–20 | $15 | **71–85%** |
| Practice | $1,100 avg | $90–250 | $40–80 | $40 | **67–84%** |
| Executive ($749 + usage) | $800 avg | $40–110 | $15–30 | $25 | **79–90%** |

**Blended target: ≥75% gross margin, with usage overage itself sold at ~60% margin.** A power user burning tokens is *profitable by construction*, not a risk — that is the entire point of the dual structure.

### 6.4 Company P&L sketch

| | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---|---|---|---|---|
| Revenue | $250K | $1.2M | $4.6M | $8M | $14M |
| Gross profit (~78–82%) | $200K | $950K | $3.7M | $6.4M | $11.2M |
| OpEx (team, GTM, tools) | $75K | $350K | $1.3M | $2.7M | $4.5M |
| **EBITDA** | **$125K** | **$600K** | **$2.4M** | **$3.7M** | **$6.7M** |
| Margin | 50% | 50% | 52% | 46% | 48% |

Break-even: Month 5–7 (DFY engagements bridge the SaaS ramp — they're the runway, matching the founder's existing fractional practice).

---

## 7. Tech stack & architecture (one platform, finally)

```
CLIENT LAYER — Next.js 15 + React 19 + Tailwind (single app, three surfaces)
  ├─ Consultant console (multi-workspace switcher)
  ├─ Executive workspace (single-company, V3 agent prominent)
  └─ Leadership portal (view/contribute)

APPLICATION LAYER — the six modules (§4)
  M1 Strategy Studio · M2 Operating Model · M3 Initiative Portfolio
  M4 DECIDE · M5 Cadence & Decisions · M6 Artifact Engine

INTELLIGENCE LAYER
  ├─ AI Advisor — vertex-aware chat (Anthropic SDK, prompt-cached workspace context)
  ├─ Agent runtime — V2/V3 agents with approval gates (Inngest for scheduled/queued jobs)
  ├─ Challenge Loop engine + Coherence scoring (pure TS, testable)
  ├─ Model router — Haiku/Sonnet/Opus by action class + batch queue for overnight runs
  ├─ Methodology packages — @os/methodology · @os/scoring · @os/p2w (extracted, tested)
  ├─ RAG — pgvector embeddings: workspace docs + machine-readable vendor corpus
  └─ Usage metering + cost telemetry (per-account ledger; CMC usage-logger pattern)

DATA LAYER — Supabase Postgres
  ├─ TRUE row-level security (DB-level multi-tenancy — non-negotiable, unlike CDIO's app-layer model)
  ├─ pgvector · object storage (docs/artifacts) · token usage ledger
  └─ Decision log + cadence events as the system of record

INFRA & SERVICES
  Vercel (hosting) · Clerk (auth: consultants, executives, portal seats)
  Stripe (subscriptions + metered usage billing) · Inngest (agent jobs/cron)
  Langfuse (LLM observability) · Sentry (errors) · Resend (email)
```

**Why this resolves the "three different ideas" struggle:** CDIO, P2W-OS, and bds-OS were each one vertex built as a standalone app, each with its own shell, auth, and schema — that's why the architecture never converged. Here there is ONE shell (this stack), ONE data model (the triangle's objects + edges), and the three codebases contribute *content and engines* (M1–M4 sources), not architecture. The architecture is new; the IP is inherited.

---

## 8. Why this wins

- **Category instantly understood, brutally anchored:** every CEO knows what a Chief of Staff is and what one costs ($150–300K/yr loaded). $749/mo is 2–5% of that. No category education needed.
- **Structurally whitespace:** Cascade/Quantive = team OKR execution (consolidating); Coda/Notion = generic containers; Copilot = horizontal. A CoS-function workspace with CSIO methodology, a Challenge Loop, and a success-rate dataset exists nowhere we found (scans 2026-06-11).
- **Founder-product fit exact:** his daily pain (scattered strategic work), his strengths (closing + product design — no mass recruiting, no daily-content-forever dependence), his 12K LinkedIn (loaded with the segment-1 buyer), his engagements as dogfood day one.
- **Foundation models are the engine, not the threat:** the moat is what models can't be — years of client strategic state, methodology libraries, the success-rate dataset, the trust relationship. Real risk = Microsoft bundling a "strategy agent" into Teams; window ≈ 18–24 months; ship state-accumulating features first.
- **Agentic-buying trend rides along:** M4's machine-readable corpus is the Year-2+ API/data play (Gartner: 90% of B2B buying agent-intermediated by 2028; 69% of buyers want humans validating AI output — the consultant IS that validation layer).

---

## 9. Revenue bridge

| | Year 1 | Year 2 | Year 3 | Year 5 (exit window) |
|---|---|---|---|---|
| Founder DFY engagements | $120–250K | $150–300K (capped) | $200–300K (flagship) | — |
| Consultant SaaS | $30–80K (20–50 paying) | $400–900K (120–250) | $1.5–3M (350–700) | $5–8M ARR |
| Executive tier (opens Phase 3) | — | $50–200K (design partners → 20–40) | $400K–1.2M (60–150) | $2–5M ARR |
| Agent usage overage (10–20% of subs) | — | $50–120K | $250–500K | $1–2M |
| Portal seats | — | $50–150K | $200–500K | $0.7–1.5M |
| DECIDE corpus API (Year 2+ gate) | — | $0–100K | $300–800K | $1–3M |
| **Total** | **$150–330K** | **$0.7–1.8M** | **$2.9–6.3M** | **$10–19M run-rate** |
| Exit at 5–7× ARR | | | | **$50–110M → founder post-tax: $28–60M** |

Probability: $30M+ net ≈ 25–35% · $15M+ ≈ 50% · founder's "keep pushing" floor ($2–3M) maps to Year 3.

### 9.1 What would have to be true for $12M in Years 3–5 (the founder's WWHTBT)

Composition that closes: ~1,500 consultants × $4.2K/yr + ~300 Executive × $15K/yr + usage/API/portal ≈ $12M.

| # | What would have to be true | Evidence today | Cheapest test | When |
|---|---|---|---|---|
| 1 | ~1,500 consultants pay ~$350/mo blended as system-of-work | Pain validated anecdotally; zero paying | 15 pitches wks 1–2; 10 paying by M5 | M5 |
| 2 | ~300 C-levels run cadence WITHOUT consultant — V3 agent suffices as forcing function | **Weakest assumption**; unforced tools get abandoned | 5 design-partner CEOs; 90-day cadence adherence | M9–12 |
| 3 | Content+PLG yields 80–120 new accounts/mo by Y3, CAC payback <6 mo | 12K LinkedIn, no funnel yet | Funnel telemetry from M3 (≥3% trial→paid) | M6 |
| 4 | Churn ≤3%/mo; NRR ≥105% | None; consultant SaaS runs hot | M6–9 cohort curves; Monday-habit metric | M9 |
| 5 | Agents deliver the ≥2x success-rate promise | Agents exist in repos; pipeline unproven | Founder's own engagements ≥70% on-track by M6 | M6 |
| 6 | Microsoft/horizontal suites don't capture the niche for 18–24 mo | No consultant-led CoS workspace exists today | Quarterly scan; state-accumulation first | Ongoing |
| 7 | GM ≥75% with tokens covered by usage pricing | §6.2 model says yes; unproven in production | Per-account cost ledger from day 1 | M3 |

All seven by Year 3 ≈ 5–10%. By Year 5 ≈ 25–35% — exactly the $30M-exit case. The plan doesn't depend on $12M; #2 and #5 are the swing factors and are tested earliest and cheapest.

---

## 10. Build plan (4-month runway, gate-based)

| Phase | When | Work | Gate |
|---|---|---|---|
| **0a. Dogfood skeleton** | Wks 1–6 | V0 workspace for founder's OWN 2–3 engagements: triangle view, object CRUD, cadence log, artifact export. Ugly fine; real client data day one | Founder runs 2 real weekly sessions and prefers it to PowerPoint |
| **0b. Demand test** (parallel) | Wks 1–4 | 1-page concept + 4-min Loom ("my Monday: PowerPoint vs. workspace") + landing page + **founding-member pre-sale: 10 spots, $99–149/mo for life, billing starts M3** + 20 DMs to warmest LinkedIn consultants | **≥5 paid founding members in 30 days.** 2–4 = soft, tighten positioning. 0–1 = stop and reposition before runway closes |
| **1. First paying cohort** | M3–5 | Multi-tenant (true RLS), onboarding, AI advisor V1, M1+M2 wired, usage metering live | 10 paying; ≥7 run a real client session within 30 days |
| **2. The loop + agents** | M6–9 | Challenge Loop, Coherence Score, M6 artifacts, M4 DECIDE v1, **V2 working agents with approval gates** | 40+ paying; churn <5%/mo; NPS ≥50; agent actions ≥30% of activity |
| **3. Executive tier** | M10–18 | Practice/Firm tiers, portal seats, **V3 cadence agent + 5 design-partner CEOs**, corpus API pilots | $50K+ MRR; ≥3/5 design partners adhere to 90-day cadence; ≥1 paid API pilot |
| **4. Exit-readiness** | Y2–5 | Clean financials, IP chain, concentration <15%, diligence-grade telemetry | Term-sheet conversations Y4+ |

**Kill criteria:** Wk 4 founding-member test (above) · M5 <10 paying → pricing/ICP wrong, DFY becomes primary while fixing · M9 churn >8%/mo → fatal, stop scaling, fix Monday-habit loop · Founder not using it weekly on own clients by day 60 → product isn't real, stop.

---

## 11. Repo strategy (carried from v0.4/0.6, unchanged in substance)

- **New monorepo** (name pending brand), US-LLC-owned day 1. Turborepo + the §7 stack.
- **Extract:** `@os/methodology` (CDIO bank + citations) · `@os/scoring` (CDIO maturity + bds-OS engines, canonical + tested) · `@os/p2w` (P2W-OS layer) · `@os/agents` (CDIO agents refactored) · AI-infra patterns from confident-mind-coach (usage logger ~verbatim; flow shell + memory as reference).
- **Archive after extraction:** CDIO, bds-OS, P2W-OS. Freeze strategy-spark-86. Drop gsd-2/gstack forks (dev tooling only — keep using to build).
- **IP discipline:** founder-owned personally for now (no US entity — decided 2026-06-11); contractor work-for-hire clauses from contractor #1; partner licenses (not co-ownership). US entity + IP assignment happens 12–18 months pre-exit. Sloppy IP chain costs 20–40% of exit value.

---

## 12. Open decisions (founder)

1. ~~Brand name~~ — **DECIDED 2026-06-11: BDS (Business Design Shop)**, repo `wbardawil/BOS`. Trademark check still pending (founder to-do).
2. **Founding-member price point** — $99 vs. $149/mo lifetime (tests price sensitivity inside the demand test itself).
3. **Which 2–3 current engagements** seed the V0 workspace (richest triangle data wins).
4. ~~US LLC~~ — **DECIDED 2026-06-11: none for now.** Billing on the Mexican entity (Stripe MX); founder owns IP personally. US entity formed 12–18 months pre-exit or when US enterprise customers require it.
5. **Concept-doc + Loom production** — week 1; founder voice, AI-accelerated.
6. **Import posture** — clean-start V1 (recommended); Coda/Notion/PPT importers Phase 2.

---

## 13. Evidence base (carried forward)

- Capterra 2026 (n=3,385; US 588, MX 288, ES 273, BR 278) — buyer failure base rates; validates M4 wedge + §3.4 baseline.
- Competitive scans (2026-06-11): strategy-execution consolidation (Workboard+Quantive; Viva Goals retired); selection consulting enterprise-only; procurement platforms $10K+/yr at $400K+ SaaS-spend ICP; agentic-procurement gold rush is enterprise (Lio $30M a16z) — no SMB/consultant CoS workspace found.
- Agentic buying: Gartner 90%-by-2028/$15T; 69% want human validation; 68% of SMBs report AI decision paralysis.
- Pricing trend: hybrid 27%→41% in 12 mo; outcome-based 10%→60% projected (Bloomberg/RSM); Bessemer AI pricing playbook.
- Repo audits (this session): CDIO question bank + scoring real (RAG was vaporware — rebuilt here); P2W-OS methodology complete; bds-OS engines real, never deployed; CMC infra patterns liftable; gsd-2/gstack = dev tooling, zero founder commits.
- Founder facts: 4-month runway · 12K LinkedIn · strengths: closing + product design · content self-certified workable · goal: free + $30M net worth · CSIO archetype = the encoded brain.
