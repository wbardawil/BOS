// @bos/ai — the flow shell (TECH-SPEC §2.4): auth → gates → zod input → cost
// cap → LLM → zod output parse with ONE retry-on-failure → guard. Pattern
// reference is confident-mind-coach's runCoachingFlow, re-implemented clean.
//
// Architecture law #3: every LLM call in the platform goes through this
// package. A raw anthropic.messages.create anywhere else is a bug.

import type { ZodType } from "zod";
import type { BosClient } from "@bos/db";
import type { SystemTextBlock } from "./cache";
import {
  CostCapExceededError,
  FlowGuardError,
  FlowInputError,
  FlowOutputParseError,
  ModelRefusalError,
} from "./errors";
import { monthlySpendCents, recordUsage } from "./ledger";
import {
  computeCostCents,
  route,
  totalInputTokens,
  type ActionClass,
  type UsageTokens,
} from "./routing";
import { NOOP_TRACER, type Tracer } from "./tracing";

// Structural subset of the Anthropic SDK — `anthropic.messages` satisfies it,
// and unit tests inject a fake so no network is ever touched.
export interface AnthropicMessageLike {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string | null;
  usage: UsageTokens;
}

export interface MessageCreateParams {
  model: string;
  max_tokens: number;
  system?: SystemTextBlock[];
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface MessagesApi {
  create(params: MessageCreateParams): Promise<AnthropicMessageLike>;
}

export interface FlowAuthContext {
  orgId: string;
  workspaceId?: string | null;
  userId?: string;
}

export interface FlowPrompt {
  /** Build with buildWorkspaceContextSystem so the context block is cached. */
  system?: SystemTextBlock[];
  user: string;
}

export interface FlowDefinition<TInput, TOutput, TRawAuth = unknown> {
  /** Ledger `action` + Langfuse trace name. */
  name: string;
  /** Routed per law #4: routine→Haiku, reasoning→Sonnet, flagship→Opus-class. */
  actionClass: ActionClass;
  /** Resolves the caller to an org (and optionally workspace/user) or throws. */
  auth: (raw: TRawAuth) => FlowAuthContext | Promise<FlowAuthContext>;
  /** Tier/feature gates — run after auth, before any spend. Throw to refuse. */
  gates?: Array<(ctx: FlowAuthContext) => void | Promise<void>>;
  inputSchema: ZodType<TInput>;
  prompt: (input: TInput, ctx: FlowAuthContext) => FlowPrompt;
  outputSchema: ZodType<TOutput>;
  /** Post-parse business guard (e.g. "no client names in output"). Throw to refuse. */
  guard?: (
    output: TOutput,
    input: TInput,
    ctx: FlowAuthContext,
  ) => void | Promise<void>;
  /** Default 4096 — flows return small JSON; raise for artifact generation. */
  maxTokens?: number;
}

export interface FlowDeps {
  messages: MessagesApi;
  db: BosClient;
  tracer?: Tracer;
  /** Hard per-org monthly cap (law: hard-stop past the cap, no soft warnings). */
  monthlyCapCents: number;
  now?: () => Date;
}

const JSON_INSTRUCTION =
  "Respond with ONLY a single valid JSON object. No prose before or after it, no code fences.";

function extractText(message: AnthropicMessageLike): string {
  return message.content
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("");
}

function parseJsonLoose(text: string): unknown {
  // Models occasionally fence JSON despite instructions — strip before parsing.
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  return JSON.parse(stripped);
}

export async function runFlow<TInput, TOutput, TRawAuth = unknown>(
  deps: FlowDeps,
  def: FlowDefinition<TInput, TOutput, TRawAuth>,
  rawInput: unknown,
  rawAuth: TRawAuth,
): Promise<TOutput> {
  const tracer: Tracer = deps.tracer ?? NOOP_TRACER;
  const now = deps.now ?? (() => new Date());
  const startedAt = Date.now();

  // 1. auth
  const ctx = await def.auth(rawAuth);

  // 2. gates (tier checks etc.) — before any token is spent
  for (const gate of def.gates ?? []) {
    await gate(ctx);
  }

  // 3. zod input
  const inputResult = def.inputSchema.safeParse(rawInput);
  if (!inputResult.success) {
    throw new FlowInputError(
      `@bos/ai ${def.name}: input failed validation`,
      inputResult.error.issues,
    );
  }
  const input = inputResult.data;

  // 4. per-org monthly cost cap — HARD stop (no call is made at/past the cap)
  const spent = await monthlySpendCents(deps.db, ctx.orgId, now());
  if (spent >= deps.monthlyCapCents) {
    throw new CostCapExceededError(ctx.orgId, spent, deps.monthlyCapCents);
  }

  const model = route(def.actionClass);
  const promptParts = def.prompt(input, ctx);
  const maxTokens = def.maxTokens ?? 4096;

  const trace = (status: "success" | "error", extra: Partial<Parameters<Tracer["record"]>[0]>) =>
    tracer.record({
      flowName: def.name,
      orgId: ctx.orgId,
      workspaceId: ctx.workspaceId ?? null,
      actionClass: def.actionClass,
      model,
      status,
      input,
      output: null,
      tokensIn: 0,
      tokensOut: 0,
      costCents: 0,
      durationMs: Date.now() - startedAt,
      ...extra,
    });

  // One LLM call: meter it whatever happens (schema law #2 — success AND failure).
  const callModel = async (
    messages: MessageCreateParams["messages"],
  ): Promise<{ message: AnthropicMessageLike; text: string; costCents: number }> => {
    let message: AnthropicMessageLike;
    try {
      message = await deps.messages.create({
        model,
        max_tokens: maxTokens,
        system: promptParts.system,
        messages,
      });
    } catch (error) {
      await recordUsage(deps.db, {
        orgId: ctx.orgId,
        workspaceId: ctx.workspaceId ?? null,
        action: def.name,
        model,
        tokensIn: 0,
        tokensOut: 0,
        costCents: 0,
        status: "error",
      });
      trace("error", { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }

    const costCents = computeCostCents(model, message.usage);
    const failed = message.stop_reason === "refusal";
    await recordUsage(deps.db, {
      orgId: ctx.orgId,
      workspaceId: ctx.workspaceId ?? null,
      action: def.name,
      model,
      tokensIn: totalInputTokens(message.usage),
      tokensOut: message.usage.output_tokens,
      costCents,
      status: failed ? "error" : "success",
    });
    if (failed) {
      trace("error", {
        error: "model refusal",
        tokensIn: totalInputTokens(message.usage),
        tokensOut: message.usage.output_tokens,
        costCents,
      });
      throw new ModelRefusalError(
        `@bos/ai ${def.name}: the model refused this request`,
      );
    }
    return { message, text: extractText(message), costCents };
  };

  const userMessage = `${promptParts.user}\n\n${JSON_INSTRUCTION}`;
  const firstMessages: MessageCreateParams["messages"] = [
    { role: "user", content: userMessage },
  ];

  // 5. LLM call + 6. zod output parse with exactly ONE retry on failure
  let attempt = await callModel(firstMessages);
  let parsed = tryParseOutput(def.outputSchema, attempt.text);

  if (!parsed.success) {
    const retryMessages: MessageCreateParams["messages"] = [
      ...firstMessages,
      { role: "assistant", content: attempt.text },
      {
        role: "user",
        content:
          `Your previous response failed validation: ${parsed.reason}\n` +
          `${JSON_INSTRUCTION}`,
      },
    ];
    attempt = await callModel(retryMessages);
    parsed = tryParseOutput(def.outputSchema, attempt.text);
    if (!parsed.success) {
      trace("error", {
        error: `output failed validation after retry: ${parsed.reason}`,
        tokensIn: totalInputTokens(attempt.message.usage),
        tokensOut: attempt.message.usage.output_tokens,
        costCents: attempt.costCents,
      });
      throw new FlowOutputParseError(
        `@bos/ai ${def.name}: output failed validation after one retry — ${parsed.reason}`,
        attempt.text,
      );
    }
  }

  // 7. guard
  if (def.guard) {
    try {
      await def.guard(parsed.data, input, ctx);
    } catch (error) {
      trace("error", {
        error: `guard rejected output: ${error instanceof Error ? error.message : String(error)}`,
        output: parsed.data,
        tokensIn: totalInputTokens(attempt.message.usage),
        tokensOut: attempt.message.usage.output_tokens,
        costCents: attempt.costCents,
      });
      if (error instanceof Error) throw new FlowGuardError(error.message);
      throw new FlowGuardError(String(error));
    }
  }

  trace("success", {
    output: parsed.data,
    tokensIn: totalInputTokens(attempt.message.usage),
    tokensOut: attempt.message.usage.output_tokens,
    costCents: attempt.costCents,
  });
  return parsed.data;
}

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; reason: string };

function tryParseOutput<T>(schema: ZodType<T>, text: string): ParseResult<T> {
  let json: unknown;
  try {
    json = parseJsonLoose(text);
  } catch {
    return { success: false, reason: "response was not valid JSON" };
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    return { success: false, reason: `JSON did not match the schema (${issues})` };
  }
  return { success: true, data: result.data };
}
