// @bos/ai — model routing + pricing. THE one config file (architecture law #4):
// Haiku for routine agent actions, Sonnet for advisory/reasoning, Opus-class
// only for flagship artifacts. Change models HERE, nowhere else.

export type ActionClass = "routine" | "reasoning" | "flagship";

export type ModelId =
  | "claude-haiku-4-5"
  | "claude-sonnet-4-6"
  | "claude-opus-4-8";

export const MODEL_ROUTES: Record<ActionClass, ModelId> = {
  routine: "claude-haiku-4-5", // agent follow-ups, formatting, documentation
  reasoning: "claude-sonnet-4-6", // advisor chat, challenge loop, strategy drafting
  flagship: "claude-opus-4-8", // board decks, quarterly artifacts ONLY
};

export function route(actionClass: ActionClass): ModelId {
  const model = MODEL_ROUTES[actionClass];
  if (!model) {
    throw new Error(`@bos/ai route: unknown action class "${actionClass}"`);
  }
  return model;
}

// ── Pricing (USD per million tokens, platform.claude.com pricing 2026-06) ────
// Cache reads bill at ~0.1× input, cache writes at 1.25× (5-minute TTL).

interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

export const MODEL_PRICING: Record<ModelId, ModelPricing> = {
  "claude-haiku-4-5": { inputPerMTok: 1, outputPerMTok: 5 },
  "claude-sonnet-4-6": { inputPerMTok: 3, outputPerMTok: 15 },
  "claude-opus-4-8": { inputPerMTok: 5, outputPerMTok: 25 },
};

const CACHE_WRITE_MULTIPLIER = 1.25;
const CACHE_READ_MULTIPLIER = 0.1;

export interface UsageTokens {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}

/**
 * Cost of one call in integer cents, rounded UP so the ledger never
 * under-counts spend (the cost cap reads these rows — conservative is correct).
 */
export function computeCostCents(model: ModelId, usage: UsageTokens): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) {
    throw new Error(`@bos/ai computeCostCents: unknown model "${model}"`);
  }
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const inputUsd =
    ((usage.input_tokens +
      cacheWrite * CACHE_WRITE_MULTIPLIER +
      cacheRead * CACHE_READ_MULTIPLIER) /
      1_000_000) *
    pricing.inputPerMTok;
  const outputUsd = (usage.output_tokens / 1_000_000) * pricing.outputPerMTok;
  return Math.ceil((inputUsd + outputUsd) * 100);
}

/** Total billed input tokens (uncached + cache writes + cache reads). */
export function totalInputTokens(usage: UsageTokens): number {
  return (
    usage.input_tokens +
    (usage.cache_creation_input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0)
  );
}
