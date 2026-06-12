// @bos/ai demo — Prompt 4 definition-of-done: one Haiku flow end-to-end with a
// real usage_ledger row and a real Langfuse trace.
//
// Run from packages/ai with the local Supabase stack up and real keys set:
//   ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY (+ optional LANGFUSE_BASE_URL)
//   pnpm demo
//
// Everything it creates is fictional and deleted afterwards.

import Anthropic from "@anthropic-ai/sdk";
import { Langfuse } from "langfuse";
import { z } from "zod";
import { createServiceClient } from "@bos/db";
import {
  buildWorkspaceContextSystem,
  createLangfuseTracer,
  runFlow,
  type MessagesApi,
} from "../src/index";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing env var ${name} — see .env.example. Demo aborted.`);
    process.exit(1);
  }
  return value;
}

const anthropicKey = requireEnv("ANTHROPIC_API_KEY");
requireEnv("NEXT_PUBLIC_SUPABASE_URL");
requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const langfusePublic = requireEnv("LANGFUSE_PUBLIC_KEY");
const langfuseSecret = requireEnv("LANGFUSE_SECRET_KEY");

const anthropic = new Anthropic({ apiKey: anthropicKey });
const langfuse = new Langfuse({
  publicKey: langfusePublic,
  secretKey: langfuseSecret,
  baseUrl: process.env.LANGFUSE_BASE_URL,
});

// Demo runs as a "job" — service client with explicit scope + reason (law #1).
const db = createServiceClient({
  orgId: "demo-bootstrap",
  reason: "demo:@bos/ai prompt-4 definition-of-done",
});

const outputSchema = z.object({
  headline: z.string(),
  tone: z.enum(["upbeat", "neutral", "urgent"]),
});

async function main(): Promise<void> {
  // 1. Fictional org to own the spend (FK target for the ledger row).
  const { data: org, error: orgError } = await db
    .from("organizations")
    .insert({ name: "Fictional Demo Advisory (bos-ai demo)" })
    .select()
    .single();
  if (orgError || !org) throw new Error(`demo org insert failed: ${orgError?.message}`);
  console.log(`Created fictional demo org ${org.id}`);

  try {
    // 2. One routine-class flow → routed to Haiku per law #4.
    const result = await runFlow(
      {
        // `anthropic.messages` satisfies the structural MessagesApi
        messages: anthropic.messages as unknown as MessagesApi,
        db,
        tracer: createLangfuseTracer(langfuse),
        monthlyCapCents: 500, // $5 demo cap
      },
      {
        name: "demo-headline",
        actionClass: "routine",
        auth: () => ({ orgId: org.id }),
        inputSchema: z.object({ topic: z.string().min(1) }),
        prompt: (input) => ({
          system: buildWorkspaceContextSystem({
            stable:
              "You are the Digital Chief of Staff demo writer. " +
              "All content you produce is obviously fictional.",
            volatile: `Demo run id: ${org.id}`,
          }),
          user: `Write a one-line strategy newsletter headline about: ${input.topic}. Include a tone field of "upbeat", "neutral", or "urgent".`,
        }),
        outputSchema,
      },
      { topic: "a fictional bakery chain entering a new fictional market" },
      null,
    );
    console.log("Flow output:", result);

    // 3. Prove the ledger row exists.
    const { data: rows, error: ledgerError } = await db
      .from("usage_ledger")
      .select("action, model, tokens_in, tokens_out, cost_cents, status")
      .eq("org_id", org.id);
    if (ledgerError) throw new Error(ledgerError.message);
    console.log("usage_ledger rows:", rows);
    if (!rows || rows.length === 0) {
      throw new Error("DoD FAILED: no usage_ledger row was written");
    }

    // 4. Flush the Langfuse trace.
    await langfuse.flushAsync();
    console.log("Langfuse trace flushed — check the demo-headline trace in the UI.");
    console.log("DoD ✅ — flow ran on Haiku, ledger row written, trace sent.");
  } finally {
    // 5. Clean up (cascade removes the ledger rows).
    await db.from("organizations").delete().eq("id", org.id);
    console.log("Deleted fictional demo org.");
  }
}

main().catch((error) => {
  console.error("Demo failed:", error);
  process.exitCode = 1;
});
