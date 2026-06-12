import {
  ORG_A,
  ORG_B,
  resolveLocalStack,
  USER_A,
  USER_B,
  VIEWER_A,
  WS_A,
  WS_B,
  type LocalStack,
} from "./stack";

// Seeds two fully fictional tenants via the service role. Idempotent: deletes
// the fixture orgs first (FK cascade wipes memberships + workspaces), then
// re-inserts, so a crashed previous run can never poison this one.

async function serviceRequest(
  stack: LocalStack,
  method: string,
  path: string,
  body?: unknown,
): Promise<unknown> {
  const response = await fetch(`${stack.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: stack.serviceRoleKey,
      Authorization: `Bearer ${stack.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `RLS seed: ${method} ${path} failed (${response.status}): ${text}`,
    );
  }
  return text ? JSON.parse(text) : null;
}

export default async function globalSetup(): Promise<void> {
  const stack = resolveLocalStack();

  // Wipe fixture orgs + any leftovers from the create_organization RPC test.
  await serviceRequest(stack, "DELETE", `organizations?id=in.(${ORG_A},${ORG_B})`);
  await serviceRequest(
    stack,
    "DELETE",
    `organizations?name=like.${encodeURIComponent("RLS-Suite*")}`,
  );

  await serviceRequest(stack, "POST", "organizations", [
    { id: ORG_A, name: "Fictional Alpha Advisory (RLS fixture)", kind: "practice" },
    { id: ORG_B, name: "Fictional Bravo Industries (RLS fixture)", kind: "company" },
  ]);

  await serviceRequest(stack, "POST", "memberships", [
    { org_id: ORG_A, user_id: USER_A, role: "owner" },
    { org_id: ORG_A, user_id: VIEWER_A, role: "viewer" },
    { org_id: ORG_B, user_id: USER_B, role: "owner" },
  ]);

  await serviceRequest(stack, "POST", "workspaces", [
    { id: WS_A, org_id: ORG_A, client_name: "Fictional Client Andes" },
    { id: WS_B, org_id: ORG_B, client_name: "Fictional Client Baltic" },
  ]);
}
