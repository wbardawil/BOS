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

## Source repo locations (this machine)
- CDIO → `C:\Users\Dell\Documents\@ Projects\CDIO` (branch main)
- P2W-OS → `C:\Users\Dell\Documents\@ Projects\P2W-OS` (branch claude/strategy-app-mvp-QQmbo — this repo has NO main)
- bds-OS → `C:\Users\Dell\Documents\@ Projects\BDS-OS\bds-os` (branch main)

## The founder
Wadi Bardawil — fractional Chief Strategy & Information Officer, customer #1.
Direct, challenge-friendly; push back when assumptions look wrong. The product
must make HIS practice better before serving anyone else. Standing kill rule:
if the founder isn't using the workspace weekly on real engagements by day 60,
the product isn't real.
