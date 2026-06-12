// @bos/ai — Langfuse tracing (architecture law #3: router + cache + ledger +
// Langfuse). The Tracer interface is narrow on purpose: tests inject a fake,
// production wraps the Langfuse SDK via createLangfuseTracer.

import type { ActionClass } from "./routing";

export interface FlowTraceEvent {
  flowName: string;
  orgId: string;
  workspaceId?: string | null;
  actionClass: ActionClass;
  model: string;
  status: "success" | "error";
  input: unknown;
  output: unknown;
  tokensIn: number;
  tokensOut: number;
  costCents: number;
  durationMs: number;
  error?: string;
}

export interface Tracer {
  record(event: FlowTraceEvent): void;
}

/** No-op tracer for environments without Langfuse (unit tests, offline dev). */
export const NOOP_TRACER: Tracer = { record: () => {} };

// Structural subset of the Langfuse v3 client — the package never imports the
// SDK directly so unit tests stay hermetic.
export interface LangfuseLike {
  trace(options: {
    name: string;
    metadata?: Record<string, unknown>;
    input?: unknown;
    output?: unknown;
  }): {
    generation(options: {
      name: string;
      model: string;
      input?: unknown;
      output?: unknown;
      usage?: { input?: number; output?: number };
      metadata?: Record<string, unknown>;
    }): unknown;
  };
}

export function createLangfuseTracer(langfuse: LangfuseLike): Tracer {
  return {
    record(event) {
      const trace = langfuse.trace({
        name: event.flowName,
        input: event.input,
        output: event.output,
        metadata: {
          orgId: event.orgId,
          workspaceId: event.workspaceId ?? null,
          actionClass: event.actionClass,
          status: event.status,
          costCents: event.costCents,
          durationMs: event.durationMs,
          error: event.error,
        },
      });
      trace.generation({
        name: `${event.flowName}:generation`,
        model: event.model,
        input: event.input,
        output: event.output,
        usage: { input: event.tokensIn, output: event.tokensOut },
      });
    },
  };
}
