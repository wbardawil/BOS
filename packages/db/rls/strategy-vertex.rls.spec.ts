import { expect, test, type APIRequestContext } from "@playwright/test";
import { mintClerkShapedJwt } from "./jwt";
import {
  ORG_A,
  OUTSIDER,
  readCachedStack,
  USER_A,
  USER_B,
  VIEWER_A,
  WS_A,
  WS_B,
  type LocalStack,
} from "./stack";

// Adversarial RLS for the M1 Strategy vertex (migration 0003): possibilities,
// aspirations, strategic_choices, assumptions. These tables are workspace-scoped
// (not org-scoped), so they exercise the NEW private helpers is_workspace_member
// / has_workspace_write_role. Same contract as every other table: cross-tenant
// reads come back EMPTY, cross-tenant writes are REJECTED or affect ZERO rows,
// verified against ground truth via the service role — and viewers are read-only.

let stack: LocalStack;
let tokenA: string; // owner of ORG_A (WS_A)
let tokenB: string; // owner of ORG_B (WS_B)
let tokenViewerA: string; // viewer in ORG_A — read-only
let tokenOutsider: string; // authenticated, member of nothing

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

/** Ground truth via service role — RLS bypassed on purpose, for verification. */
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

function ids(body: unknown): string[] {
  return (body as Array<{ id?: string }>).map((row) => row.id as string);
}

// Fictional fixture rows, one valid payload per table (confidentiality law:
// everything obviously invented).
function rowFor(table: string, workspaceId: string, marker: string): Record<string, unknown> {
  switch (table) {
    case "possibilities":
      return { workspace_id: workspaceId, short_name: marker, how_to_win: "Fictional differentiation play" };
    case "aspirations":
      return { workspace_id: workspaceId, statement: marker };
    case "strategic_choices":
      return { workspace_id: workspaceId, where_to_play: marker, how_to_win: "Fictional field" };
    case "assumptions":
      return { workspace_id: workspaceId, category: "SEGMENTS", statement: marker };
    default:
      throw new Error(`unknown table ${table}`);
  }
}

const TABLES = ["possibilities", "aspirations", "strategic_choices", "assumptions"] as const;

// The text column each fixture row stamps its unique marker into, per table.
const MARKER_COL: Record<(typeof TABLES)[number], string> = {
  possibilities: "short_name",
  aspirations: "statement",
  strategic_choices: "where_to_play",
  assumptions: "statement",
};

// ── Positive controls first: green-by-total-lockdown is a false pass ─────────

test("control: a write-role member creates and reads back each strategy object in their OWN workspace", async ({
  request,
}) => {
  for (const table of TABLES) {
    const marker = `rls-suite-own-${table}`;
    const created = await rest(request, tokenA, "post", table, rowFor(table, WS_A, marker));
    expect(created.status, table).toBe(201);

    const read = await rest(request, tokenA, "get", `${table}?workspace_id=eq.${WS_A}&select=id`);
    expect(read.status, table).toBe(200);
    expect(ids(read.body).length, table).toBeGreaterThan(0);
  }
});

// ── The adversarial matrix ───────────────────────────────────────────────────

test("cross-tenant SELECTs return empty for every strategy table", async ({ request }) => {
  for (const table of TABLES) {
    const result = await rest(request, tokenB, "get", `${table}?workspace_id=eq.${WS_A}`);
    expect(result.status, table).toBe(200);
    expect(result.body, table).toEqual([]);
  }
});

test("cross-tenant INSERT into the victim workspace is rejected for every table", async ({
  request,
}) => {
  for (const table of TABLES) {
    const marker = `rls-suite-intruder-${table}`;
    const attempt = await rest(request, tokenB, "post", table, rowFor(table, WS_A, marker));
    expect(attempt.status, table).toBe(403);

    const truth = await serviceRows(
      request,
      `${table}?workspace_id=eq.${WS_A}&${MARKER_COL[table]}=eq.${marker}`,
    );
    expect(truth, table).toEqual([]);
  }
});

test("cross-tenant UPDATE / DELETE of a victim possibility affects zero rows", async ({
  request,
}) => {
  // Owner A creates a real victim row; B tries to tamper with it by id.
  const created = await rest(
    request,
    tokenA,
    "post",
    "possibilities",
    rowFor("possibilities", WS_A, "rls-suite-victim"),
  );
  expect(created.status).toBe(201);
  const victimId = ids(created.body)[0];

  const update = await rest(request, tokenB, "patch", `possibilities?id=eq.${victimId}`, {
    short_name: "PWNED (fictional)",
  });
  expect([200, 403, 404]).toContain(update.status);
  if (update.status === 200) expect(update.body).toEqual([]);

  const del = await rest(request, tokenB, "delete", `possibilities?id=eq.${victimId}`);
  expect([200, 403, 404]).toContain(del.status);
  if (del.status === 200) expect(del.body).toEqual([]);

  const truth = await serviceRows(request, `possibilities?id=eq.${victimId}&select=short_name`);
  expect(truth).toHaveLength(1);
  expect(truth[0]?.short_name).not.toBe("PWNED (fictional)");
});

// ── Role + anonymous hardening ────────────────────────────────────────────────

test("viewer can read strategy objects but cannot create them, even in their own workspace", async ({
  request,
}) => {
  const read = await rest(request, tokenViewerA, "get", `possibilities?workspace_id=eq.${WS_A}&select=id`);
  expect(read.status).toBe(200);

  for (const table of TABLES) {
    const write = await rest(
      request,
      tokenViewerA,
      "post",
      table,
      rowFor(table, WS_A, `rls-suite-viewer-${table}`),
    );
    expect(write.status, table).toBe(403);
  }
});

test("a write-role member cannot plant strategy objects in another org's workspace", async ({
  request,
}) => {
  // Owner A is a legitimate writer — but only in ORG_A. WS_B belongs to ORG_B.
  const attempt = await rest(
    request,
    tokenA,
    "post",
    "possibilities",
    rowFor("possibilities", WS_B, "rls-suite-wrong-workspace"),
  );
  expect(attempt.status).toBe(403);

  const truth = await serviceRows(
    request,
    `possibilities?workspace_id=eq.${WS_B}&short_name=eq.rls-suite-wrong-workspace`,
  );
  expect(truth).toEqual([]);
});

test("outsider sees nothing; anonymous is denied outright", async ({ request }) => {
  for (const table of TABLES) {
    const outsider = await rest(request, tokenOutsider, "get", `${table}?select=*`);
    expect(outsider.status, table).toBe(200);
    expect(outsider.body, table).toEqual([]);

    const anonymous = await rest(request, null, "get", `${table}?select=*`);
    expect([401, 403], table).toContain(anonymous.status);
  }
});

// Keep the suite hermetic: drop everything this spec created in ORG_A's
// workspace via the service role (RLS bypassed on purpose, for teardown).
test.afterAll(async ({ request }) => {
  for (const table of TABLES) {
    await request.delete(`${stack.url}/rest/v1/${table}?workspace_id=eq.${WS_A}`, {
      headers: { apikey: stack.serviceRoleKey, Authorization: `Bearer ${stack.serviceRoleKey}` },
    });
  }
});
