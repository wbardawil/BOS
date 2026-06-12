// @bos/ai — model router, prompt-cache helpers, usage metering, flow shell
// (Prompt 4, TECH-SPEC §2.4). LAW #3: every LLM call in the platform goes
// through this package — a raw anthropic.messages.create outside it is a bug.

export const PACKAGE_NAME = "@bos/ai" as const;

export {
  route,
  computeCostCents,
  totalInputTokens,
  MODEL_ROUTES,
  MODEL_PRICING,
  type ActionClass,
  type ModelId,
  type UsageTokens,
} from "./routing";

export {
  buildWorkspaceContextSystem,
  type SystemTextBlock,
  type WorkspaceContextInput,
} from "./cache";

export {
  recordUsage,
  monthlySpendCents,
  monthStartIso,
  type UsageLedgerEntry,
} from "./ledger";

export {
  createLangfuseTracer,
  NOOP_TRACER,
  type Tracer,
  type FlowTraceEvent,
  type LangfuseLike,
} from "./tracing";

export {
  runFlow,
  type FlowDefinition,
  type FlowDeps,
  type FlowAuthContext,
  type FlowPrompt,
  type MessagesApi,
  type MessageCreateParams,
  type AnthropicMessageLike,
} from "./flow";

export {
  FlowAuthError,
  FlowGateError,
  FlowInputError,
  FlowOutputParseError,
  FlowGuardError,
  CostCapExceededError,
  ModelRefusalError,
} from "./errors";
