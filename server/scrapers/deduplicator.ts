/**
 * Intelligent deduplication for scraped calls
 * Uses multiple strategies:
 * - Hash-based deduplication (title + date)
 * - Similarity matching (Levenshtein distance)
 * - URL-based deduplication
 */

import { ScrapedCall } from "./base-scraper";

export interface DeduplicationResult {
  unique: ScrapedCall[];
  duplicates: Array<{
    original: ScrapedCall;
    duplicate: ScrapedCall;
    similarity: number;
  }>;
}

export class CallDeduplicator {
  /**
   * Generate hash for call (title + date)
   */
  private generateHash(call: ScrapedCall): string {
    const titleNorm = call.title.toLowerCase().replace(/\s+/g, " ");
    const dateStr = call.publishedAt.toISOString().split("T")[0];
    return `${titleNorm}::${dateStr}`;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Used for similarity matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[len2][len1];
  }

  /**
   * Calculate similarity score between two strings (0-1)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().replace(/\s+/g, " ");
    const s2 = str2.toLowerCase().replace(/\s+/g, " ");

    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 1;

    const distance = this.levenshteinDistance(s1, s2);
    return 1 - distance / maxLen;
  }

  /**
   * Check if two calls are duplicates based on similarity
   */
  private areDuplicates(call1: ScrapedCall, call2: ScrapedCall, threshold: number = 0.85): boolean {
    // Same URL = duplicate
    if (call1.sourceUrl === call2.sourceUrl) {
      return true;
    }

    // Same source and very similar title = duplicate
    if (call1.source === call2.source) {
      const similarity = this.calculateSimilarity(call1.title, call2.title);
      if (similarity > threshold) {
        return true;
      }
    }

    // Different sources but very similar title and close deadline = duplicate
    const titleSimilarity = this.calculateSimilarity(call1.title, call2.title);
    if (titleSimilarity > 0.9) {
      const deadlineDiff = Math.abs(
        call1.deadline.getTime() - call2.deadline.getTime()
      ) / (1000 * 60 * 60 * 24); // days

      if (deadlineDiff < 7) {
        // Within 7 days
        return true;
      }
    }

    return false;
  }

  /**
   * Deduplicate calls using multiple strategies
   */
  deduplicate(calls: ScrapedCall[]): DeduplicationResult {
    const unique: ScrapedCall[] = [];
    const duplicates: DeduplicationResult["duplicates"] = [];
    const seen = new Set<string>();
    const hashMap = new Map<string, ScrapedCall>();

    // First pass: hash-based deduplication
    for (const call of calls) {
      const hash = this.generateHash(call);

      if (seen.has(hash)) {
        const original = hashMap.get(hash)!;
        duplicates.push({
          original,
          duplicate: call,
          similarity: 1.0,
        });
      } else {
        seen.add(hash);
        hashMap.set(hash, call);
        unique.push(call);
      }
    }

    // Second pass: similarity-based deduplication
    const finalUnique: ScrapedCall[] = [];
    const similarityDuplicates: DeduplicationResult["duplicates"] = [];

    for (let i = 0; i < unique.length; i++) {
      let isDuplicate = false;

      for (let j = i + 1; j < unique.length; j++) {
        if (this.areDuplicates(unique[i], unique[j], 0.85)) {
          const similarity = this.calculateSimilarity(unique[i].title, unique[j].title);
          similarityDuplicates.push({
            original: unique[i],
            duplicate: unique[j],
            similarity,
          });
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        finalUnique.push(unique[i]);
      }
    }

    return {
      unique: finalUnique,
      duplicates: [...duplicates, ...similarityDuplicates],
    };
  }

  /**
   * Merge duplicate calls, keeping the most complete one
   */
  mergeDuplicates(calls: ScrapedCall[]): ScrapedCall[] {
    const result = this.deduplicate(calls);

    // For each duplicate, merge with original
    for (const { original, duplicate } of result.duplicates) {
      // Keep more complete information
      if (!original.budget && duplicate.budget) {
        original.budget = duplicate.budget;
      }
      if (!original.callType && duplicate.callType) {
        original.callType = duplicate.callType;
      }
      if (!original.entity && duplicate.entity) {
        original.entity = duplicate.entity;
      }
      if (!original.fullContent && duplicate.fullContent) {
        original.fullContent = duplicate.fullContent;
      }

      // Merge tags
      if (duplicate.tags) {
        const tagSet = new Set([...(original.tags || []), ...duplicate.tags]);
        original.tags = Array.from(tagSet);
      }
    }

    return result.unique;
  }

  /**
   * Remove duplicates from database
   * Returns list of URLs to remove
   */
  async removeDuplicatesFromDb(calls: ScrapedCall[]): Promise<string[]> {
    const result = this.deduplicate(calls);
    const urlsToRemove = result.duplicates.map(d => d.duplicate.sourceUrl);
    return urlsToRemove;
  }

  /**
   * Get deduplication statistics
   */
  getStatistics(calls: ScrapedCall[]): {
    total: number;
    unique: number;
    duplicates: number;
    deduplicationRate: number;
  } {
    const result = this.deduplicate(calls);
    return {
      total: calls.length,
      unique: result.unique.length,
      duplicates: result.duplicates.length,
      deduplicationRate: result.duplicates.length / calls.length,
    };
  }
}
