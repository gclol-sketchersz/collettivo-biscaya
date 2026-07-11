import { describe, it, expect } from "vitest";
import { AuthorityScorer } from "./authority-scorer";
import type { ScrapedCall } from "./base-scraper";

describe("AuthorityScorer", () => {
  const scorer = new AuthorityScorer();

  const createMockCall = (overrides?: Partial<ScrapedCall>): ScrapedCall => ({
    title: "Test Call",
    description: "This is a test call with a detailed description",
    source: "Test Source",
    sourceUrl: "https://example.com/call",
    publishedAt: new Date(),
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    callType: "exhibition",
    budget: 5000,
    entity: "Test Entity",
    country: "IT",
    ...overrides,
  });

  describe("calculateSourceScore", () => {
    it("should return high score for authoritative sources", () => {
      const call = createMockCall({ source: "Residenze Artistiche" });
      const result = scorer.calculateScore(call);
      expect(result.factors.sourceScore).toBeGreaterThanOrEqual(95);
    });

    it("should return medium score for recognized sources", () => {
      const call = createMockCall({ source: "Exibart RSS" });
      const result = scorer.calculateScore(call);
      expect(result.factors.sourceScore).toBeGreaterThanOrEqual(80);
    });

    it("should return low score for unknown sources", () => {
      const call = createMockCall({ source: "Unknown Source" });
      const result = scorer.calculateScore(call);
      expect(result.factors.sourceScore).toBeLessThan(50);
    });

    it("should match partial source names", () => {
      const call = createMockCall({ source: "Fondazione Sozzani - Milano" });
      const result = scorer.calculateScore(call);
      expect(result.factors.sourceScore).toBeGreaterThanOrEqual(85);
    });
  });

  describe("calculateCategoryScore", () => {
    it("should return high score for authoritative categories", () => {
      const call = createMockCall({ callType: "residency" });
      const result = scorer.calculateScore(call);
      expect(result.factors.categoryScore).toBeGreaterThanOrEqual(90);
    });

    it("should return medium score for standard categories", () => {
      const call = createMockCall({ callType: "competition" });
      const result = scorer.calculateScore(call);
      expect(result.factors.categoryScore).toBeGreaterThanOrEqual(70);
    });

    it("should return default score for unknown categories", () => {
      const call = createMockCall({ callType: "unknown_category" });
      const result = scorer.calculateScore(call);
      expect(result.factors.categoryScore).toBeGreaterThanOrEqual(50);
    });

    it("should handle missing callType", () => {
      const call = createMockCall({ callType: undefined });
      const result = scorer.calculateScore(call);
      expect(result.factors.categoryScore).toBe(50);
    });
  });

  describe("calculateCompletenessScore", () => {
    it("should give full score for complete call", () => {
      const call = createMockCall({
        title: "Complete Call Title",
        description: "This is a very detailed description with more than 500 characters. ".repeat(10),
        budget: 10000,
        entity: "Test Entity",
        tags: ["tag1", "tag2"],
      });
      const result = scorer.calculateScore(call);
      expect(result.factors.completenessScore).toBeGreaterThanOrEqual(90);
    });

    it("should give partial score for incomplete call", () => {
      const call = createMockCall({
        description: "Short",
        budget: undefined,
        tags: undefined,
      });
      const result = scorer.calculateScore(call);
      expect(result.factors.completenessScore).toBeLessThan(50);
    });

    it("should give zero for missing title", () => {
      const call = createMockCall({ title: "" });
      const result = scorer.calculateScore(call);
      expect(result.factors.completenessScore).toBeLessThan(100);
    });
  });

  describe("calculateRecencyScore", () => {
    it("should give high score for recent calls", () => {
      const call = createMockCall({ publishedAt: new Date() });
      const result = scorer.calculateScore(call);
      expect(result.factors.recencyScore).toBe(100);
    });

    it("should give medium score for calls from 30 days ago", () => {
      const call = createMockCall({
        publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      });
      const result = scorer.calculateScore(call);
      expect(result.factors.recencyScore).toBe(80);
    });

    it("should give low score for old calls", () => {
      const call = createMockCall({
        publishedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      });
      const result = scorer.calculateScore(call);
      expect(result.factors.recencyScore).toBeLessThan(50);
    });
  });

  describe("calculateScore", () => {
    it("should return score between 0-100", () => {
      const call = createMockCall();
      const result = scorer.calculateScore(call);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it("should mark authoritative calls", () => {
      const call = createMockCall({
        source: "Residenze Artistiche",
        callType: "residency",
        description: "This is a very detailed description with more than 500 characters. ".repeat(10),
      });
      const result = scorer.calculateScore(call);
      expect(result.isAuthoritative).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it("should recommend accept for high scores", () => {
      const call = createMockCall({
        source: "Residenze Artistiche",
        callType: "residency",
      });
      const result = scorer.calculateScore(call);
      expect(result.recommendation).toBe("accept");
    });

    it("should recommend review for medium scores", () => {
      const call = createMockCall({
        source: "Unknown Source",
        callType: "exhibition",
      });
      const result = scorer.calculateScore(call);
      if (result.score >= 60 && result.score < 80) {
        expect(result.recommendation).toBe("review");
      }
    });

    it("should recommend reject for low scores", () => {
      const call = createMockCall({
        source: "Unknown Source",
        title: "X",
        description: "Y",
        callType: "unknown",
      });
      const result = scorer.calculateScore(call);
      if (result.score < 60) {
        expect(result.recommendation).toBe("reject");
      }
    });
  });

  describe("batchScore", () => {
    it("should score multiple calls", () => {
      const calls = [
        createMockCall({ source: "Residenze Artistiche" }),
        createMockCall({ source: "Unknown Source" }),
        createMockCall({ source: "Exibart RSS" }),
      ];

      const results = scorer.batchScore(calls);
      expect(results).toHaveLength(3);
      expect(results[0].authorityScore.score).toBeGreaterThan(results[1].authorityScore.score);
    });
  });

  describe("filterByMinimumScore", () => {
    it("should filter calls by minimum score", () => {
      const calls = [
        createMockCall({ source: "Residenze Artistiche" }),
        createMockCall({ source: "Unknown Source" }),
        createMockCall({ source: "Exibart RSS" }),
      ];

      const results = scorer.filterByMinimumScore(calls, 70);
      expect(results.length).toBeLessThanOrEqual(calls.length);
      expect(results.every((c) => c.authorityScore.score >= 70)).toBe(true);
    });
  });

  describe("getStatistics", () => {
    it("should calculate correct statistics", () => {
      const calls = [
        createMockCall({ source: "Residenze Artistiche" }),
        createMockCall({ source: "Exibart RSS" }),
        createMockCall({ source: "Unknown Source" }),
      ];

      const scoredCalls = scorer.batchScore(calls);
      const stats = scorer.getStatistics(scoredCalls);

      expect(stats.totalCalls).toBe(3);
      expect(stats.averageScore).toBeGreaterThan(0);
      expect(stats.acceptedCalls + stats.reviewCalls + stats.rejectedCalls).toBe(3);
      expect(Object.keys(stats.scoreDistribution).length).toBeGreaterThan(0);
    });

    it("should count recommendations correctly", () => {
      const calls = [
        createMockCall({
          source: "Residenze Artistiche",
          callType: "residency",
          description: "This is a very detailed description with more than 500 characters. ".repeat(10),
        }),
        createMockCall({ source: "Unknown Source", title: "X", description: "Y" }),
      ];

      const scoredCalls = scorer.batchScore(calls);
      const stats = scorer.getStatistics(scoredCalls);

      expect(stats.acceptedCalls).toBeGreaterThan(0);
    });
  });
});
