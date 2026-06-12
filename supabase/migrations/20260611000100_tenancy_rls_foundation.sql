-- Migration 0001 — Tenancy + RLS foundation (TECH-SPEC §2.3 "TENANCY" block).
--
-- Architecture law #1: TRUE RLS on every table. org_id scoping is enforced HERE,
-- in Postgres, via the caller's Clerk JWT (third-party auth) — never only in app
-- code. The `anon` role gets NO grants on these tables: unauthenticated requests
-- fail at the permission layer before RLS is even consulted.
--
-- Identity model:
--   * Clerk is the identity provider. Supabase validates Clerk JWTs via
--     third-party auth (config.toml [auth.third_party.clerk]).
--   * auth.jwt()->>'sub' is the Clerk user id. memberships maps it to orgs.
--   * Helper functions live in the `private` schema (not API-exposed) and are
--     SECURITY DEFINER so the memberships lookup itself never recurses into RLS.

create schema if not exists private;

-- Policies run helper functions AS THE CALLING ROLE, so authenticated needs
-- USAGE on the schema (but the schema stays out of the Data API's exposed list).
grant usage on schema private to authenticated, service_role;

-- ── Tables ───────────────────────────────────────────────────────────────────

create table public.organizations (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (length(trim(name)) > 0),
  kind               text not null default 'practice' check (kind in ('practice', 'company')),
  stripe_customer_id text,
  created_at         timestamptz not null default now()
);

create table public.memberships (
  org_id     uuid not null references public.organizations (id) on delete cascade,
  user_id    text not null, -- Clerk user id (JWT `sub` claim)
  role       text not null check (role in ('owner', 'consultant', 'executive', 'contributor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index memberships_user_id_idx on public.memberships (user_id);

create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations (id) on delete cascade,
  client_name text not null check (length(trim(client_name)) > 0),
  created_at  timestamptz not null default now(),
  archived_at timestamptz
);

create index workspaces_org_id_idx on public.workspaces (org_id);

-- ── RLS helpers (private schema — never exposed through the Data API) ────────

create or replace function private.clerk_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(auth.jwt()->>'sub', '')
$$;

-- SECURITY DEFINER: runs as the migration owner, which bypasses RLS on
-- memberships. This is the standard pattern to avoid infinite recursion when
-- membership policies need to read the memberships table itself.
create or replace function private.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = org
      and m.user_id = private.clerk_user_id()
  )
$$;

create or replace function private.is_org_owner(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = org
      and m.user_id = private.clerk_user_id()
      and m.role = 'owner'
  )
$$;

-- Members who may write workspace content. Viewers are read-only.
create or replace function private.has_write_role(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.org_id = org
      and m.user_id = private.clerk_user_id()
      and m.role in ('owner', 'consultant', 'executive', 'contributor')
  )
$$;

revoke all on function private.clerk_user_id() from public;
revoke all on function private.is_org_member(uuid) from public;
revoke all on function private.is_org_owner(uuid) from public;
revoke all on function private.has_write_role(uuid) from public;
grant execute on function private.clerk_user_id() to authenticated, service_role;
grant execute on function private.is_org_member(uuid) to authenticated, service_role;
grant execute on function private.is_org_owner(uuid) to authenticated, service_role;
grant execute on function private.has_write_role(uuid) to authenticated, service_role;

-- ── RLS ──────────────────────────────────────────────────────────────────────

alter table public.organizations enable row level security;
alter table public.memberships   enable row level security;
alter table public.workspaces    enable row level security;

-- organizations: members read; owners update; nobody inserts directly (org
-- creation goes through create_organization() so the owner membership is
-- created atomically — a permissive INSERT policy would orphan the org);
-- nobody deletes in v1.
create policy organizations_select on public.organizations
  for select to authenticated
  using (private.is_org_member(id));

create policy organizations_update on public.organizations
  for update to authenticated
  using (private.is_org_owner(id))
  with check (private.is_org_owner(id));

-- memberships: members see their org's roster; only owners manage it.
-- No self-service INSERT — that would let any user add themselves to any org.
create policy memberships_select on public.memberships
  for select to authenticated
  using (private.is_org_member(org_id));

create policy memberships_insert on public.memberships
  for insert to authenticated
  with check (private.is_org_owner(org_id));

create policy memberships_update on public.memberships
  for update to authenticated
  using (private.is_org_owner(org_id))
  with check (private.is_org_owner(org_id));

create policy memberships_delete on public.memberships
  for delete to authenticated
  using (private.is_org_owner(org_id));

-- workspaces: members read; write roles create/update/delete.
create policy workspaces_select on public.workspaces
  for select to authenticated
  using (private.is_org_member(org_id));

create policy workspaces_insert on public.workspaces
  for insert to authenticated
  with check (private.has_write_role(org_id));

create policy workspaces_update on public.workspaces
  for update to authenticated
  using (private.has_write_role(org_id))
  with check (private.has_write_role(org_id));

create policy workspaces_delete on public.workspaces
  for delete to authenticated
  using (private.has_write_role(org_id));

-- ── Org creation RPC (atomic org + owner membership) ─────────────────────────

create or replace function public.create_organization(org_name text, org_kind text default 'practice')
returns public.organizations
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid     text := private.clerk_user_id();
  new_org public.organizations;
begin
  if uid is null then
    raise exception 'create_organization requires an authenticated user'
      using errcode = '42501';
  end if;
  if org_kind not in ('practice', 'company') then
    raise exception 'invalid organization kind: %', org_kind;
  end if;

  insert into public.organizations (name, kind)
  values (org_name, org_kind)
  returning * into new_org;

  insert into public.memberships (org_id, user_id, role)
  values (new_org.id, uid, 'owner');

  return new_org;
end;
$$;

revoke all on function public.create_organization(text, text) from public, anon;
grant execute on function public.create_organization(text, text) to authenticated, service_role;

-- ── Grants (config.toml does not auto-expose new tables — intentional) ───────
-- `anon` deliberately gets NOTHING: every request must carry a valid Clerk JWT.

grant select, insert, update, delete on public.organizations to authenticated, service_role;
grant select, insert, update, delete on public.memberships   to authenticated, service_role;
grant select, insert, update, delete on public.workspaces    to authenticated, service_role;
