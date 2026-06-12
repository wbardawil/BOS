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
  WS_B,
  type LocalStack,
} from "./stack";

// THE ADVERSARIAL RLS SUITE (architecture law #1).
// Two orgs, two users. Every cross-tenant read must come back EMPTY and every
// cross-tenant write must be REJECTED (403) or silently affect ZERO rows —
// verified against the database via the service role, not just by status code.

let stack: LocalStack;
let tokenA: string; // owner of ORG_A
let tokenB: string; // owner of ORG_B
let tokenViewerA: string; // viewer in ORG_A
let tokenOutsider: string; // authenticated but member of nothing

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
  return (body as Array<{ id?: string; org_id?: string }>).map(
    (row) => (row.id ?? row.org_id) as string,
  );
}

// ── Positive controls first: green-by-total-lockdown is a false pass ─────────

test("control: each owner sees exactly their own org, membership, workspace", async ({
  request,
}) => {
  for (const [token, orgId, wsId] of [
    [tokenA, ORG_A, WS_A],
    [tokenB, ORG_B, WS_B],
  ] as const) {
    const orgs = await rest(request, token, "get", "organizations?select=id");
    expect(orgs.status).toBe(200);
    expect(ids(orgs.body)).toEqual([orgId]);

    const workspaces = await rest(request, token, "get", "workspaces?select=id");
    expect(workspaces.status).toBe(200);
    expect(ids(workspaces.body)).toEqual([wsId]);
  }
});

test("control: an owner can create and delete a workspace in their OWN org", async ({
  request,
}) => {
  const created = await rest(request, tokenA, "post", "workspaces", {
    org_id: ORG_A,
    client_name: "Fictional Client Cascade (temp)",
  });
  expect(created.status).toBe(201);
  const newId = ids(created.body)[0];
  const deleted = await rest(
    request,
    tokenA,
    "delete",
    `workspaces?id=eq.${newId}`,
  );
  expect(deleted.status).toBe(200);
  expect(ids(deleted.body)).toEqual([newId]);
});

// ── The adversarial matrix, both directions ──────────────────────────────────

const DIRECTIONS = [
  {
    name: "A attacks B",
    attacker: () => tokenA,
    victimOrg: ORG_B,
    victimWs: WS_B,
    victimUser: USER_B,
  },
  {
    name: "B attacks A",
    attacker: () => tokenB,
    victimOrg: ORG_A,
    victimWs: WS_A,
    victimUser: USER_A,
  },
];

for (const dir of DIRECTIONS) {
  test.describe(dir.name, () => {
    test("cross-tenant SELECTs return empty", async ({ request }) => {
      for (const path of [
        `organizations?id=eq.${dir.victimOrg}`,
        `memberships?org_id=eq.${dir.victimOrg}`,
        `workspaces?org_id=eq.${dir.victimOrg}`,
        `workspaces?id=eq.${dir.victimWs}`,
      ]) {
        const result = await rest(request, dir.attacker(), "get", path);
        expect(result.status, path).toBe(200);
        expect(result.body, path).toEqual([]);
      }
    });

    test("UPDATE victim org is rejected and changes nothing", async ({
      request,
    }) => {
      const attempt = await rest(
        request,
        dir.attacker(),
        "patch",
        `organizations?id=eq.${dir.victimOrg}`,
        { name: "PWNED (fictional)" },
      );
      expect([200, 403, 404]).toContain(attempt.status);
      if (attempt.status === 200) expect(attempt.body).toEqual([]);
      const truth = await serviceRows(
        request,
        `organizations?id=eq.${dir.victimOrg}&select=name`,
      );
      expect(truth[0]?.name).not.toBe("PWNED (fictional)");
    });

    test("INSERT workspace into victim org is rejected", async ({ request }) => {
      const attempt = await rest(request, dir.attacker(), "post", "workspaces", {
        org_id: dir.victimOrg,
        client_name: "Fictional Intruder Client",
      });
      expect(attempt.status).toBe(403);
      const truth = await serviceRows(
        request,
        `workspaces?org_id=eq.${dir.victimOrg}&client_name=eq.${encodeURIComponent("Fictional Intruder Client")}`,
      );
      expect(truth).toEqual([]);
    });

    test("UPDATE / DELETE victim workspace affects zero rows", async ({
      request,
    }) => {
      const update = await rest(
        request,
        dir.attacker(),
        "patch",
        `workspaces?id=eq.${dir.victimWs}`,
        { client_name: "PWNED (fictional)" },
      );
      expect([200, 403, 404]).toContain(update.status);
      if (update.status === 200) expect(update.body).toEqual([]);

      const del = await rest(
        request,
        dir.attacker(),
        "delete",
        `workspaces?id=eq.${dir.victimWs}`,
      );
      expect([200, 403, 404]).toContain(del.status);
      if (del.status === 200) expect(del.body).toEqual([]);

      const truth = await serviceRows(
        request,
        `workspaces?id=eq.${dir.victimWs}&select=id,client_name`,
      );
      expect(truth).toHaveLength(1);
      expect(truth[0]?.client_name).not.toBe("PWNED (fictional)");
    });

    test("self-add membership into victim org is rejected", async ({
      request,
    }) => {
      const attacker = dir.attacker() === tokenA ? USER_A : USER_B;
      const attempt = await rest(request, dir.attacker(), "post", "memberships", {
        org_id: dir.victimOrg,
        user_id: attacker,
        role: "owner",
      });
      expect(attempt.status).toBe(403);
      const truth = await serviceRows(
        request,
        `memberships?org_id=eq.${dir.victimOrg}&user_id=eq.${attacker}`,
      );
      expect(truth).toEqual([]);
    });

    test("UPDATE / DELETE victim membership affects zero rows", async ({
      request,
    }) => {
      const update = await rest(
        request,
        dir.attacker(),
        "patch",
        `memberships?org_id=eq.${dir.victimOrg}&user_id=eq.${dir.victimUser}`,
        { role: "viewer" },
      );
      expect([200, 403, 404]).toContain(update.status);
      if (update.status === 200) expect(update.body).toEqual([]);

      const del = await rest(
        request,
        dir.attacker(),
        "delete",
        `memberships?org_id=eq.${dir.victimOrg}&user_id=eq.${dir.victimUser}`,
      );
      expect([200, 403, 404]).toContain(del.status);
      if (del.status === 200) expect(del.body).toEqual([]);

      const truth = await serviceRows(
        request,
        `memberships?org_id=eq.${dir.victimOrg}&user_id=eq.${dir.victimUser}&select=role`,
      );
      expect(truth).toEqual([{ role: "owner" }]);
    });
  });
}

// ── Role + anonymous hardening ────────────────────────────────────────────────

test("viewer can read but NOT write, even inside their own org", async ({
  request,
}) => {
  const read = await rest(request, tokenViewerA, "get", "workspaces?select=id");
  expect(read.status).toBe(200);
  expect(ids(read.body)).toEqual([WS_A]);

  const write = await rest(request, tokenViewerA, "post", "workspaces", {
    org_id: ORG_A,
    client_name: "Fictional Viewer Smuggle",
  });
  expect(write.status).toBe(403);

  const update = await rest(
    request,
    tokenViewerA,
    "patch",
    `workspaces?id=eq.${WS_A}`,
    { client_name: "PWNED by viewer (fictional)" },
  );
  expect([200, 403, 404]).toContain(update.status);
  if (update.status === 200) expect(update.body).toEqual([]);
});

test("authenticated user with NO memberships sees nothing everywhere", async ({
  request,
}) => {
  for (const path of ["organizations", "memberships", "workspaces"]) {
    const result = await rest(request, tokenOutsider, "get", `${path}?select=*`);
    expect(result.status, path).toBe(200);
    expect(result.body, path).toEqual([]);
  }
});

test("anonymous requests (anon key, no user JWT) are denied outright", async ({
  request,
}) => {
  for (const path of ["organizations", "memberships", "workspaces"]) {
    const result = await rest(request, null, "get", `${path}?select=*`);
    expect([401, 403], path).toContain(result.status);
  }
});

test("organizations cannot be created by direct INSERT — only via RPC", async ({
  request,
}) => {
  const direct = await rest(request, tokenA, "post", "organizations", {
    name: "RLS-Suite Direct Insert (fictional)",
  });
  expect(direct.status).toBe(403);
});

test("create_organization RPC creates org + owner membership, invisible cross-tenant", async ({
  request,
}) => {
  const created = await rest(
    request,
    tokenOutsider,
    "post",
    "rpc/create_organization",
    { org_name: "RLS-Suite RPC Org (fictional)", org_kind: "practice" },
  );
  expect(created.status).toBe(200);
  const org = created.body as { id: string; name: string };
  expect(org.name).toBe("RLS-Suite RPC Org (fictional)");

  // Creator is owner and can see it…
  const mine = await rest(
    request,
    tokenOutsider,
    "get",
    `organizations?id=eq.${org.id}`,
  );
  expect(ids(mine.body)).toEqual([org.id]);
  const membership = await rest(
    request,
    tokenOutsider,
    "get",
    `memberships?org_id=eq.${org.id}&select=role`,
  );
  expect(membership.body).toEqual([{ role: "owner" }]);

  // …while everyone else sees nothing.
  for (const token of [tokenA, tokenB, tokenViewerA]) {
    const other = await rest(request, token, "get", `organizations?id=eq.${org.id}`);
    expect(other.body).toEqual([]);
  }
});

test("anonymous caller cannot invoke create_organization", async ({ request }) => {
  const attempt = await rest(request, null, "post", "rpc/create_organization", {
    org_name: "RLS-Suite Anon Org (fictional)",
  });
  expect([401, 403, 404]).toContain(attempt.status);
});
