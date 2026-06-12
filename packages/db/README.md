# @bos/db — tenancy clients + the adversarial RLS suite

## The two-client law (architecture law #1)

There are exactly two ways to talk to the database, and the default is always
the first one:

| | `createAnonClient` | `createServiceClient` |
|---|---|---|
| **Who uses it** | Every user-facing path: server components, route handlers, server actions | Background jobs ONLY (Inngest), never anything a user request flows through |
| **Key** | anon key + the caller's Clerk JWT (`accessToken` callback) | service-role key |
| **RLS** | Enforced by Postgres. The client physically cannot see another org's rows | **Bypassed.** That is why it is caged |
| **Required at construction** | `accessToken` callback (refuses to build without it) | Explicit `orgId` + human-readable `reason`; every instantiation is logged |

If you are writing application code and reaching for `createServiceClient`,
stop: you are about to introduce the class of bug this package exists to make
impossible. A service client used in a user-facing path is a **bug, not a style
issue** (CLAUDE.md, law #1).

```ts
// User-facing (Next.js server context, Clerk session available):
import { auth } from "@clerk/nextjs/server";
import { createAnonClient } from "@bos/db";

const client = createAnonClient({
  accessToken: async () => (await auth()).getToken(),
});

// Job-side (Inngest only):
import { createServiceClient } from "@bos/db";

const client = createServiceClient({
  orgId: run.orgId,                       // explicit scope, always
  reason: "inngest:weekly-cadence-digest", // attributable, always
});
// The service role bypasses RLS — every query MUST filter by the declared org.
```

## How tenancy is enforced (migration 0001)

- `organizations` / `memberships` / `workspaces`, RLS enabled on all three.
- Policies resolve the caller via `auth.jwt()->>'sub'` — the Clerk user id —
  through `SECURITY DEFINER` helpers in the `private` schema (not API-exposed,
  immune to membership-policy recursion).
- The `anon` role has **zero grants** on these tables: no valid user JWT, no data.
- Orgs are created only through the `create_organization()` RPC, which inserts
  the org and its owner membership atomically (a permissive INSERT policy would
  allow orphaned or hijacked orgs).
- Viewers are read-only: write policies require role
  `owner|consultant|executive|contributor`.

## The adversarial RLS suite

`pnpm test:rls` (from the repo root) runs `rls/tenancy.rls.spec.ts` with
Playwright (API-only, no browser). It seeds two fictional orgs and four users,
then attempts every cross-tenant read and write in both directions. Reads must
return **empty**, writes must return **403 or affect zero rows**, and every
write attempt is verified against ground truth via the service role — not just
by status code. Positive controls guard against the suite passing because
everything is locked down.

Prerequisites: Docker running, then `pnpm exec supabase start` once and
`pnpm exec supabase db reset` after migration changes.

## Clerk wiring — spike status (read this before Prompt 5)

**What is verified today (local mode):** the suite mints HS256 JWTs with the
local stack's JWT secret, shaped exactly like Clerk third-party tokens
(`sub` = Clerk user id, `role: "authenticated"`). Everything Postgres-side —
policies, helpers, grants, the RPC — is exercised for real.

**What is NOT yet verified (live mode):** the Clerk↔Supabase handshake itself,
i.e. Supabase validating Clerk-issued asymmetric JWTs via Clerk's JWKS. This
needs founder-owned accounts that do not exist yet. To complete the spike:

1. Create the Clerk app and the hosted Supabase project.
2. In Clerk: run the Supabase integration setup (<https://clerk.com/setup/supabase>)
   — this configures session tokens to carry `role: "authenticated"`.
3. In Supabase (hosted): Auth → Third-Party Auth → add Clerk with the Clerk
   domain. Locally: set `domain` and `enabled = true` under
   `[auth.third_party.clerk]` in `supabase/config.toml`.
4. Sign in as two real test users from two orgs and re-run the cross-tenant
   matrix with their session tokens. Same expected results: empty/403.

Risk assessment for the fallback decision (TECH-SPEC §4.2): the Postgres side
is done and proven; the remaining integration is configuration, not code. The
fallback to Supabase Auth would only be needed if step 3/4 fails, and nothing
observed so far suggests it will.
