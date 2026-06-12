# KICKOFF-PROMPTS — Claude Code execution kit for BDS (Business Design Shop)

How to use: create the empty `wbardawil/BOS` repo, copy `SPEC.md` + `TECH-SPEC.md` into `docs/`, create `CLAUDE.md` from §1 below, then run the prompts in §2 in order — one prompt per Claude Code session (fresh context each time, per gsd-2's own fresh-context-per-task lesson). Each prompt is self-contained and tells the session exactly what "done" means.

---

## 1. CLAUDE.md for the new repo (paste as-is, adjust bracketed items)

```markdown
# CLAUDE.md — BDS (Business Design Shop) · repo BOS

BDS is the Digital Chief of Staff platform. Billing runs on the founder's Mexican
entity for now (US entity deferred to pre-exit). "DECIDE" names the M4 method,
not the product.

## ⛔ CLIENT CONFIDENTIALITY — ABSOLUTE, NON-NEGOTIABLE RULE
Real client / customer / engagement information the founder shares is in-session
reasoning context ONLY. NEVER persist it into code, comments, placeholder/UI copy,
prompts, seed/fixture/test data, docs, commit messages, or anything that lands in
git. Every example must be invented and obviously fictional. A breach is the most
serious failure possible in this project — worse than shipping nothing.

## What this is
The Digital Chief of Staff: a multi-tenant strategic workspace for consultants
(fractional CSIOs/CXOs) and later C-level executives. Strategy, operating model,
and initiatives as three interconnected vertices (the Strategy Triangle), with an
AI advisor and approval-gated execution agents. Read `docs/SPEC.md` (product,
v0.8) and `docs/TECH-SPEC.md` (architecture + build plan) before any work.

## Core architecture laws (violations are bugs, not style issues)
1. TRUE RLS on every table — org_id scoping enforced in Postgres, never only in
   app code. The anon-key client is the default; service-role only inside Inngest
   jobs with explicit org scoping. The adversarial RLS Playwright suite must pass
   before any feature merges.
2. Loose-first, strict-later — choice_id/aspiration_id are nullable everywhere;
   orphaned objects are flagged in UI, never blocked at the DB.
3. Every LLM call goes through @bos/ai (router + prompt cache + usage_ledger +
   Langfuse). A raw `anthropic.messages.create` outside the package is a bug.
4. Model routing: Haiku for routine agent actions, Sonnet for advisory/reasoning,
   Opus-class only for flagship artifacts. Workspace context blocks are
   prompt-cached. Overnight agent batches use the Batches API.
5. Agents never act outbound without an `agent_runs.awaiting_approval` record
   approved by a human.
6. Engines stay pure — packages/scoring and packages/p2w contain no IO, no
   Supabase imports (the bds-OS rule, now enforced by tests).
7. Project management is OUT of scope — no tasks, tickets, sprints, or Gantt.
   If a feature smells like Asana, stop and re-read SPEC §2.
8. Pure logic gets 100% test coverage (vitest). Schema/auth changes require a
   second-voice review before merge. Plan mode before any non-trivial change.

## ⚠️ Next.js 16
This repo uses Next.js 16 — breaking changes vs. your training data. Read the
relevant guide in `node_modules/next/dist/docs/` before writing framework code.

## Stack
Next.js 16 + React 19 + TS strict + Tailwind 4 + shadcn/ui · Turborepo + pnpm ·
Supabase (Postgres/RLS/pgvector/Storage, migrations via CLI only) · Clerk ·
Anthropic SDK ≥0.80 · Inngest · Stripe (subscriptions + metered usage) ·
Langfuse + Sentry · Resend · Vitest + Playwright · Vercel.

## Commands
pnpm dev · pnpm build · pnpm test · pnpm test:rls (adversarial suite) ·
pnpm db:migrate (supabase migration up) · pnpm db:reset

## Working rules
- Always: plan before building; cite file paths; run `pnpm build` + `pnpm test`
  before claiming done; commit messages explain WHY; verify in browser for UI work.
- Never: hand-paste SQL into dashboards (CLI/migrations only); commit secrets;
  `git push --force` / `reset --hard` / `--amend` without explicit permission;
  add .md docs unless asked; bypass RLS in a user-facing path.

## Provenance of extracted packages
@bos/methodology ← CDIO repo (founder-ratified 128-question bank + citations —
do not reword questions without founder sign-off) · @bos/scoring ← CDIO
maturity.ts + bds-OS engines · @bos/p2w ← P2W-OS framework layer. Treat these
as METHODOLOGY IP: behavior changes require founder approval; refactors must be
behavior-preserving and test-proven.

## The founder
Wadi Bardawil — fractional Chief Strategy & Information Officer, customer #1.
Direct, challenge-friendly; push back when assumptions look wrong. The product
must make HIS practice better before serving anyone else. Standing kill rule:
if the founder isn't using the workspace weekly on real engagements by day 60,
the product isn't real.
```

---

## 2. Execution prompts (one Claude Code session each, in order)

### PROMPT 0 — Scaffold
> Read docs/SPEC.md and docs/TECH-SPEC.md fully. Scaffold the monorepo per TECH-SPEC §2.2: Turborepo + pnpm workspaces; apps/web as Next.js 16 + React 19 + TypeScript strict + Tailwind 4 + shadcn/ui; empty packages methodology/scoring/p2w/ai/agents/db each with package.json, tsconfig, vitest config, and a passing placeholder test; supabase/ initialized via CLI; GitHub Actions CI running typecheck + vitest + next build on every push. Add .env.example listing every variable TECH-SPEC §2.1 implies (Supabase, Clerk, Anthropic, Inngest, Stripe, Langfuse, Sentry, Resend) with fictional values. Definition of done: fresh clone → pnpm install → pnpm build && pnpm test passes; CI green.

### PROMPT 1 — Tenancy + RLS foundation (the load-bearing week-1 spike)
> Read TECH-SPEC §2.3 and §4.2. Create migration 0001: organizations, memberships, workspaces with RLS enabled and policies scoping all access to the caller's org via Clerk JWT third-party auth (spike this integration FIRST — if Clerk↔Supabase RLS fights for more than a day, stop and report; the fallback decision is the founder's). Build @bos/db: typed client factories — anonClient (default, RLS-bound) and serviceClient (jobs only, requires explicit orgId param and logs usage). Write the adversarial RLS Playwright suite: two orgs, two users, every cross-tenant read/write attempt must return empty/403. Definition of done: pnpm test:rls green; a README in packages/db explaining the two-client law.

### PROMPT 2 — Extract @bos/methodology and @bos/p2w
> Copy CDIO/src/lib/playbook/diagnostic-questions.ts and question-citations.ts into packages/methodology, carving the types they import from CDIO/src/types/index.ts into the package (no @/types imports remain). Do NOT reword any question or citation — methodology IP, behavior-preserving only. Add a vertex tag (strategy|operating_model|initiatives) and a decide_stage tag where applicable to each question, as NEW metadata fields (additive). Copy P2W-OS/src/lib/framework.ts, the coach persona from claude.ts, docs/framework.md and docs/exemplars.md into packages/p2w — ⚠️ pull from branch `claude/strategy-app-mvp-QQmbo` (P2W-OS has no main on GitHub). Write tests: bank integrity (128 questions, 16 modules, every question has a citation, every citation has a named construct), p2w cascade meta completeness, computeConfidence golden cases. Definition of done: both packages build, tests green, zero CDIO/P2W-OS imports.

### PROMPT 3 — Extract @bos/scoring with the test suite that never existed
> Copy CDIO/src/lib/scoring/maturity.ts and all six bds-OS/src/engines/*.ts into packages/scoring with their types. Behavior-preserving: do not "improve" formulas. Write golden-case tests for every engine — OPI (verify formula, phase assignment at boundaries 3.5/2.0, risk-floor trigger, ranking), focus-portfolio (WIP caps, risk floors), lifecycle, evidence-grader, delegation-index, operating-debt, and CDIO maturity (size-band ceilings, divergence detection, consensus weighting). Target 100% line coverage on pure logic. Where bds-OS edge functions reimplemented an engine inline with drift (grade-evidence is known to), the packages/scoring version is canonical — document any drift found in packages/scoring/DRIFT.md. Definition of done: coverage report ≥95%, all goldens green.

### PROMPT 4 — @bos/ai: router, cache, metering, flow shell
> Build packages/ai per TECH-SPEC §2.4: (1) route(actionClass) → model id with Haiku/Sonnet/Opus-class mapping in one config file; (2) prompt-cache helper that structures workspace-context blocks for Anthropic prompt caching; (3) usage metering — every call writes usage_ledger (migration for the table if not present) and a Langfuse trace; (4) flow shell: runFlow({auth, gates, inputSchema, prompt, outputSchema, guard}) with one retry-on-parse-failure (pattern reference: confident-mind-coach runCoachingFlow — re-implement clean, do not copy Prisma code); (5) per-org monthly cost-cap check that hard-stops calls past the cap. Tests: router mapping, ledger writes on success AND failure, retry path, cap enforcement. Definition of done: a demo script calls one Haiku flow end-to-end and the ledger row + Langfuse trace exist.

### PROMPT 5 — Triangle schema + workspace CRUD (dogfood V0 part 1)
> Migrations 0002/0003 per TECH-SPEC §2.3 (triangle core + heartbeat + artifacts/agent_runs/coherence_snapshots), all RLS-policied, adversarial suite extended to the new tables. Build the workspace shell in apps/web: org switcher, workspace list, triangle home (three vertex panels + orphan-flag badges + coherence placeholder), and full CRUD for aspirations (versioned, never hard-deleted), strategic choices, assumptions (status lifecycle untested→testing→held|broken), initiatives (orphan flag when choice_id null), capabilities + metrics with manual metric points. Plain shadcn styling; speed over polish — the founder needs to migrate real engagements into this next week. Definition of done: founder can create a workspace and populate all three vertices end-to-end in the browser; pnpm test:rls green.

### PROMPT 6 — Cadence + decisions + advisor v0 + artifact export (dogfood V0 part 2)
> Build: (1) cadence sessions — create/schedule weekly events, agenda builder, markdown minutes, session summary; (2) decision log — title/rationale/alternatives/owner/vertex, listed on triangle home; (3) AI Advisor v0 — chat panel using @bos/ai with a prompt-cached workspace-context block (aspiration + choices + assumptions + initiative statuses + last 3 cadence summaries) and a vertex-aware system prompt assembled from @bos/p2w persona + @bos/methodology context; give it zod-validated tools to create decisions and challenges from conversation ("log this as a decision"); (4) artifact export v0 — weekly readout and board one-pager generated as Markdown then rendered to PDF, stored in Supabase Storage, listed per workspace. Definition of done: the founder runs a full weekly session for a real client from this surface — prep, live notes, decision logged, readout exported — without opening PowerPoint.

### PROMPT 7 — Phase 1 hardening (run after the demand-test gate passes)
> Per TECH-SPEC Phase 1 list: onboarding flow (new consultant → org → first workspace → guided first session), Stripe subscriptions + metered usage wired to usage_ledger with customer-set hard caps, Upstash rate limiting on AI routes, audit log on auth/billing/agent-approval events, and the M2 diagnostics flow (run a methodology assessment → populate capabilities + maturity scores → trend on the operating-model panel). Definition of done per TECH-SPEC Phase 1 gate; schema/auth changes get a second-voice review before merge.

### PROMPTS 8+ — Phase 2/3 (write fresh plans when you get there)
> Challenge Loop engine, Coherence v1, Artifact Engine v1 (white-label), DECIDE module v1 + machine-readable vendor corpus, V2 working agents on Inngest with approval gates, real RAG (pgvector), then V3 cadence agent + Executive tier. Each begins in plan mode against SPEC §10 / TECH-SPEC §3 — do not pre-write these prompts now; the Phase 0/1 learnings must shape them.

---

## 3. Sequencing rules for whoever runs these prompts

1. One prompt = one fresh Claude Code session. Don't chain unrelated prompts in one context.
2. Prompts 0–4 can run in week 1–2 (P1 is the only one with spike risk — run it second, alone, early).
3. Prompts 5–6 are the dogfood deadline: the founder's real Monday session is the acceptance test, nothing else.
4. The demand test (SPEC §10 Phase 0b — concept doc, Loom, founding-member pre-sale) is founder work, not Claude Code work, and runs in parallel from week 1. **Prompt 7 does not run until ≥5 founding members have paid.**
5. Every session ends with: build green, tests green, RLS suite green, commit with a why-message. No exceptions, including "it's just a prototype" — the prototype carries real client data from week 3.
