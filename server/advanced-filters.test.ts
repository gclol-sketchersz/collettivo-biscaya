import { describe, it, expect } from "vitest";
import {
  getCallsWithAdvancedFilters,
  getBudgetStatistics,
  getFilterOptions,
  countCallsWithFilters,
  type AdvancedFilterParams,
} from "./db-advanced-filters";

describe("Advanced Filters", () => {
  it("should get all calls without filters", async () => {
    const calls = await getCallsWithAdvancedFilters({});
    expect(Array.isArray(calls)).toBe(true);
    expect(calls.length).toBeGreaterThan(0);
  });

  it("should filter calls by geographic level", async () => {
    const calls = await getCallsWithAdvancedFilters({
      geographicLevels: ["regional"],
    });
    expect(Array.isArray(calls)).toBe(true);
    calls.forEach((call: any) => {
      expect(call.geographicLevel).toBe("regional");
    });
  });

  it("should filter calls by call type", async () => {
    const calls = await getCallsWithAdvancedFilters({
      callTypes: ["residency"],
    });
    expect(Array.isArray(calls)).toBe(true);
    calls.forEach((call: any) => {
      expect(call.callType).toBe("residency");
    });
  });

  it("should filter calls by budget range", async () => {
    const calls = await getCallsWithAdvancedFilters({
      budgetMin: 1000,
      budgetMax: 50000,
    });
    expect(Array.isArray(calls)).toBe(true);
  });

  it("should sort calls by deadline ascending", async () => {
    const calls = await getCallsWithAdvancedFilters({
      sortBy: "deadline-asc",
    });
    expect(Array.isArray(calls)).toBe(true);
    for (let i = 1; i < calls.length; i++) {
      const prev = new Date((calls as any)[i - 1].deadline).getTime();
      const curr = new Date((calls as any)[i].deadline).getTime();
      expect(prev).toBeLessThanOrEqual(curr);
    }
  });

  it("should sort calls by budget descending", async () => {
    const calls = await getCallsWithAdvancedFilters({
      sortBy: "budget-desc",
    });
    expect(Array.isArray(calls)).toBe(true);
  });

  it("should search calls by query", async () => {
    const calls = await getCallsWithAdvancedFilters({
      searchQuery: "residenza",
    });
    expect(Array.isArray(calls)).toBe(true);
  });

  it("should apply pagination", async () => {
    const calls = await getCallsWithAdvancedFilters({
      limit: 5,
      offset: 0,
    });
    expect(calls.length).toBeLessThanOrEqual(5);
  });

  it("should get budget statistics", async () => {
    const stats = await getBudgetStatistics();
    expect(stats).not.toBeNull();
    expect(typeof stats?.minBudget).toBe("number");
    expect(typeof stats?.maxBudget).toBe("number");
  });

  it("should get filter options", async () => {
    const options = await getFilterOptions();
    expect(options).not.toBeNull();
    expect(Array.isArray(options?.geographicLevels)).toBe(true);
    expect(Array.isArray(options?.callTypes)).toBe(true);
  });

  it("should count calls with filters", async () => {
    const count = await countCallsWithFilters({
      geographicLevels: ["regional"],
    });
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should combine multiple filters", async () => {
    const calls = await getCallsWithAdvancedFilters({
      geographicLevels: ["national"],
      callTypes: ["grant"],
      sortBy: "deadline-asc",
      limit: 10,
    });
    expect(Array.isArray(calls)).toBe(true);
    calls.forEach((call: any) => {
      expect(call.geographicLevel).toBe("national");
      expect(call.callType).toBe("grant");
    });
  });

  it("should handle deadline range filter", async () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const calls = await getCallsWithAdvancedFilters({
      deadlineFrom: now,
      deadlineTo: futureDate,
    });
    expect(Array.isArray(calls)).toBe(true);
  });
});
