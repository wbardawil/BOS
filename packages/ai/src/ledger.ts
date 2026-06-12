// @bos/ai — usage metering (schema law #2: every LLM call writes usage_ledger,
// no exceptions — success AND failure).

import type { BosClient } from "@bos/db";
import type { UsageLedgerStatus } from "@bos/db";

export interface UsageLedgerEntry {
  orgId: string;
  workspaceId?: string | null;
  action: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  status: UsageLedgerStatus;
}

/** Append one ledger row. Throws if the insert fails — metering is not optional. */
export async function recordUsage(
  db: BosClient,
  entry: UsageLedgerEntry,
): Promise<void> {
  const { error } = await db.from("usage_ledger").insert({
    org_id: entry.orgId,
    workspace_id: entry.workspaceId ?? null,
    action: entry.action,
    model: entry.model,
    tokens_in: entry.tokensIn,
    tokens_out: entry.tokensOut,
    cost_cents: entry.costCents,
    status: entry.status,
  });
  if (error) {
    throw new Error(`@bos/ai recordUsage: ledger insert failed — ${error.message}`);
  }
}

/** Start of the current UTC month for `now`. */
export function monthStartIso(now: Date): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  ).toISOString();
}

/** Sum of an org's successful spend (cents) in the current UTC month. */
export async function monthlySpendCents(
  db: BosClient,
  orgId: string,
  now: Date,
): Promise<number> {
  const { data, error } = await db
    .from("usage_ledger")
    .select("cost_cents")
    .eq("org_id", orgId)
    .gte("created_at", monthStartIso(now));
  if (error) {
    throw new Error(
      `@bos/ai monthlySpendCents: ledger read failed — ${error.message}`,
    );
  }
  return (data ?? []).reduce((sum, row) => sum + row.cost_cents, 0);
}
