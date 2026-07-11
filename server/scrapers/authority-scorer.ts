/**
 * Authority Scorer
 * Calculates authority score for scraped calls based on multiple factors
 * Score range: 0-100
 */

import type { ScrapedCall } from "./base-scraper";

export interface AuthorityScoreResult {
  score: number;
  factors: {
    sourceScore: number;
    categoryScore: number;
    completenessScore: number;
    recencyScore: number;
  };
  isAuthoritative: boolean;
  recommendation: "accept" | "review" | "reject";
}

// Whitelist of authoritative sources with their base scores
const AUTHORITATIVE_SOURCES: Record<string, number> = {
  // Level A: Istituzioni pubbliche (95-100)
  "Residenze Artistiche": 98,
  "residenzeartistiche.it": 98,
  MiBACT: 100,
  "Ministero della Cultura": 100,
  OpenCoesione: 95,
  ANAC: 95,

  // Level B: Fondazioni verificate (80-90)
  "Fondazione Sozzani": 90,
  "Fondazione Italia": 88,
  Biennale: 90,
  "Exibart RSS": 85,
  "On the Move": 85,

  // Level C: Piattaforme specializzate (60-75)
  "Artabus": 70,
  "Competition Calls": 65,
  "Fellowship & European": 72,
};

// Whitelist of authoritative categories
const AUTHORITATIVE_CATEGORIES: Record<string, number> = {
  exhibition: 90,
  residency: 95,
  grant: 90,
  award: 85,
  fellowship: 80,
  competition: 75,
  curatorial_open_call: 85,
};

export class AuthorityScorer {
  /**
   * Calculate authority score for a call
   */
  calculateScore(call: ScrapedCall): AuthorityScoreResult {
    const sourceScore = this.calculateSourceScore(call.source);
    const categoryScore = this.calculateCategoryScore(call.callType);
    const completenessScore = this.calculateCompletenessScore(call);
    const recencyScore = this.calculateRecencyScore(call.publishedAt);

    // Weighted average: Source (40%) + Category (30%) + Completeness (20%) + Recency (10%)
    const totalScore =
      sourceScore * 0.4 +
      categoryScore * 0.3 +
      completenessScore * 0.2 +
      recencyScore * 0.1;

    const score = Math.round(totalScore);

    return {
      score,
      factors: {
        sourceScore,
        categoryScore,
        completenessScore,
        recencyScore,
      },
      isAuthoritative: score >= 70,
      recommendation: this.getRecommendation(score),
    };
  }

  /**
   * Calculate source authority score (0-100)
   */
  private calculateSourceScore(source: string): number {
    // Check for exact match
    if (AUTHORITATIVE_SOURCES[source]) {
      return AUTHORITATIVE_SOURCES[source];
    }

    // Check for partial match
    for (const [authorizedSource, score] of Object.entries(AUTHORITATIVE_SOURCES)) {
      if (source.toLowerCase().includes(authorizedSource.toLowerCase())) {
        return score;
      }
    }

    // Default score for unknown sources
    return 40;
  }

  /**
   * Calculate category authority score (0-100)
   */
  private calculateCategoryScore(callType?: string): number {
    if (!callType) {
      return 50; // Default for unknown categories
    }

    const normalizedType = callType.toLowerCase();

    // Check for exact match
    if (AUTHORITATIVE_CATEGORIES[normalizedType]) {
      return AUTHORITATIVE_CATEGORIES[normalizedType];
    }

    // Check for partial match
    for (const [category, score] of Object.entries(AUTHORITATIVE_CATEGORIES)) {
      if (normalizedType.includes(category) || category.includes(normalizedType)) {
        return score;
      }
    }

    return 60; // Default for recognized but not whitelisted categories
  }

  /**
   * Calculate completeness score (0-100)
   * Based on presence of description, budget, and other fields
   */
  private calculateCompletenessScore(call: ScrapedCall): number {
    let score = 0;

    // Title (required, 20 points)
    if (call.title && call.title.length > 10) {
      score += 20;
    }

    // Description (30 points)
    if (call.description) {
      if (call.description.length > 500) {
        score += 30;
      } else if (call.description.length > 100) {
        score += 20;
      } else if (call.description.length > 50) {
        score += 10;
      }
    }

    // Budget (20 points)
    if (call.budget && call.budget > 0) {
      score += 20;
    }

    // Entity (15 points)
    if (call.entity && call.entity.length > 3) {
      score += 15;
    }

    // Tags (15 points)
    if (call.tags && call.tags.length > 0) {
      score += 15;
    }

    return Math.min(score, 100);
  }

  /**
   * Calculate recency score (0-100)
   * Newer calls get higher scores
   */
  private calculateRecencyScore(publishedAt: Date): number {
    const now = new Date();
    const daysOld = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysOld < 7) {
      return 100; // Published within 7 days
    } else if (daysOld < 30) {
      return 80; // Published within 30 days
    } else if (daysOld < 90) {
      return 60; // Published within 90 days
    } else if (daysOld < 180) {
      return 40; // Published within 6 months
    } else {
      return 20; // Published more than 6 months ago
    }
  }

  /**
   * Get recommendation based on score
   */
  private getRecommendation(score: number): "accept" | "review" | "reject" {
    if (score >= 80) {
      return "accept";
    } else if (score >= 60) {
      return "review";
    } else {
      return "reject";
    }
  }

  /**
   * Batch score multiple calls
   */
  batchScore(calls: ScrapedCall[]): Array<ScrapedCall & { authorityScore: AuthorityScoreResult }> {
    return calls.map((call) => ({
      ...call,
      authorityScore: this.calculateScore(call),
    }));
  }

  /**
   * Filter calls by minimum authority score
   */
  filterByMinimumScore(
    calls: ScrapedCall[],
    minimumScore: number
  ): Array<ScrapedCall & { authorityScore: AuthorityScoreResult }> {
    return this.batchScore(calls).filter((call) => call.authorityScore.score >= minimumScore);
  }

  /**
   * Get statistics about authority scores
   */
  getStatistics(
    calls: Array<ScrapedCall & { authorityScore: AuthorityScoreResult }>
  ): {
    totalCalls: number;
    averageScore: number;
    acceptedCalls: number;
    reviewCalls: number;
    rejectedCalls: number;
    scoreDistribution: Record<string, number>;
  } {
    const totalCalls = calls.length;
    const scores = calls.map((c) => c.authorityScore.score);
    const averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    const acceptedCalls = calls.filter((c) => c.authorityScore.recommendation === "accept").length;
    const reviewCalls = calls.filter((c) => c.authorityScore.recommendation === "review").length;
    const rejectedCalls = calls.filter((c) => c.authorityScore.recommendation === "reject").length;

    // Score distribution (in 10-point buckets)
    const scoreDistribution: Record<string, number> = {};
    for (let i = 0; i <= 10; i++) {
      const bucket = `${i * 10}-${(i + 1) * 10}`;
      scoreDistribution[bucket] = scores.filter((s) => s >= i * 10 && s < (i + 1) * 10).length;
    }

    return {
      totalCalls,
      averageScore,
      acceptedCalls,
      reviewCalls,
      rejectedCalls,
      scoreDistribution,
    };
  }
}
