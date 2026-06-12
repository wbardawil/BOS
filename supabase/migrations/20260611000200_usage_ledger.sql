-- Migration 0002a — usage_ledger (TECH-SPEC §2.3 ops block, pulled forward by
-- Prompt 4: @bos/ai writes a ledger row for EVERY LLM call — schema law #2).
--
-- Append-only by construction: authenticated gets SELECT + INSERT only (no
-- UPDATE/DELETE grants, no UPDATE/DELETE policies), so a compromised member
-- token can at worst add rows in its own org, never rewrite spend history.
-- The per-org monthly cost cap in @bos/ai reads this table, so tampering with
-- it would mean tampering with billing enforcement.

create table public.usage_ledger (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  action       text not null check (length(trim(action)) > 0),
  model        text not null check (length(trim(model)) > 0),
  tokens_in    integer not null default 0 check (tokens_in >= 0),
  tokens_out   integer not null default 0 check (tokens_out >= 0),
  cost_cents   integer not null default 0 check (cost_cents >= 0),
  -- Additive vs the TECH-SPEC column list: failed calls must also land in the
  -- ledger ("ledger writes on success AND failure"), and they need to be
  -- distinguishable from billable successes.
  status       text not null default 'success' check (status in ('success', 'error')),
  created_at   timestamptz not null default now()
);

-- The cost-cap check is "sum this org's spend this month" — index for it.
create index usage_ledger_org_created_idx on public.usage_ledger (org_id, created_at);

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.usage_ledger enable row level security;

-- Members see their org's spend (it drives in-app usage display).
create policy usage_ledger_select on public.usage_ledger
  for select to authenticated
  using (private.is_org_member(org_id));

-- Only write roles can append: AI calls are initiated by people who can write
-- to the workspace; viewers are read-only everywhere (law #1 role model).
create policy usage_ledger_insert on public.usage_ledger
  for insert to authenticated
  with check (private.has_write_role(org_id));

-- No UPDATE/DELETE policies on purpose — the ledger is append-only for
-- authenticated users. Inngest jobs use service_role (bypasses RLS) with
-- explicit org scoping per @bos/db law.

-- ── Grants (anon gets NOTHING, same as migration 0001) ───────────────────────

grant select, insert on public.usage_ledger to authenticated;
grant select, insert, update, delete on public.usage_ledger to service_role;
