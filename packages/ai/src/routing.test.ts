import { describe, expect, it } from "vitest";
import {
  computeCostCents,
  MODEL_PRICING,
  MODEL_ROUTES,
  route,
  totalInputTokens,
  type ActionClass,
} from "./routing";

describe("route — the law-#4 mapping", () => {
  it.each([
    ["routine", "claude-haiku-4-5"],
    ["reasoning", "claude-sonnet-4-6"],
    ["flagship", "claude-opus-4-8"],
  ] as [ActionClass, string][])("%s → %s", (actionClass, model) => {
    expect(route(actionClass)).toBe(model);
  });

  it("throws on an unknown action class instead of silently defaulting", () => {
    expect(() => route("turbo" as ActionClass)).toThrow(/unknown action class/);
  });

  it("every route has pricing configured", () => {
    for (const model of Object.values(MODEL_ROUTES)) {
      expect(MODEL_PRICING[model]).toBeDefined();
    }
  });
});

describe("computeCostCents — golden cases", () => {
  it("Haiku: 1M in + 1M out = $1 + $5 = 600 cents", () => {
    expect(
      computeCostCents("claude-haiku-4-5", {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
      }),
    ).toBe(600);
  });

  it("Sonnet: 1M in + 1M out = $3 + $15 = 1800 cents", () => {
    expect(
      computeCostCents("claude-sonnet-4-6", {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
      }),
    ).toBe(1800);
  });

  it("Opus-class: 1M in + 1M out = $5 + $25 = 3000 cents", () => {
    expect(
      computeCostCents("claude-opus-4-8", {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
      }),
    ).toBe(3000);
  });

  it("cache writes bill at 1.25×: Haiku 1M cache-write tokens = 125 cents", () => {
    expect(
      computeCostCents("claude-haiku-4-5", {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 1_000_000,
      }),
    ).toBe(125);
  });

  it("cache reads bill at 0.1×: Haiku 1M cache-read tokens = 10 cents", () => {
    expect(
      computeCostCents("claude-haiku-4-5", {
        input_tokens: 0,
        output_tokens: 0,
        cache_read_input_tokens: 1_000_000,
      }),
    ).toBe(10);
  });

  it("rounds UP so the ledger never under-counts (1 Haiku token → 1 cent)", () => {
    expect(
      computeCostCents("claude-haiku-4-5", { input_tokens: 1, output_tokens: 0 }),
    ).toBe(1);
  });

  it("zero usage costs zero", () => {
    expect(
      computeCostCents("claude-haiku-4-5", { input_tokens: 0, output_tokens: 0 }),
    ).toBe(0);
  });
});

describe("totalInputTokens", () => {
  it("sums uncached + cache-write + cache-read tokens", () => {
    expect(
      totalInputTokens({
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: 200,
        cache_read_input_tokens: 300,
      }),
    ).toBe(600);
  });

  it("treats null cache fields as zero", () => {
    expect(
      totalInputTokens({
        input_tokens: 100,
        output_tokens: 50,
        cache_creation_input_tokens: null,
        cache_read_input_tokens: null,
      }),
    ).toBe(100);
  });
});
