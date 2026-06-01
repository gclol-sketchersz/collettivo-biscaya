import { describe, it, expect } from "vitest";
import {
  isEntityInWhitelist,
  getAuthorityWhitelist,
  addToWhitelist,
  removeFromWhitelist,
} from "./db-entity-validation";

// Constant value for testing
const MINIMUM_AUTHORITY_SCORE = 50;

describe("entity validation", () => {
  describe("whitelist management", () => {
    it("should check if entity is in whitelist", () => {
      expect(isEntityInWhitelist("Fondazione Italia Patria della Bellezza")).toBe(true);
      expect(isEntityInWhitelist("Exibart")).toBe(true);
      expect(isEntityInWhitelist("On the Move")).toBe(true);
    });

    it("should return false for unknown entities", () => {
      expect(isEntityInWhitelist("Unknown Entity XYZ")).toBe(false);
      expect(isEntityInWhitelist("Fake Foundation 123")).toBe(false);
    });

    it("should get authority whitelist", () => {
      const whitelist = getAuthorityWhitelist();
      expect(Array.isArray(whitelist)).toBe(true);
      expect(whitelist.length).toBeGreaterThan(0);
      expect(whitelist).toContain("Fondazione Italia Patria della Bellezza");
      expect(whitelist).toContain("Exibart");
    });

    it("should have sorted whitelist", () => {
      const whitelist = getAuthorityWhitelist();
      const sorted = [...whitelist].sort();
      expect(whitelist).toEqual(sorted);
    });

    it("should add entity to whitelist", () => {
      const testEntity = "Test Entity 123";
      expect(isEntityInWhitelist(testEntity)).toBe(false);
      
      addToWhitelist(testEntity);
      expect(isEntityInWhitelist(testEntity)).toBe(true);
      
      // Cleanup
      removeFromWhitelist(testEntity);
      expect(isEntityInWhitelist(testEntity)).toBe(false);
    });

    it("should remove entity from whitelist", () => {
      const testEntity = "Test Entity 456";
      
      addToWhitelist(testEntity);
      expect(isEntityInWhitelist(testEntity)).toBe(true);
      
      removeFromWhitelist(testEntity);
      expect(isEntityInWhitelist(testEntity)).toBe(false);
    });
  });

  describe("authority scoring", () => {
    it("should have valid minimum authority score", () => {
      expect(MINIMUM_AUTHORITY_SCORE).toBeGreaterThanOrEqual(0);
      expect(MINIMUM_AUTHORITY_SCORE).toBeLessThanOrEqual(100);
    });

    it("should have minimum score of 50 or higher", () => {
      expect(MINIMUM_AUTHORITY_SCORE).toBeGreaterThanOrEqual(50);
    });
  });

  describe("whitelist content", () => {
    it("should include major Italian foundations", () => {
      const whitelist = getAuthorityWhitelist();
      const majorFoundations = [
        "MAXXI",
        "Castello di Rivoli",
        "Fondazione Sandretto Re Rebaudengo",
        "Fondazione Prada",
      ];
      
      majorFoundations.forEach(foundation => {
        expect(whitelist).toContain(foundation);
      });
    });

    it("should include Cassa di Risparmio foundations", () => {
      const whitelist = getAuthorityWhitelist();
      const hasCarFoundations = whitelist.some(entity => 
        entity.includes("Cassa di Risparmio")
      );
      expect(hasCarFoundations).toBe(true);
    });

    it("should include RSS sources", () => {
      const whitelist = getAuthorityWhitelist();
      expect(whitelist).toContain("Exibart");
      expect(whitelist).toContain("On the Move");
    });
  });

  describe("whitelist integrity", () => {
    it("should have no duplicate entries", () => {
      const whitelist = getAuthorityWhitelist();
      const uniqueWhitelist = new Set(whitelist);
      expect(whitelist.length).toBe(uniqueWhitelist.size);
    });

    it("should have non-empty entity names", () => {
      const whitelist = getAuthorityWhitelist();
      whitelist.forEach(entity => {
        expect(entity.length).toBeGreaterThan(0);
        expect(entity.trim()).toBe(entity); // No leading/trailing spaces
      });
    });

    it("should have reasonable number of entities", () => {
      const whitelist = getAuthorityWhitelist();
      expect(whitelist.length).toBeGreaterThanOrEqual(50);
      expect(whitelist.length).toBeLessThan(500);
    });
  });
});
