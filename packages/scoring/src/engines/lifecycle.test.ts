import { describe, expect, it } from "vitest";
import { determineLifecycleStage } from "./lifecycle.js";

describe("determineLifecycleStage — revenue bands (employee signal neutral)", () => {
  it.each([
    ["pre-revenue", "startup"],
    ["0-100k", "startup"],
    ["100k-500k", "startup"],
    ["500k-1m", "startup"], // midpoint 750k < 1M
    ["1m-5m", "growth"],    // midpoint 3M
    ["5m-10m", "growth"],   // midpoint 7.5M
    ["10m-25m", "scale"],   // midpoint 17.5M
    ["25m-50m", "scale"],   // midpoint 37.5M
    ["50m-100m", "mature"], // midpoint 75M
    ["100m+", "mature"],
  ])("revenue %s → %s", (revenue_range, stage) => {
    expect(determineLifecycleStage({ revenue_range, employee_count: 1 })).toBe(stage);
  });

  it("normalizes case and whitespace in the revenue range", () => {
    expect(determineLifecycleStage({ revenue_range: "10M - 25M", employee_count: 1 })).toBe("scale");
  });

  it("treats an unknown revenue string as zero revenue", () => {
    expect(determineLifecycleStage({ revenue_range: "13 million-ish", employee_count: 1 })).toBe("startup");
  });
});

describe("determineLifecycleStage — employee thresholds (revenue signal neutral)", () => {
  it.each([
    [0, "startup"],
    [9, "startup"],
    [10, "growth"],
    [49, "growth"],
    [50, "scale"],
    [200, "scale"],  // mature requires STRICTLY more than 200
    [201, "mature"],
  ])("%i employees → %s", (employee_count, stage) => {
    expect(determineLifecycleStage({ revenue_range: null, employee_count })).toBe(stage);
  });
});

describe("determineLifecycleStage — conflicting signals: higher stage wins", () => {
  it("$75M revenue with 30 employees → mature (revenue dominates)", () => {
    expect(determineLifecycleStage({ revenue_range: "50m-100m", employee_count: 30 })).toBe("mature");
  });

  it("pre-revenue with 300 employees → mature (headcount dominates)", () => {
    expect(determineLifecycleStage({ revenue_range: "pre-revenue", employee_count: 300 })).toBe("mature");
  });

  it("$3M revenue with 60 employees → scale (employee signal higher)", () => {
    expect(determineLifecycleStage({ revenue_range: "1m-5m", employee_count: 60 })).toBe("scale");
  });
});

describe("determineLifecycleStage — null inputs", () => {
  it("null revenue and null employees → startup", () => {
    expect(determineLifecycleStage({ revenue_range: null, employee_count: null })).toBe("startup");
  });
});
