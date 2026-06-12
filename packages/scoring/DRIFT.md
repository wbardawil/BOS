# DRIFT.md — bds-OS edge functions vs. the canonical engines

Prompt 3 mandate: where bds-OS edge functions reimplemented an engine inline
and drifted, **the `packages/scoring` version is canonical**. This file is the
audit of every drift found while extracting. Source compared:
`BDS-OS/bds-os/src/engines/*` (extracted here verbatim) vs.
`BDS-OS/bds-os/supabase/functions/*/index.ts` (inline reimplementations —
none of them import the engine modules).

## grade-evidence (known drift — confirmed)

vs. `engines/evidence-grader.ts` `gradeEvidence()`:

1. **Missing `scope_mismatch` risk flag.** The engine flags
   `targetLevel - current_level > 1` ("Attempting to skip from level X to
   level Y"); the edge function never emits it. (Note: with
   `targetLevel = min(current + 1, 5)` the condition is currently
   unreachable in both — but the engine carries the guard and the edge
   function dropped it.)
2. **Truncated risk-flag message.** Engine: `"Evidence description is very
   brief; may lack sufficient detail"`. Edge function: `"Evidence
   description is very brief"`. The golden tests pin the engine wording.
3. The edge function defaults `current_level` to 1 when no round response
   exists — a data-access concern that belongs to the caller, not the
   engine; the engine takes `current_level` as input.

## compute-opi

vs. `engines/opi.ts` `computeOPI()`:

1. **Component scores not rounded.** The engine rounds `weighted_gap`,
   `pnl_score`, `speed_score`, `dependency_score`, `risk_score` to 3
   decimals; the edge function stores raw floats and only rounds
   `final_opi`. Canonical: 3-decimal components.
2. Lifecycle modifiers are re-hardcoded inline (values match
   `constants/lifecycle-weights.ts` `LIFECYCLE_MODIFIERS`, so numeric
   behavior agrees — but there is no single source of truth on the bds-OS
   side; here the constant is exported and tested).
3. The edge function omits `phase_label` from stored rows (schema concern,
   not formula drift).

## select-focus-portfolio

vs. `engines/focus-portfolio.ts` `selectFocusPortfolio()`:

1. **Dependency rules dropped entirely.** The edge function fetches
   `practice_dependencies` and never uses them: no `hasDependenciesMet`
   gating in the Phase 1/Phase 2 fill loops (engine Rules 2–3, point 6) and
   no Rule 6 pull-in of missing dependencies. Canonical: dependencies gate
   admission and unmet ones are pulled into the portfolio.
2. **Selection-reason label drift.** The execution-heavy fallback is
   recorded as `'execution_requirement'` in the edge function; the engine's
   `PracticeSelectionRationale` union has no such member — canonical label
   is `'dependency_inclusion'`.

## determine-lifecycle

No drift. Thresholds, revenue midpoints, normalization, and the
higher-signal-wins rule match `engines/lifecycle.ts` exactly.

## governance-report

vs. `engines/delegation-index.ts` and `engines/operating-debt.ts`:

1. **Delegation index never computed.** The executive view hardcodes
   `{pct_decisions_below_ceo: 0, escalations_per_month: 0,
   avg_decision_latency_hours: 0, delegation_health: 'moderate'}` instead of
   calling anything like `calculateDelegationIndex`. Canonical: the engine.
2. **Operating debt under-counted.** The board view computes
   `total_debt_score = riskBreaches × 3` only — it skips the engine's
   below-Level-2 term (+2 each) and expired-evidence term (+1 each), emits
   empty `practices_below_level_2` / `expired_evidence_items`, and zeroes
   `risk_floor_level` / `current_level` / `gap` inside each breach.
   Canonical: `calculateOperatingDebt`.

## Shared quirk (both sides identical — documented, NOT changed)

`selectFocusPortfolio`'s 60% area-concentration check evaluates
`(currentCount + 1) / (selected.length + 1) > 0.6` — on an **empty**
portfolio this is `1/1 > 0.6`, so the Phase 1/Phase 2 loops admit nothing
until a risk-floor practice (Rule 1, which bypasses the check) seeds the
selection. The edge function has the same formula and the same behavior.
Behavior-preserving extraction means this ships as-is; pinned by the test
"with no risk-floor seed, the first candidate always trips the 60% check".
Flag for founder review before any portfolio feature builds on it.

## Extraction notes (compile-time only, zero behavior change)

- BOS compiles with `noUncheckedIndexedAccess`; four indexed accesses that
  are logically guaranteed needed non-null assertions
  (`focus-portfolio.ts` ×2, `lifecycle.ts` ×1, `maturity.ts` loop locals).
- `engines/maturity.ts` imports moved from CDIO's `@/types` alias to the
  carved `types/cdio.ts`. Type and constant definitions are verbatim copies.
