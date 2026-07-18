# TECH-SPEC v1.0 — Digital Chief of Staff Platform
## CTO / Senior Architect / Product Owner technical specification

**Date:** 2026-06-11 · **Companion docs:** `SPEC.md` v0.8 (product) · `SPEC-ADDENDUM.md` v0.9 (loop, new schema §3, screens) · `KICKOFF-PROMPTS.md` (Claude Code execution)
**Brand:** **BDS — Business Design Shop** (decided 2026-06-11) · **Repo:** `github.com/wbardawil/BOS` · Packages: `@bos/*`
**Naming note:** the legacy repo `bds-OS` (P&L maturity backend) is unrelated to the BDS brand and gets archived after engine extraction — which conveniently frees the name. "DECIDE" stays as the M4 method name.

---

## 1. THE VERDICT: new monorepo + surgical extraction (verified, not assumed)

**Decision: build a NEW monorepo. Extract ~4,900 lines of verified methodology IP from the existing repos as packages. Do NOT build on top of any existing repo. Do NOT build from zero.**

### 1.1 What was verified by direct file inspection (2026-06-11, this session)

| Asset | Location | Verified size | Verified coupling | Extraction effort |
|---|---|---|---|---|
| Question bank (128 Q, 16 modules, provenance + role tags + N/A) | `CDIO/src/lib/playbook/diagnostic-questions.ts` | 1,345 lines | imports `@/types` only — pure data + interfaces | **Hours** |
| Citations (named constructs: COBIT/NIST/ITIL/DORA, graded 124-strong) | `CDIO/src/lib/playbook/question-citations.ts` | 2,103 lines | self-contained data | **Hours** |
| Maturity scoring engine (size-band ceilings, weighted consensus, divergence) | `CDIO/src/lib/scoring/maturity.ts` | 389 lines | imports `@/types` (MODULE_NAMES, SIZE_PRIORITY_SEQUENCES) — types must travel with it | **1 day incl. tests** |
| P2W cascade (5 boxes + checklists + 7 RE categories + confidence calc) | `P2W-OS/src/lib/framework.ts` + `claude.ts` + `docs/framework.md` + `docs/exemplars.md` | 109 + 78 + ~490 lines | framework.ts is client-safe constants, zero deps | **1 day** |
| bds-OS engines (OPI, focus-portfolio, lifecycle, evidence-grader, delegation, operating-debt) | `bds-OS/src/engines/*` (6 files) | ~845 lines | **verified pure** — `opi.ts` read end-to-end: no IO, no Supabase imports, types-only | **1–2 days incl. tests (none exist today)** |
| Agent prompts + logic (assessment, strategy, conversation, orchestrator, audit, pain-points) | `CDIO/src/lib/agents/*` (6 files) | ~1,950 lines | coupled to Supabase service client — extract prompts + logic, re-house I/O | **2–4 days** |
| AI-infra patterns (usage logger, flow shell, session summaries, memory facts) | `confident-mind-coach/src/lib/{ai,coaching,monitoring}` | reference only | coupled to Prisma + coaching domain | **1–2 days re-implement clean** |

**Total proven IP: ~4,900 lines + ~2,000 lines of agent prompts/logic. Roughly 15–20% of the final codebase, but 80% of the methodology value — the part that took months of founder ratification and cannot be regenerated in a weekend.**

### 1.2 Why NOT build on CDIO (the strongest alternative, rejected)

CDIO has the newest stack of anything owned (verified: Next 16.2.1, React 19.2.4, Clerk 7, Anthropic SDK 0.80) and the best shell. Rejected anyway because it carries five debts that cost more to unwind in place than to leave behind:
1. **Tenant isolation is app-layer only** — everything runs as `service_role`; anon/authenticated revoked; isolation enforced in `assert-owns-org.ts`. Fine solo; disqualifying for multi-tenant SaaS. Retrofitting true RLS onto 26 existing SQL files is riskier than a clean RLS-first schema.
2. **26 hand-sequenced SQL files, no migration framework.**
3. **Three-pivot documentation debt** (Executive OS → Cockpit → method rebuild) — every doc contradicts another; new contributors and Claude Code sessions inherit the confusion. (This is the "three different ideas" struggle, on disk.)
4. **The RAG is fake** (keyword `ilike`, chunks ingested without embeddings) — rebuilding it means touching the heart of the old app anyway.
5. **Zero tests, zero CI** — by explicit project rule. The new platform inverts that rule.
6. **IP chain:** fresh repo under the founder's account from commit 1 = clean, single-owner IP history. (No US entity for now — founder-owned personally, billed via the Mexican entity; a US entity gets formed 12–18 months before any exit conversation and the IP assigned then.)

### 1.3 Why NOT from scratch

The question bank + citations represent founder-ratified, defensibility-graded methodology (124 strong / 4 weak / 0 indefensible per CDIO's own scorecard). The P2W encoding is methodologically complete and mid-market-tuned. The bds-OS engines are textbook pure functions. Regenerating any of this burns runway re-solving solved problems — and the regenerated version would be unratified.

### 1.4 Disposition of every repo (final)

| Repo | Action | When |
|---|---|---|
| CDIO | Extract per §1.1 → archive with README pointer | Phase 0, week 1–2 |
| P2W-OS | Extract methodology layer → archive | Phase 0, week 1 |
| bds-OS | Extract engines + RLS patterns as reference → archive | Phase 0, week 2 |
| strategy-spark-86 | **Keep live as the lead magnet** (Lovable app, 75-question assessment). Wire as funnel top: results page + email capture → BDS workspace CTA / founding-member offer. Stays its own repo/stack — wired, never merged | Funnel wiring in Phase 1 |
| confident-mind-coach | **Keep separate and active** (different product). Patterns referenced, no shared code | — |
| gsd-2, gstack | Drop forks; use upstream as build tooling only. Never in product | Week 1 |

---

## 2. ARCHITECTURE

### 2.1 Stack (decided — each choice is proven in an owned repo or industry-default)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16 (App Router) + React 19 + TypeScript strict** | CDIO already runs it in production-shape; ⚠️ Next 16 has breaking changes vs. training data — read `node_modules/next/dist/docs/` before writing code (carried into repo CLAUDE.md) |
| UI | Tailwind 4 + shadcn/ui | Speed; founder is solo |
| Monorepo | Turborepo + pnpm workspaces | Package extraction is the whole point |
| DB | **Supabase Postgres + TRUE RLS + pgvector + Storage**, migrations via Supabase CLI only | RLS-first from commit 1 (the CDIO lesson); pgvector for real embeddings (the fake-RAG lesson) |
| Auth | Clerk (org/membership model) with Supabase third-party JWT integration | Proven in CDIO; supports consultant/executive/contributor/viewer roles |
| AI | Anthropic SDK ≥0.80; **model router** (Haiku for ~80% of agent actions, Sonnet for advisory/strategy, Opus-class reserved for flagship artifacts); **prompt caching mandatory** on workspace context; **Batches API** for overnight agent runs (50% cost) | The §6.2 cost model in SPEC.md depends on all three levers |
| Jobs | Inngest | Agent runs, cadence cron, approval-gated workflows, retries |
| Billing | Stripe Billing: subscriptions + **metered usage records** | Hybrid pricing is structural, not optional |
| Observability | Langfuse (every LLM call) + Sentry | Per-account margin visibility from day 1 |
| Email | Resend | Cadence nudges, approvals |
| Testing | Vitest (engines/packages: 100% on pure logic) + Playwright (E2E + **adversarial RLS suite**) | Inverts the no-tests rule; RLS suite gates any second tenant |
| Hosting | Vercel + Supabase cloud | Boring, proven |

### 2.2 Monorepo layout

```
BOS/
├── apps/
│   └── web/                    # Next.js 16 — three surfaces: consultant console,
│                               # executive workspace, leadership portal
├── packages/
│   ├── methodology/            # @bos/methodology — question bank + citations + module types
│   ├── scoring/                # @bos/scoring — CDIO maturity engine + bds-OS 6 engines, tested
│   ├── p2w/                    # @bos/p2w — cascade meta, RE categories, confidence, coach persona
│   ├── ai/                     # @bos/ai — model router, prompt-cache helpers, batch queue,
│   │                           #   usage metering, flow-shell (run → validate(zod) → retry → guard)
│   ├── agents/                 # @bos/agents — advisor + working agents (prompts from CDIO, I/O re-housed)
│   └── db/                     # @bos/db — generated DB types, client factories (anon vs service),
│                               #   query helpers that NEVER bypass RLS in user paths
├── supabase/                   # config.toml, migrations/, seed.sql
├── docs/                       # SPEC.md, TECH-SPEC.md, decisions/ (ADRs)
└── turbo.json, pnpm-workspace.yaml, .github/workflows/ci.yml
```

### 2.3 Data model (core schema — the triangle as tables)

```sql
-- TENANCY (RLS root: org_id on every row, policies via Clerk JWT → membership)
organizations   (id, name, kind 'practice'|'company', stripe_customer_id, created_at)
memberships     (org_id, user_id /*clerk*/, role 'owner'|'consultant'|'executive'|'contributor'|'viewer')
workspaces      (id, org_id, client_name, created_at, archived_at)

-- STRATEGY VERTEX (M1) — built in migration 0003 (Intermedio scope)
possibilities       (id, workspace_id, short_name, aspiration_hypothesis, where_to_play, how_to_win,
                     why_could_win, what_we_stop, biggest_unknown, why_might_fail,
                     status 'proposed'|'shortlisted'|'selected'|'parked'|'killed', sort)
aspirations         (id, workspace_id, statement, version, status 'active'|'challenged'|'superseded',
                     source_possibility_id NULL←promotion provenance, challenged_at)
strategic_choices   (id, workspace_id, aspiration_id NULL←loose-first, source_possibility_id NULL,
                     where_to_play, how_to_win, status, sort)
assumptions         (id, workspace_id, choice_id NULL, possibility_id NULL, category /*7 WWHTBT*/, statement,
                     status 'untested'|'testing'|'held'|'broken', owner_name, evidence_note)
-- `possibilities` is the one structural object added beyond the original §2.3 sketch:
-- P2W's core is comparing 2–4 rival ways to win before committing (a `selected`
-- possibility is "promoted" into the committed aspiration + choices). DEFERRED to
-- Phase 1–2 (dogfooded via the p2w-strategy-planning-lab tool until real use earns
-- a migration): competitor-assumption records, barrier tests w/ pass/fail thresholds,
-- the problem canvas, the Ruthless-Critic/output-status, and importance×confidence
-- enrichment of assumptions.

-- OPERATING MODEL VERTEX (M2)
capabilities    (id, workspace_id, name, area, maturity_current, maturity_target, ceiling,
                 source 'cdio128'|'bds82'|'custom')
metrics         (id, workspace_id, capability_id NULL, name, unit, direction, target)
metric_points   (id, metric_id, value, observed_at)

-- INITIATIVES VERTEX (M3)
initiatives     (id, workspace_id, choice_id NULL←orphan flag, name, owner_name, dollar_value,
                 status, wip_rank, opi)

-- HEARTBEAT (M5)
cadence_events  (id, workspace_id, kind 'weekly'|'monthly'|'quarterly'|'adhoc', scheduled_at,
                 held_at, agenda jsonb, minutes_md, summary)
decisions       (id, workspace_id, vertex, title, rationale_md, alternatives jsonb, owner_name,
                 decided_at, module /*'DECIDE' etc.*/)
challenges      (id, workspace_id, level 1..5 /*execution→aspiration*/, source_kind, source_id,
                 statement, status 'open'|'accepted'|'resolved'|'dismissed', resolution_md)

-- OUTPUT + OPS
artifacts            (id, workspace_id, kind, version, storage_path, generated_from jsonb, created_by)
documents            (id, workspace_id, title, storage_path, status)
doc_chunks           (id, document_id, content, embedding vector)
agent_runs           (id, workspace_id, agent, status 'queued'|'running'|'awaiting_approval'|'approved'|'done'|'failed',
                      input jsonb, output jsonb, tokens_in, tokens_out, cost_cents, approved_by, created_at)
usage_ledger         (id, org_id, workspace_id, action, model, tokens_in, tokens_out, cost_cents, created_at)
coherence_snapshots  (id, workspace_id, score, components jsonb, computed_at)
```

**Schema laws:** (1) `choice_id`/`aspiration_id` nullable everywhere — loose-first is a schema property, orphans flagged in app; (2) every LLM call writes `usage_ledger` — no exceptions; (3) anything agent-outbound passes through `agent_runs.awaiting_approval`; (4) RLS policy on every table before any second org exists, verified by the adversarial Playwright suite.

### 2.4 The AI layer (where the margin lives or dies)

```
request → @bos/ai router
  ├── action class "routine"   → Haiku   (agent follow-ups, formatting, documentation)
  ├── action class "reasoning" → Sonnet  (advisor chat, challenge loop, strategy drafting)
  ├── action class "flagship"  → Opus-class (board decks, quarterly artifacts only)
  ├── workspace context block  → prompt-cached (state is repetitive; ~90% input savings)
  ├── non-urgent agent batches → Batches API overnight (50% off)
  └── every call → usage_ledger + Langfuse trace + per-org cost cap check
```
Flow-shell pattern (from confident-mind-coach, re-implemented clean): auth → tier/cap gates → zod input → LLM → zod output parse with one retry-on-failure → guard → persist atomically.

---

## 3. THE BUILD PLAN — full to-do list (gate-based, 4-month runway)

### PHASE 0a — Foundation + extraction (weeks 1–2)
- [ ] Billing setup on the existing Mexican entity (Stripe MX). US entity DEFERRED — revisit when US enterprise customers require it or 12–18 months pre-exit
- [ ] Repo `github.com/wbardawil/BOS` (private); Turborepo + pnpm scaffold; TS strict; CI (typecheck + vitest + build) from commit 1
- [ ] Supabase project (new); Clerk app (new); Vercel project; Inngest, Langfuse, Sentry, Resend accounts
- [ ] Migration 0001: tenancy tables + RLS policies + Clerk JWT integration
- [ ] Migration 0002: triangle core (aspirations, choices, assumptions, capabilities, metrics, initiatives)
- [ ] Migration 0003: heartbeat (cadence_events, decisions, challenges) + ops (usage_ledger, agent_runs, artifacts)
- [ ] Extract `@bos/methodology`: copy `diagnostic-questions.ts` + `question-citations.ts` + carve needed types from `CDIO/src/types/index.ts`; tag each question with vertex + DECIDE-stage relevance
- [ ] Extract `@bos/p2w`: `framework.ts`, coach persona from `claude.ts`, `framework.md` + `exemplars.md` as package assets — ⚠️ source branch is `claude/strategy-app-mvp-QQmbo` (P2W-OS has NO main on GitHub)
- [ ] Extract `@bos/scoring`: `maturity.ts` + 6 bds-OS engines; **write the test suite that has never existed** (golden cases per engine; 100% coverage on pure logic)
- [ ] `@bos/ai` v0: model router + usage-ledger writer + flow shell + prompt-cache helper
- [ ] Adversarial RLS Playwright suite v0 (two fake orgs, cross-access attempts must 403/empty)
- [ ] Archive P2W-OS + add pointer README; drop gsd-2/gstack forks

### PHASE 0b — Dogfood V0 (weeks 3–6) — founder's real engagements in, ugly allowed
- [ ] Workspace shell: org switcher, workspace list, triangle home view (3 vertices + coherence placeholder)
- [ ] CRUD: aspiration (versioned), choices, assumptions (status lifecycle), initiatives (orphan flag), capabilities/metrics + manual metric points
- [ ] Cadence: create/log weekly session (agenda jsonb, minutes markdown), decision log with rationale
- [ ] AI Advisor v0: chat with workspace-context block (cached), vertex-aware system prompt, zod-validated tool calls for object creation ("log this decision")
- [ ] Artifact export v0: weekly readout + board one-pager → Markdown + PDF
- [ ] Founder migrates 2–3 REAL engagements (per SPEC §12.3); usage ledger live from first call
- [ ] **GATE:** founder runs 2 real weekly client sessions from the workspace and prefers it to PowerPoint. Miss → fix friction before anything else. (Standing rule: not weekly-used by day 60 → stop.)

### PHASE 0c — Demand test (weeks 1–4, parallel, founder-time not engineering-time)
- [ ] 1-page concept doc + 4-min Loom ("my Monday: PowerPoint vs. workspace") using real V0
- [ ] Landing page (Carrd/Framer) + Stripe payment link: founding member, 10 spots, $99–149/mo lifetime, billing starts M3
- [ ] 20 DMs to warmest LinkedIn consultants; demo calls booked
- [ ] **GATE:** ≥5 paid founding members in 30 days. 2–4 → tighten positioning. 0–1 → STOP, reposition before multi-tenant build.

### PHASE 1 — First paying cohort (months 3–5)
- [ ] Multi-tenant hardening: full RLS adversarial suite green; rate limiting (Upstash); audit log
- [ ] Onboarding flow (consultant creates org → first workspace → guided first session)
- [ ] Stripe live: solo tier subscription + usage meter wired to `usage_ledger`; customer-set hard caps
- [ ] M2 diagnostics wired: run CDIO-128 (selection subset) / bds-82 as workspace assessments → capabilities + maturity scores populated
- [ ] **Funnel wiring:** strategy-spark-86 (75-question Lovable lead magnet) results page gains email capture + "act on this with BDS" CTA → landing/booking. Wire only (webhook or link-out + UTM); never merge the codebases
- [ ] Advisor v1: Challenge-flag suggestions (manual loop), P2W Studio guided cascade session mode
- [ ] `@bos/agents`: port CDIO agent prompts (assessment, strategy) into flow-shell with injected I/O
- [ ] **GATE:** 10 paying; ≥7 run a real client session within 30 days.

### PHASE 2 — The loop + working agents (months 6–9)
- [ ] Challenge Loop engine: miss detection → 5-level traversal → challenge records; upside 10x flags
- [ ] Coherence Score v1 (components per SPEC §3.2) + snapshots + trend
- [ ] Artifact Engine v1: branded board decks/readouts per consultant (white-label)
- [ ] DECIDE module v1: 6-stage flow, vendor corpus schema (machine-readable from commit 1), BATNA + contract red-flags generators
- [ ] V2 working agents on Inngest with approval gates: owner follow-up drafts, minutes→decision-log documentation, assumption-evidence collection, orphan detection; overnight batches via Batches API
- [ ] Real RAG: document upload → chunk → embed (pgvector) → advisor retrieval with citations
- [ ] **GATE:** 40+ paying; churn <5%/mo; NPS ≥50; agent actions ≥30% of workspace activity.

### PHASE 3 — Executive tier + scale (months 10–18)
- [ ] V3 cadence agent (the digital CoS proper): session prep, input chasing, dashboard updates, flag raising — approval-gated outbound
- [ ] Executive tier onboarding + 5 design-partner CEOs; Practice/Firm tiers; portal contributor seats
- [ ] Corpus API pilots (the L3/data play); per-market vendor corpora (US/MX/ES)
- [ ] **GATE:** $50K+ MRR; ≥3/5 design partners adhere to 90-day cadence; ≥1 paid API pilot.

### Cross-cutting, every phase
- [ ] Success-rate instrumentation (SPEC §3.4) — initiative on-track %, decision regret-events at +6mo
- [ ] Weekly per-account margin review (usage_ledger); kill criteria honored as written (SPEC §10)
- [ ] Process gates carried from CDIO discipline: plan-mode before non-trivial changes; second-voice review before schema/auth changes; security audit before client-data features

---

## 4. RISKS / OPEN ENGINEERING DECISIONS

1. **Next 16 breaking changes** — mitigate: repo CLAUDE.md instructs reading bundled docs first (CDIO's AGENTS.md warning, carried over).
2. **Clerk↔Supabase RLS integration** — the JWT third-party-auth path must be spiked in week 1 (it's the foundation; if it fights, fallback is Supabase Auth, decided by end of week 1, not month 3).
3. **Agent approval UX** — approval-gated outbound is a product surface, not a queue table; design it in Phase 2 plan-mode, not ad hoc.
4. **P2W Prisma concepts → Postgres** — re-model Strategy/CascadeChoice/Hypothesis/Test as the §2.3 tables (concepts travel, code doesn't).
5. ~~Brand rename~~ — RESOLVED 2026-06-11: brand BDS (Business Design Shop), repo `wbardawil/BOS`, packages `@bos/*`.
