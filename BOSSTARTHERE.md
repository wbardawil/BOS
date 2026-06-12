# BOS — START HERE
## Everything needed to open a fresh Claude Code session and start building BDS (Business Design Shop)

**Date:** 2026-06-11 · Brand: **BDS** · Repo: `github.com/wbardawil/BOS` · Billing: Stripe MX (US entity deferred)

---

## 1. Before you open Claude Code (10 minutes, one time)

1. **Create the repo:** `github.com/wbardawil/BOS` — private, empty (no README/license; the scaffold makes them).
2. **Clone it locally**, and place these four files:
   - `CLAUDE.md` → repo root (copy the full block from `KICKOFF-PROMPTS.md` §1 — it's ready to paste)
   - `docs/SPEC.md` (product spec v0.8)
   - `docs/TECH-SPEC.md` (architecture + build plan)
   - `docs/KICKOFF-PROMPTS.md` (the 8 execution prompts)
3. **Make the source repos reachable** for the extraction prompts (2 and 3). Either keep your existing local clones as siblings of BOS, or clone fresh:
   - `wbardawil/CDIO` → branch `main` (verified current — has the ratified 128-question bank)
   - `wbardawil/P2W-OS` → branch **`claude/strategy-app-mvp-QQmbo`** ⚠️ this repo has NO main; this branch is the whole app
   - `wbardawil/bds-OS` → branch `main` (the 6 engines)
4. Commit and push the four docs: `git add CLAUDE.md docs/ && git commit -m "BDS: spec, tech spec, and execution kit" && git push -u origin main`

That's it. No accounts needed yet for session 1 (Supabase/Clerk/Stripe/etc. come at Prompt 1+; `.env.example` gets created in Prompt 0).

## 2. The first message to paste into the new Claude Code session

```
Read CLAUDE.md, then docs/SPEC.md, docs/TECH-SPEC.md, and docs/KICKOFF-PROMPTS.md
fully before doing anything.

Context: this is BDS (Business Design Shop) — the Digital Chief of Staff platform.
Brand decided, architecture decided, build plan decided. Your job this session is
exactly one thing: execute PROMPT 0 (Scaffold) from docs/KICKOFF-PROMPTS.md §2.

Rules for this session:
- Do not expand scope beyond Prompt 0. Definition of done is written in the prompt.
- The source repos for later extraction prompts live at [PATH — e.g. ../CDIO,
  ../P2W-OS (branch claude/strategy-app-mvp-QQmbo), ../bds-OS]. Do not touch them
  this session.
- Next.js 16 has breaking changes vs. your training data — read the bundled docs
  in node_modules/next/dist/docs/ before writing framework code.
- End state: fresh clone → pnpm install → pnpm build && pnpm test green, CI green,
  committed and pushed with a why-message.

Confirm you've read the three docs by summarizing the Strategy Triangle and the
8 architecture laws in 5 lines, then begin.
```

(Replace `[PATH]` with wherever the source clones live on that machine.)

## 3. Session cadence (the discipline that keeps this on rails)

- **One prompt = one fresh session.** Prompts 0 → 1 → 2 → 3 → 4 → 5 → 6, in order. Don't chain two prompts in one context.
- **Prompt 1 (Clerk↔Supabase RLS) is the only spike risk.** Run it early and alone. If it fights for more than a day, the session must stop and report — the fallback (Supabase Auth) is your decision, not the session's.
- **Prompts 5–6 are the deadline that matters:** your real Monday client session, run from the workspace instead of PowerPoint, is the acceptance test for everything.
- **Prompt 7 is locked** until ≥5 founding members have paid. No exceptions — that gate is the whole risk-management design.
- Every session ends: build green, tests green, RLS suite green, pushed. Even prototypes — real client data enters at week 3.

## 4. Your parallel track (founder work, not Claude Code work)

While sessions 0–4 run (weeks 1–2):
1. Stripe MX: create the founding-member product — $99–149/mo lifetime, 10 spots, billing starts Month 3 — and a payment link. Price USD (see multicurrency note in chat).
2. One-page landing (Carrd/Framer) with the offer + payment link.
3. Trademark check on "BDS / Business Design Shop" in MX + US (cheap search first; lawyer only if clear).

While sessions 5–6 run (weeks 3–6):
4. Record the 4-min Loom: "my Monday — PowerPoint vs. my BDS workspace" on a real engagement.
5. DM 20 warmest LinkedIn consultants → 8–12 demo calls → close 5+ founding members.
6. Wire the lead magnet: strategy-spark-86 (75-question Lovable assessment) results page gets email capture + "act on this with BDS" CTA → your landing/booking link. Wire only — never merge the codebases.

## 5. The first 30 days at a glance

| Week | Engineering (Claude Code) | You |
|---|---|---|
| 1 | Prompts 0, 1 (scaffold + RLS spike) | Stripe link, landing page, trademark check |
| 2 | Prompts 2, 3, 4 (extractions + AI layer) | Concept doc + outreach list |
| 3 | Prompt 5 (triangle CRUD) — your real engagements go in | Loom recorded, 20 DMs out |
| 4 | Prompt 6 (cadence + advisor + artifacts) | Demo calls, closing founding members |
| **Gate** | **You run a real client session without PowerPoint** | **≥5 paid founding members** |

Both gates green → Prompt 7 and Phase 1. Either gate red → stop, diagnose, reposition — cheaply, exactly as designed.
