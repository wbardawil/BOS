import { describe, expect, it } from "vitest";
import { z } from "zod";
import type { BosClient } from "@bos/db";
import {
  runFlow,
  type AnthropicMessageLike,
  type FlowDefinition,
  type FlowDeps,
  type MessageCreateParams,
} from "./flow";
import {
  CostCapExceededError,
  FlowGateError,
  FlowGuardError,
  FlowInputError,
  FlowOutputParseError,
  ModelRefusalError,
} from "./errors";
import { monthlySpendCents } from "./ledger";
import type { FlowTraceEvent, Tracer } from "./tracing";

// ── Fakes (no network, no Supabase — the flow contract is what's under test) ─

interface LedgerRow {
  org_id: string;
  workspace_id: string | null;
  action: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_cents: number;
  status: string;
  created_at: string;
}

class FakeDb {
  ledger: LedgerRow[] = [];
  insertError: string | null = null;

  seed(row: Partial<LedgerRow> & { org_id: string; cost_cents: number }): void {
    this.ledger.push({
      workspace_id: null,
      action: "seed",
      model: "claude-haiku-4-5",
      tokens_in: 0,
      tokens_out: 0,
      status: "success",
      created_at: new Date().toISOString(),
      ...row,
    });
  }

  from(table: string) {
    if (table !== "usage_ledger") throw new Error(`unexpected table ${table}`);
    const self = this;
    return {
      insert(row: Omit<LedgerRow, "created_at">) {
        if (self.insertError) {
          return Promise.resolve({ error: { message: self.insertError } });
        }
        self.ledger.push({ created_at: new Date().toISOString(), ...row });
        return Promise.resolve({ error: null });
      },
      select(_columns: string) {
        let orgId: string | undefined;
        const builder = {
          eq(_col: string, value: string) {
            orgId = value;
            return builder;
          },
          gte(_col: string, value: string) {
            const data = self.ledger
              .filter((r) => r.org_id === orgId && r.created_at >= value)
              .map((r) => ({ cost_cents: r.cost_cents }));
            return Promise.resolve({ data, error: null });
          },
        };
        return builder;
      },
    };
  }

  asClient(): BosClient {
    return this as unknown as BosClient;
  }
}

function message(
  text: string,
  usage: Partial<AnthropicMessageLike["usage"]> = {},
  stopReason = "end_turn",
): AnthropicMessageLike {
  return {
    content: [{ type: "text", text }],
    stop_reason: stopReason,
    usage: { input_tokens: 1000, output_tokens: 500, ...usage },
  };
}

class FakeMessages {
  calls: MessageCreateParams[] = [];
  private responses: Array<AnthropicMessageLike | Error>;

  constructor(...responses: Array<AnthropicMessageLike | Error>) {
    this.responses = responses;
  }

  create(params: MessageCreateParams): Promise<AnthropicMessageLike> {
    this.calls.push(params);
    const next = this.responses.shift();
    if (!next) throw new Error("FakeMessages: no scripted response left");
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next);
  }
}

class FakeTracer implements Tracer {
  events: FlowTraceEvent[] = [];
  record(event: FlowTraceEvent): void {
    this.events.push(event);
  }
}

const outputSchema = z.object({ headline: z.string(), tone: z.string() });
type Output = z.infer<typeof outputSchema>;

function definition(
  overrides: Partial<FlowDefinition<{ topic: string }, Output, string>> = {},
): FlowDefinition<{ topic: string }, Output, string> {
  return {
    name: "demo-headline",
    actionClass: "routine",
    auth: (orgId: string) => ({ orgId, workspaceId: "ws-fictional-1" }),
    inputSchema: z.object({ topic: z.string().min(1) }),
    prompt: (input) => ({
      system: [{ type: "text", text: "You write fictional headlines." }],
      user: `Write a headline about ${input.topic}.`,
    }),
    outputSchema,
    ...overrides,
  };
}

function makeDeps(
  db: FakeDb,
  messages: FakeMessages,
  tracer?: FakeTracer,
  capCents = 10_000,
): FlowDeps {
  return {
    messages,
    db: db.asClient(),
    tracer,
    monthlyCapCents: capCents,
  };
}

const GOOD_JSON = JSON.stringify({ headline: "Fictional Win", tone: "upbeat" });

// ── Happy path ────────────────────────────────────────────────────────────────

describe("runFlow — happy path", () => {
  it("routes, calls, parses, meters, and traces one Haiku call", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(message(GOOD_JSON));
    const tracer = new FakeTracer();

    const result = await runFlow(
      makeDeps(db, messages, tracer),
      definition(),
      { topic: "strategy" },
      "org-fictional-1",
    );

    expect(result).toEqual({ headline: "Fictional Win", tone: "upbeat" });

    // routed per law #4
    expect(messages.calls).toHaveLength(1);
    expect(messages.calls[0]!.model).toBe("claude-haiku-4-5");
    expect(messages.calls[0]!.messages[0]!.content).toContain("strategy");
    expect(messages.calls[0]!.messages[0]!.content).toContain("ONLY a single valid JSON");

    // metered: 1000 in + 500 out on Haiku → ceil((0.001 + 0.0025) * 100) = 1 cent
    expect(db.ledger).toHaveLength(1);
    expect(db.ledger[0]).toMatchObject({
      org_id: "org-fictional-1",
      workspace_id: "ws-fictional-1",
      action: "demo-headline",
      model: "claude-haiku-4-5",
      tokens_in: 1000,
      tokens_out: 500,
      cost_cents: 1,
      status: "success",
    });

    // traced
    expect(tracer.events).toHaveLength(1);
    expect(tracer.events[0]).toMatchObject({
      flowName: "demo-headline",
      status: "success",
      model: "claude-haiku-4-5",
      tokensIn: 1000,
      tokensOut: 500,
    });
  });

  it("counts cache tokens in the metered totals", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(
      message(GOOD_JSON, {
        input_tokens: 100,
        cache_creation_input_tokens: 2000,
        cache_read_input_tokens: 8000,
        output_tokens: 50,
      }),
    );
    await runFlow(makeDeps(db, messages), definition(), { topic: "x" }, "org-1");
    expect(db.ledger[0]!.tokens_in).toBe(10_100);
  });

  it("strips code fences the model adds despite instructions", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(
      message("```json\n" + GOOD_JSON + "\n```"),
    );
    const result = await runFlow(
      makeDeps(db, messages),
      definition(),
      { topic: "x" },
      "org-1",
    );
    expect(result.headline).toBe("Fictional Win");
  });
});

// ── Ledger on success AND failure ────────────────────────────────────────────

describe("runFlow — metering on failure", () => {
  it("writes an error ledger row when the API call itself fails", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(new Error("fictional network failure"));
    const tracer = new FakeTracer();

    await expect(
      runFlow(makeDeps(db, messages, tracer), definition(), { topic: "x" }, "org-1"),
    ).rejects.toThrow("fictional network failure");

    expect(db.ledger).toHaveLength(1);
    expect(db.ledger[0]).toMatchObject({
      action: "demo-headline",
      tokens_in: 0,
      tokens_out: 0,
      cost_cents: 0,
      status: "error",
    });
    expect(tracer.events[0]).toMatchObject({
      status: "error",
      error: "fictional network failure",
    });
  });

  it("meters a refusal with its real token spend and throws ModelRefusalError", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(message("", {}, "refusal"));

    await expect(
      runFlow(makeDeps(db, messages), definition(), { topic: "x" }, "org-1"),
    ).rejects.toBeInstanceOf(ModelRefusalError);

    expect(db.ledger).toHaveLength(1);
    expect(db.ledger[0]).toMatchObject({ status: "error", tokens_in: 1000 });
  });

  it("propagates a ledger insert failure — metering is not optional", async () => {
    const db = new FakeDb();
    db.insertError = "fictional ledger outage";
    const messages = new FakeMessages(message(GOOD_JSON));

    await expect(
      runFlow(makeDeps(db, messages), definition(), { topic: "x" }, "org-1"),
    ).rejects.toThrow(/ledger insert failed/);
  });
});

// ── Retry path ────────────────────────────────────────────────────────────────

describe("runFlow — one retry on output parse failure", () => {
  it("retries once with the validation failure echoed back, and meters BOTH calls", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(
      message("this is not json at all"),
      message(GOOD_JSON),
    );

    const result = await runFlow(
      makeDeps(db, messages),
      definition(),
      { topic: "x" },
      "org-1",
    );

    expect(result.headline).toBe("Fictional Win");
    expect(messages.calls).toHaveLength(2);

    // The retry carries the bad response and the failure reason
    const retry = messages.calls[1]!;
    expect(retry.messages).toHaveLength(3);
    expect(retry.messages[1]).toEqual({
      role: "assistant",
      content: "this is not json at all",
    });
    expect(retry.messages[2]!.content).toContain("failed validation");

    // Both API calls hit the ledger — spend is spend
    expect(db.ledger).toHaveLength(2);
    expect(db.ledger.every((row) => row.status === "success")).toBe(true);
  });

  it("retries when JSON parses but misses the schema, naming the bad field", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(
      message(JSON.stringify({ headline: "ok" })), // missing `tone`
      message(GOOD_JSON),
    );

    await runFlow(makeDeps(db, messages), definition(), { topic: "x" }, "org-1");
    expect(messages.calls[1]!.messages[2]!.content).toContain("tone");
  });

  it("throws FlowOutputParseError after exactly one retry — never loops", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(
      message("garbage one"),
      message("garbage two"),
    );
    const tracer = new FakeTracer();

    await expect(
      runFlow(makeDeps(db, messages, tracer), definition(), { topic: "x" }, "org-1"),
    ).rejects.toBeInstanceOf(FlowOutputParseError);

    expect(messages.calls).toHaveLength(2); // not three
    expect(db.ledger).toHaveLength(2);
    expect(tracer.events[0]!.status).toBe("error");
  });
});

// ── Cost cap enforcement ─────────────────────────────────────────────────────

describe("runFlow — per-org monthly cost cap", () => {
  it("hard-stops before any call once the cap is reached", async () => {
    const db = new FakeDb();
    db.seed({ org_id: "org-1", cost_cents: 10_000 }); // exactly at cap
    const messages = new FakeMessages(message(GOOD_JSON));

    await expect(
      runFlow(makeDeps(db, messages, undefined, 10_000), definition(), { topic: "x" }, "org-1"),
    ).rejects.toBeInstanceOf(CostCapExceededError);

    expect(messages.calls).toHaveLength(0); // no spend past the cap
    expect(db.ledger).toHaveLength(1); // only the seed — nothing new
  });

  it("only counts the org's own spend", async () => {
    const db = new FakeDb();
    db.seed({ org_id: "org-other", cost_cents: 999_999 });
    const messages = new FakeMessages(message(GOOD_JSON));

    await expect(
      runFlow(makeDeps(db, messages, undefined, 10_000), definition(), { topic: "x" }, "org-1"),
    ).resolves.toBeDefined();
  });

  it("only counts the current UTC month", async () => {
    const db = new FakeDb();
    db.seed({
      org_id: "org-1",
      cost_cents: 999_999,
      created_at: "2026-05-31T23:59:59.000Z", // last month
    });
    const messages = new FakeMessages(message(GOOD_JSON));
    const deps = makeDeps(db, messages, undefined, 10_000);
    deps.now = () => new Date("2026-06-11T12:00:00.000Z");

    await expect(
      runFlow(deps, definition(), { topic: "x" }, "org-1"),
    ).resolves.toBeDefined();

    expect(
      await monthlySpendCents(db.asClient(), "org-1", new Date("2026-06-11T12:00:00.000Z")),
    ).toBe(1); // just the new call
  });

  it("allows the call while under the cap", async () => {
    const db = new FakeDb();
    db.seed({ org_id: "org-1", cost_cents: 9_999 });
    const messages = new FakeMessages(message(GOOD_JSON));

    await expect(
      runFlow(makeDeps(db, messages, undefined, 10_000), definition(), { topic: "x" }, "org-1"),
    ).resolves.toBeDefined();
  });
});

// ── Auth, gates, input, guard ────────────────────────────────────────────────

describe("runFlow — pre-flight and post-flight checks", () => {
  it("a throwing gate refuses the call before any spend", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(message(GOOD_JSON));
    const def = definition({
      gates: [
        () => {
          throw new FlowGateError("fictional tier does not include AI");
        },
      ],
    });

    await expect(
      runFlow(makeDeps(db, messages), def, { topic: "x" }, "org-1"),
    ).rejects.toBeInstanceOf(FlowGateError);
    expect(messages.calls).toHaveLength(0);
    expect(db.ledger).toHaveLength(0);
  });

  it("invalid input throws FlowInputError before any spend", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(message(GOOD_JSON));

    await expect(
      runFlow(makeDeps(db, messages), definition(), { topic: "" }, "org-1"),
    ).rejects.toBeInstanceOf(FlowInputError);
    expect(messages.calls).toHaveLength(0);
    expect(db.ledger).toHaveLength(0);
  });

  it("a throwing guard rejects the output but the spend stays metered", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(message(GOOD_JSON));
    const def = definition({
      guard: () => {
        throw new Error("fictional guard: output mentions a real client");
      },
    });

    await expect(
      runFlow(makeDeps(db, messages), def, { topic: "x" }, "org-1"),
    ).rejects.toBeInstanceOf(FlowGuardError);
    expect(db.ledger).toHaveLength(1);
    expect(db.ledger[0]!.status).toBe("success"); // the call itself succeeded
  });

  it("auth failures propagate before anything runs", async () => {
    const db = new FakeDb();
    const messages = new FakeMessages(message(GOOD_JSON));
    const def = definition({
      auth: () => {
        throw new Error("fictional: no session");
      },
    });

    await expect(
      runFlow(makeDeps(db, messages), def, { topic: "x" }, "org-1"),
    ).rejects.toThrow("fictional: no session");
    expect(messages.calls).toHaveLength(0);
  });
});
