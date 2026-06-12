import { describe, expect, it } from "vitest";
import { buildWorkspaceContextSystem } from "./cache";

describe("buildWorkspaceContextSystem — prompt-cache structure", () => {
  it("marks the stable workspace block ephemeral and leaves volatile uncached, in prefix order", () => {
    const blocks = buildWorkspaceContextSystem({
      stable: "WORKSPACE CONTEXT: fictional aspiration, fictional choices",
      volatile: "Today is a fictional Tuesday.",
    });
    expect(blocks).toEqual([
      {
        type: "text",
        text: "WORKSPACE CONTEXT: fictional aspiration, fictional choices",
        cache_control: { type: "ephemeral" },
      },
      { type: "text", text: "Today is a fictional Tuesday." },
    ]);
  });

  it("emits only the cached block when there is no volatile content", () => {
    const blocks = buildWorkspaceContextSystem({ stable: "stable context" });
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.cache_control).toEqual({ type: "ephemeral" });
  });

  it("ignores whitespace-only volatile content", () => {
    expect(
      buildWorkspaceContextSystem({ stable: "stable", volatile: "   " }),
    ).toHaveLength(1);
  });

  it("supports the 1-hour TTL for slow cadences", () => {
    const blocks = buildWorkspaceContextSystem({ stable: "stable", ttl: "1h" });
    expect(blocks[0]!.cache_control).toEqual({ type: "ephemeral", ttl: "1h" });
  });

  it("refuses an empty stable block — that would cache nothing", () => {
    expect(() => buildWorkspaceContextSystem({ stable: "  " })).toThrow(
      /stable context is required/,
    );
  });
});
