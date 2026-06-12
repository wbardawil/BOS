import { describe, expect, it } from "vitest";
import { createLangfuseTracer, NOOP_TRACER, type LangfuseLike } from "./tracing";

describe("createLangfuseTracer", () => {
  it("emits one trace + one generation with usage and metadata", () => {
    const traces: unknown[] = [];
    const generations: unknown[] = [];
    const fake: LangfuseLike = {
      trace(options) {
        traces.push(options);
        return {
          generation(genOptions) {
            generations.push(genOptions);
            return {};
          },
        };
      },
    };

    createLangfuseTracer(fake).record({
      flowName: "demo-headline",
      orgId: "org-fictional-1",
      workspaceId: "ws-fictional-1",
      actionClass: "routine",
      model: "claude-haiku-4-5",
      status: "success",
      input: { topic: "x" },
      output: { headline: "Fictional Win" },
      tokensIn: 1000,
      tokensOut: 500,
      costCents: 1,
      durationMs: 42,
    });

    expect(traces).toHaveLength(1);
    expect(traces[0]).toMatchObject({
      name: "demo-headline",
      metadata: {
        orgId: "org-fictional-1",
        actionClass: "routine",
        status: "success",
        costCents: 1,
      },
    });
    expect(generations).toHaveLength(1);
    expect(generations[0]).toMatchObject({
      model: "claude-haiku-4-5",
      usage: { input: 1000, output: 500 },
    });
  });
});

describe("NOOP_TRACER", () => {
  it("swallows events silently", () => {
    expect(() =>
      NOOP_TRACER.record({
        flowName: "x",
        orgId: "o",
        actionClass: "routine",
        model: "claude-haiku-4-5",
        status: "success",
        input: null,
        output: null,
        tokensIn: 0,
        tokensOut: 0,
        costCents: 0,
        durationMs: 0,
      }),
    ).not.toThrow();
  });
});
