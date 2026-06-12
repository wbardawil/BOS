import { expect, test, type APIRequestContext } from "@playwright/test";
import { mintClerkShapedJwt } from "./jwt";
import {
  ORG_A,
  ORG_B,
  OUTSIDER,
  readCachedStack,
  USER_A,
  USER_B,
  VIEWER_A,
  WS_A,
  type LocalStack,
} from "./stack";

// Adversarial RLS for usage_ledger (Prompt 4 / migration 0002a).
// The ledger drives the per-org monthly cost cap in @bos/ai, so it is
// append-only for authenticated users: SELECT + INSERT in your own org,
// nothing cross-tenant, and UPDATE/DELETE denied for everyone.

let stack: LocalStack;
let tokenA: string;
let tokenB: string;
let tokenViewerA: string;
let tokenOutsider: string;

test.beforeAll(async () => {
  stack = readCachedStack();
  [tokenA, tokenB, tokenViewerA, tokenOutsider] = await Promise.all([
    mintClerkShapedJwt(USER_A, stack.jwtSecret),
    mintClerkShapedJwt(USER_B, stack.jwtSecret),
    mintClerkShapedJwt(VIEWER_A, stack.jwtSecret),
    mintClerkShapedJwt(OUTSIDER, stack.jwtSecret),
  ]);
});

interface RestResult {
  status: number;
  body: unknown;
}

async function rest(
  request: APIRequestContext,
  token: string | null,
  method: "get" | "post" | "patch" | "delete",
  path: string,
  body?: unknown,
): Promise<RestResult> {
  const headers: Record<string, string> = {
    apikey: stack.anonKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await request[method](`${stack.url}/rest/v1/${path}`, {
    headers,
    data: body === undefined ? undefined : body,
  });
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: response.status(), body: parsed };
}

async function serviceRows(
  request: APIRequestContext,
  path: string,
): Promise<Array<Record<string, unknown>>> {
  const response = await request.get(`${stack.url}/rest/v1/${path}`, {
    headers: {
      apikey: stack.serviceRoleKey,
      Authorization: `Bearer ${stack.serviceRoleKey}`,
    },
  });
  expect(response.ok()).toBe(true);
  return (await response.json()) as Array<Record<string, unknown>>;
}

function entry(orgId: string, action: string) {
  return {
    org_id: orgId,
    action,
    model: "claude-haiku-4-5",
    tokens_in: 100,
    tokens_out: 50,
    cost_cents: 1,
  };
}

test("control: a write-role member meters a call in their OWN org and reads it back", async ({
  request,
}) => {
  const created = await rest(
    request,
    tokenA,
    "post",
    "usage_ledger",
    entry(ORG_A, "rls-suite-own-org"),
  );
  expect(created.status).toBe(201);

  const read = await rest(
    request,
    tokenA,
    "get",
    `usage_ledger?action=eq.rls-suite-own-org&select=org_id,cost_cents`,
  );
  expect(read.status).toBe(200);
  expect(read.body).toEqual([{ org_id: ORG_A, cost_cents: 1 }]);

  // workspace_id is accepted when it belongs to the same org
  const withWs = await rest(request, tokenA, "post", "usage_ledger", {
    ...entry(ORG_A, "rls-suite-own-org-ws"),
    workspace_id: WS_A,
  });
  expect(withWs.status).toBe(201);
});

test("cross-tenant: B cannot read A's ledger, and vice versa", async ({
  request,
}) => {
  for (const [token, victimOrg] of [
    [tokenB, ORG_A],
    [tokenA, ORG_B],
  ] as const) {
    const result = await rest(
      request,
      token,
      "get",
      `usage_ledger?org_id=eq.${victimOrg}`,
    );
    expect(result.status).toBe(200);
    expect(result.body).toEqual([]);
  }
});

test("cross-tenant: inserting spend into the victim org is rejected", async ({
  request,
}) => {
  const attempt = await rest(
    request,
    tokenB,
    "post",
    "usage_ledger",
    entry(ORG_A, "rls-suite-intruder"),
  );
  expect(attempt.status).toBe(403);
  const truth = await serviceRows(
    request,
    `usage_ledger?action=eq.rls-suite-intruder`,
  );
  expect(truth).toEqual([]);
});

test("append-only: even the org owner cannot UPDATE or DELETE ledger rows", async ({
  request,
}) => {
  await rest(request, tokenA, "post", "usage_ledger", entry(ORG_A, "rls-suite-immutable"));

  const update = await rest(
    request,
    tokenA,
    "patch",
    `usage_ledger?action=eq.rls-suite-immutable`,
    { cost_cents: 0 },
  );
  // No UPDATE grant for authenticated — denied at the permission layer.
  expect([401, 403, 404, 405]).toContain(update.status);

  const del = await rest(
    request,
    tokenA,
    "delete",
    `usage_ledger?action=eq.rls-suite-immutable`,
  );
  expect([401, 403, 404, 405]).toContain(del.status);

  const truth = await serviceRows(
    request,
    `usage_ledger?action=eq.rls-suite-immutable&select=cost_cents`,
  );
  expect(truth).toEqual([{ cost_cents: 1 }]);
});

test("viewer can read their org's spend but cannot append to it", async ({
  request,
}) => {
  const read = await rest(request, tokenViewerA, "get", "usage_ledger?select=org_id");
  expect(read.status).toBe(200);
  for (const row of read.body as Array<{ org_id: string }>) {
    expect(row.org_id).toBe(ORG_A);
  }

  const write = await rest(
    request,
    tokenViewerA,
    "post",
    "usage_ledger",
    entry(ORG_A, "rls-suite-viewer-smuggle"),
  );
  expect(write.status).toBe(403);
});

test("outsider sees nothing; anonymous is denied outright", async ({
  request,
}) => {
  const outsider = await rest(request, tokenOutsider, "get", "usage_ledger?select=*");
  expect(outsider.status).toBe(200);
  expect(outsider.body).toEqual([]);

  const anonymous = await rest(request, null, "get", "usage_ledger?select=*");
  expect([401, 403]).toContain(anonymous.status);
});
