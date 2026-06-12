import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateDelegationIndex, type ApprovalWithRole, type ScoreChangeRequestTiming } from "./delegation-index.js";

// The engine measures escalations against Date.now() — pin the clock.
const NOW = "2026-06-11T00:00:00.000Z";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
});
afterEach(() => vi.useRealTimers());

function approval(role: ApprovalWithRole["approver_role"]): ApprovalWithRole {
  return { approved_by: "user-fictional", approver_role: role, created_at: "2026-06-01T00:00:00Z" };
}

function daysAgo(days: number): string {
  return new Date(Date.parse(NOW) - days * 24 * 60 * 60 * 1000).toISOString();
}

function scr(createdDaysAgo: number, resolvedDaysAgo: number | null, status: ScoreChangeRequestTiming["status"]): ScoreChangeRequestTiming {
  return {
    created_at: daysAgo(createdDaysAgo),
    resolved_at: resolvedDaysAgo === null ? null : daysAgo(resolvedDaysAgo),
    status,
  };
}

describe("calculateDelegationIndex — % decisions below CEO", () => {
  it("3 non-admin of 5 approvals → 60.0% → healthy", () => {
    const result = calculateDelegationIndex({
      approvals: [approval("leader"), approval("functional_lead"), approval("leader"), approval("admin"), approval("admin")],
      score_change_requests: [],
      total_user_count: 10,
      measurement_period_days: 30,
    });
    expect(result.pct_decisions_below_ceo).toBe(60);
    expect(result.delegation_health).toBe("healthy");
  });

  it("1 of 3 → 33.3% → moderate (one-decimal rounding)", () => {
    const result = calculateDelegationIndex({
      approvals: [approval("leader"), approval("admin"), approval("admin")],
      score_change_requests: [],
      total_user_count: 10,
      measurement_period_days: 30,
    });
    expect(result.pct_decisions_below_ceo).toBe(33.3);
    expect(result.delegation_health).toBe("moderate");
  });

  it("all admin → 0% → concentrated", () => {
    const result = calculateDelegationIndex({
      approvals: [approval("admin"), approval("admin")],
      score_change_requests: [],
      total_user_count: 10,
      measurement_period_days: 30,
    });
    expect(result.pct_decisions_below_ceo).toBe(0);
    expect(result.delegation_health).toBe("concentrated");
  });

  it("zero approvals → 0% → concentrated", () => {
    const result = calculateDelegationIndex({
      approvals: [],
      score_change_requests: [],
      total_user_count: 10,
      measurement_period_days: 30,
    });
    expect(result.pct_decisions_below_ceo).toBe(0);
    expect(result.delegation_health).toBe("concentrated");
  });
});

describe("calculateDelegationIndex — escalations (> 7 days unresolved)", () => {
  it("counts stale pending and slow-resolved requests per month", () => {
    const result = calculateDelegationIndex({
      approvals: [],
      score_change_requests: [
        scr(10, null, "pending"),   // pending 10 days → escalation
        scr(2, null, "pending"),    // pending 2 days → not
        scr(10, 2, "approved"),     // resolved after 8 days → escalation
        scr(3, 2, "approved"),      // resolved after 1 day → not
        scr(10, null, "rejected"),  // no resolved_at, not pending → not counted
      ],
      total_user_count: 10,
      measurement_period_days: 60, // 2 months
    });
    expect(result.escalations_per_month).toBe(1); // 2 escalations / 2 months
  });

  it("clamps the period to at least one month", () => {
    const result = calculateDelegationIndex({
      approvals: [],
      score_change_requests: [scr(10, null, "pending")],
      total_user_count: 10,
      measurement_period_days: 7, // < 30 → divisor stays 1
    });
    expect(result.escalations_per_month).toBe(1);
  });
});

describe("calculateDelegationIndex — decision latency", () => {
  it("averages resolution time in hours (24h and 48h → 36.0)", () => {
    const result = calculateDelegationIndex({
      approvals: [],
      score_change_requests: [
        scr(2, 1, "approved"), // 24 hours
        scr(3, 1, "approved"), // 48 hours
      ],
      total_user_count: 10,
      measurement_period_days: 30,
    });
    expect(result.avg_decision_latency_hours).toBe(36);
  });

  it("returns 0 latency when nothing has resolved", () => {
    const result = calculateDelegationIndex({
      approvals: [],
      score_change_requests: [scr(2, null, "pending")],
      total_user_count: 10,
      measurement_period_days: 30,
    });
    expect(result.avg_decision_latency_hours).toBe(0);
  });
});
