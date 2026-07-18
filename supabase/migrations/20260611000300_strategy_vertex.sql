-- Migration 0003 — Strategy vertex (M1 "Strategy Studio"), Intermedio scope.
--
-- TECH-SPEC §2.3 STRATEGY VERTEX, plus ONE structural object the §2.3 sketch was
-- missing: `possibilities`. Playing-to-Win's core discipline is comparing 2–4
-- mutually-exclusive ways to win BEFORE committing to one — without a place to
-- hold rival possibilities, the schema structurally invites "rationalize the one
-- favorite" (the #1 P2W anti-pattern). Everything richer (competitor assumptions,
-- barrier tests, the problem canvas, importance×confidence on conditions) is
-- DELIBERATELY deferred: the founder dogfoods that depth through the
-- p2w-strategy-planning-lab tool on real engagements first, and real use decides
-- what earns a migration. See docs/plans + TECH-SPEC §2.3.
--
-- Architecture laws honored: #1 TRUE RLS on every table (workspace-scoped, via
-- new private helpers that resolve workspace→org and reuse the 0001 membership
-- helpers); #2 loose-first (every cross-object FK is nullable, orphans flagged in
-- app, never blocked here). The `category` CHECK mirrors @bos/p2w's 7 ratified
-- ReCategory values — keep the two in sync (behavior change needs founder sign-off).

-- ── RLS helpers — resolve workspace → org, then reuse the 0001 org helpers ────
-- SECURITY DEFINER (same reason as 0001): the workspaces/memberships lookups must
-- not recurse into RLS. Private schema stays out of the Data API.

create or replace function private.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = ws
      and private.is_org_member(w.org_id)
  )
$$;

create or replace function private.has_workspace_write_role(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspaces w
    where w.id = ws
      and private.has_write_role(w.org_id)
  )
$$;

revoke all on function private.is_workspace_member(uuid) from public;
revoke all on function private.has_workspace_write_role(uuid) from public;
grant execute on function private.is_workspace_member(uuid) to authenticated, service_role;
grant execute on function private.has_workspace_write_role(uuid) to authenticated, service_role;

-- ── Tables (created FK-parent-first: possibilities → aspirations → choices → assumptions) ──

-- The rival ways to win. The heart of P2W: hold 2–4, reverse-engineer each, then
-- promote the winner. `selected` is the one that becomes the committed cascade.
create table public.possibilities (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces (id) on delete cascade,
  short_name            text not null check (length(trim(short_name)) > 0),
  aspiration_hypothesis text,
  where_to_play         text,
  how_to_win            text,
  why_could_win         text,
  what_we_stop          text,
  biggest_unknown       text,
  why_might_fail        text,
  status                text not null default 'proposed'
                          check (status in ('proposed', 'shortlisted', 'selected', 'parked', 'killed')),
  sort                  integer not null default 0,
  created_at            timestamptz not null default now()
);

create index possibilities_workspace_id_idx on public.possibilities (workspace_id);

-- The committed winning aspiration. Versioned + `challenged_at` to feed the
-- Challenge Loop (SPEC §3.1) and the Coherence Score's "recency of challenge".
create table public.aspirations (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces (id) on delete cascade,
  statement             text not null check (length(trim(statement)) > 0),
  version               integer not null default 1 check (version >= 1),
  status                text not null default 'active'
                          check (status in ('active', 'challenged', 'superseded')),
  source_possibility_id uuid references public.possibilities (id) on delete set null, -- loose: provenance of a promoted possibility
  challenged_at         timestamptz,
  created_at            timestamptz not null default now()
);

create index aspirations_workspace_id_idx on public.aspirations (workspace_id);

-- The committed where-to-play / how-to-win choices.
create table public.strategic_choices (
  id                    uuid primary key default gen_random_uuid(),
  workspace_id          uuid not null references public.workspaces (id) on delete cascade,
  aspiration_id         uuid references public.aspirations (id) on delete set null,   -- loose-first
  source_possibility_id uuid references public.possibilities (id) on delete set null, -- loose: promotion provenance
  where_to_play         text,
  how_to_win            text,
  status                text not null default 'active'
                          check (status in ('active', 'superseded')),
  sort                  integer not null default 0,
  created_at            timestamptz not null default now()
);

create index strategic_choices_workspace_id_idx on public.strategic_choices (workspace_id);
create index strategic_choices_aspiration_id_idx on public.strategic_choices (aspiration_id);

-- "What would have to be true" conditions. category mirrors @bos/p2w's 7 RE
-- categories. Attaches to a possibility (during exploration) or a committed
-- choice (after promotion) — both nullable (loose-first).
create table public.assumptions (
  id             uuid primary key default gen_random_uuid(),
  workspace_id   uuid not null references public.workspaces (id) on delete cascade,
  choice_id      uuid references public.strategic_choices (id) on delete set null,
  possibility_id uuid references public.possibilities (id) on delete set null,
  category       text not null check (category in
                   ('SEGMENTS', 'STRUCTURE', 'CHANNELS', 'END_CUSTOMERS', 'CAPABILITIES', 'COSTS', 'REACTION')),
  statement      text not null check (length(trim(statement)) > 0),
  status         text not null default 'untested'
                   check (status in ('untested', 'testing', 'held', 'broken')),
  owner_name     text,
  evidence_note  text,
  created_at     timestamptz not null default now()
);

create index assumptions_workspace_id_idx on public.assumptions (workspace_id);
create index assumptions_choice_id_idx on public.assumptions (choice_id);
create index assumptions_possibility_id_idx on public.assumptions (possibility_id);

-- ── RLS — members read; write roles create/update/delete (viewers read-only) ──

alter table public.possibilities     enable row level security;
alter table public.aspirations       enable row level security;
alter table public.strategic_choices enable row level security;
alter table public.assumptions       enable row level security;

create policy possibilities_select on public.possibilities
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy possibilities_insert on public.possibilities
  for insert to authenticated with check (private.has_workspace_write_role(workspace_id));
create policy possibilities_update on public.possibilities
  for update to authenticated
  using (private.has_workspace_write_role(workspace_id))
  with check (private.has_workspace_write_role(workspace_id));
create policy possibilities_delete on public.possibilities
  for delete to authenticated using (private.has_workspace_write_role(workspace_id));

create policy aspirations_select on public.aspirations
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy aspirations_insert on public.aspirations
  for insert to authenticated with check (private.has_workspace_write_role(workspace_id));
create policy aspirations_update on public.aspirations
  for update to authenticated
  using (private.has_workspace_write_role(workspace_id))
  with check (private.has_workspace_write_role(workspace_id));
create policy aspirations_delete on public.aspirations
  for delete to authenticated using (private.has_workspace_write_role(workspace_id));

create policy strategic_choices_select on public.strategic_choices
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy strategic_choices_insert on public.strategic_choices
  for insert to authenticated with check (private.has_workspace_write_role(workspace_id));
create policy strategic_choices_update on public.strategic_choices
  for update to authenticated
  using (private.has_workspace_write_role(workspace_id))
  with check (private.has_workspace_write_role(workspace_id));
create policy strategic_choices_delete on public.strategic_choices
  for delete to authenticated using (private.has_workspace_write_role(workspace_id));

create policy assumptions_select on public.assumptions
  for select to authenticated using (private.is_workspace_member(workspace_id));
create policy assumptions_insert on public.assumptions
  for insert to authenticated with check (private.has_workspace_write_role(workspace_id));
create policy assumptions_update on public.assumptions
  for update to authenticated
  using (private.has_workspace_write_role(workspace_id))
  with check (private.has_workspace_write_role(workspace_id));
create policy assumptions_delete on public.assumptions
  for delete to authenticated using (private.has_workspace_write_role(workspace_id));

-- ── Grants (anon gets NOTHING — every request carries a valid Clerk JWT) ──────

grant select, insert, update, delete on public.possibilities     to authenticated, service_role;
grant select, insert, update, delete on public.aspirations       to authenticated, service_role;
grant select, insert, update, delete on public.strategic_choices to authenticated, service_role;
grant select, insert, update, delete on public.assumptions       to authenticated, service_role;
