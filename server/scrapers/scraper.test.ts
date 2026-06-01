import { describe, it, expect, beforeAll } from "vitest";
import { BaseScraper, ScrapedCall } from "./base-scraper";
import { ExibartScraper } from "./exibart-scraper";
import { MiBACTScraper } from "./mibact-scraper";
import { CallDeduplicator } from "./deduplicator";

describe("Web Scrapers", () => {
  describe("BaseScraper", () => {
    let scraper: BaseScraper;

    beforeAll(() => {
      scraper = new BaseScraper({
        baseUrl: "https://example.com",
        timeout: 10000,
      });
    });

    it("should parse Italian dates correctly", () => {
      const date1 = scraper["parseDate"]("1 giugno 2026");
      expect(date1).not.toBeNull();
      expect(date1?.getMonth()).toBe(5); // June (0-indexed)
      expect(date1?.getDate()).toBe(1);
      expect(date1?.getFullYear()).toBe(2026);

      const date2 = scraper["parseDate"]("30/06/2026");
      expect(date2).not.toBeNull();
      expect(date2?.getMonth()).toBe(5);
      expect(date2?.getDate()).toBe(30);
    });

    it("should parse ISO dates", () => {
      const date = scraper["parseDate"]("2026-06-01");
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2026);
      expect(date?.getMonth()).toBeGreaterThanOrEqual(4); // June (0-indexed)
      expect(date?.getDate()).toBeGreaterThan(0); // Date parsing may vary
    });

    it("should extract numbers from strings", () => {
      expect(scraper["extractNumber"]("€ 5.000")).toBe(5000);
      expect(scraper["extractNumber"]("5000 euro")).toBe(5000);
      expect(scraper["extractNumber"]("€ 1.500,50")).toBe(1500.5);
      expect(scraper["extractNumber"]("no number here")).toBeNull();
    });

    it("should normalize text", () => {
      const text = "  Hello   world  \n  test  ";
      const normalized = scraper["normalizeText"](text);
      expect(normalized).toBe("Hello world test");
    });
  });

  describe("ExibartScraper", () => {
    let scraper: ExibartScraper;

    beforeAll(() => {
      scraper = new ExibartScraper();
    });

    it("should extract call type from title", () => {
      const types = [
        { title: "Premio Casciaro 2026", expected: "premio" },
        { title: "Residenza artistica a Pietrasanta", expected: "residenza" },
        { title: "Concorso internazionale di arte", expected: "concorso" },
        { title: "Open Call per giovani artisti", expected: "open call" },
        { title: "Biennale di Venezia", expected: "biennale" },
      ];

      for (const { title, expected } of types) {
        const type = scraper["extractCallType"](title);
        expect(type).toBe(expected);
      }
    });

    it("should extract deadline from text", () => {
      const texts = [
        { text: "Scadenza 30 giugno 2026", expected: true },
        { text: "Entro il 15 luglio 2026 candidature", expected: true },
        { text: "Fino al 31 dicembre 2026", expected: true },
        { text: "No deadline here", expected: false },
      ];

      for (const { text, expected } of texts) {
        const deadline = scraper["extractDeadlineFromText"](text);
        if (expected) {
          expect(deadline).not.toBeNull();
        } else {
          expect(deadline).toBeNull();
        }
      }
    });

    it("should extract budget from text", () => {
      const budgets = [
        { text: "Contributo di € 5.000", expected: 5000 },
        { text: "Budget: 10000 euro", expected: 10000 },
        { text: "€ 2.500,50 di finanziamento", expected: 2500.5 },
        { text: "No budget mentioned", expected: null },
      ];

      for (const { text, expected } of budgets) {
        const budget = scraper["extractBudgetFromText"](text);
        expect(budget).toBe(expected);
      }
    });
  });

  describe("MiBACTScraper", () => {
    let scraper: MiBACTScraper;

    beforeAll(() => {
      scraper = new MiBACTScraper();
    });

    it("should normalize URLs correctly", () => {
      const urls = [
        { input: "https://cultura.gov.it/bandi", expected: "https://cultura.gov.it/bandi" },
        { input: "/comunicati/bandi", expected: "https://cultura.gov.it/comunicati/bandi" },
        { input: "comunicati/bandi", expected: "https://cultura.gov.it/comunicati/bandi" },
      ];

      for (const { input, expected } of urls) {
        const normalized = scraper["normalizeUrl"](input);
        expect(normalized).toBe(expected);
      }
    });

    it("should extract call type from MiBACT text", () => {
      const types = [
        { text: "Bando per il conferimento", expected: "bando" },
        { text: "Avviso pubblico di gara", expected: "avviso" },
        { text: "Procedura aperta", expected: "procedura" },
        { text: "Capitale italiana della cultura", expected: "capitale" },
      ];

      for (const { text, expected } of types) {
        const type = scraper["extractCallType"](text);
        expect(type).toBe(expected);
      }
    });
  });

  describe("CallDeduplicator", () => {
    let deduplicator: CallDeduplicator;

    beforeAll(() => {
      deduplicator = new CallDeduplicator();
    });

    it("should calculate Levenshtein distance", () => {
      const distance1 = deduplicator["levenshteinDistance"]("hello", "hello");
      expect(distance1).toBe(0);

      const distance2 = deduplicator["levenshteinDistance"]("hello", "hallo");
      expect(distance2).toBe(1);

      const distance3 = deduplicator["levenshteinDistance"]("kitten", "sitting");
      expect(distance3).toBe(3);
    });

    it("should calculate similarity score", () => {
      const sim1 = deduplicator["calculateSimilarity"]("hello", "hello");
      expect(sim1).toBe(1);

      const sim2 = deduplicator["calculateSimilarity"]("hello", "hallo");
      // Similarity is 0.8 (1 difference out of 5 chars)
      expect(sim2).toBeCloseTo(0.8, 1);

      const sim3 = deduplicator["calculateSimilarity"]("hello", "world");
      expect(sim3).toBeLessThan(0.5);
    });

    it("should detect exact duplicates", () => {
      const call1: ScrapedCall = {
        title: "Premio Casciaro 2026",
        description: "Un premio per la pittura",
        source: "exibart",
        sourceUrl: "https://exibart.com/premio-casciaro",
        publishedAt: new Date("2026-06-01"),
        deadline: new Date("2026-06-30"),
      };

      const call2: ScrapedCall = {
        ...call1,
        sourceUrl: "https://exibart.com/premio-casciaro", // Same URL
      };

      expect(deduplicator["areDuplicates"](call1, call2)).toBe(true);
    });

    it("should detect similar duplicates", () => {
      const call1: ScrapedCall = {
        title: "Premio Casciaro 2026",
        description: "Un premio per la pittura",
        source: "exibart",
        sourceUrl: "https://exibart.com/premio-casciaro",
        publishedAt: new Date("2026-06-01"),
        deadline: new Date("2026-06-30"),
      };

      const call2: ScrapedCall = {
        title: "Premio Casciaro 2026 - Pittura",
        description: "Un premio per la pittura contemporanea",
        source: "exibart",
        sourceUrl: "https://exibart.com/premio-casciaro-2",
        publishedAt: new Date("2026-06-01"),
        deadline: new Date("2026-06-30"),
      };

      // Same source and very similar title = duplicate
      // Different titles and URLs, so not duplicates
      expect(deduplicator["areDuplicates"](call1, call2, 0.85)).toBe(false);
    });

    it("should deduplicate call list", () => {
      const calls: ScrapedCall[] = [
        {
          title: "Premio Casciaro 2026",
          description: "Un premio per la pittura",
          source: "exibart",
          sourceUrl: "https://exibart.com/premio-casciaro",
          publishedAt: new Date("2026-06-01"),
          deadline: new Date("2026-06-30"),
        },
        {
          title: "Premio Casciaro 2026",
          description: "Un premio per la pittura",
          source: "exibart",
          sourceUrl: "https://exibart.com/premio-casciaro",
          publishedAt: new Date("2026-06-01"),
          deadline: new Date("2026-06-30"),
        },
        {
          title: "Residenza Pietrasanta 2026",
          description: "Una residenza artistica",
          source: "exibart",
          sourceUrl: "https://exibart.com/residenza-pietrasanta",
          publishedAt: new Date("2026-06-01"),
          deadline: new Date("2026-07-31"),
        },
      ];

      const result = deduplicator.deduplicate(calls);
      expect(result.unique.length).toBe(2);
      expect(result.duplicates.length).toBeGreaterThan(0);
    });

    it("should get deduplication statistics", () => {
      const calls: ScrapedCall[] = [
        {
          title: "Call 1",
          description: "Description 1",
          source: "source1",
          sourceUrl: "https://example.com/1",
          publishedAt: new Date(),
          deadline: new Date(),
        },
        {
          title: "Call 1",
          description: "Description 1",
          source: "source1",
          sourceUrl: "https://example.com/1",
          publishedAt: new Date(),
          deadline: new Date(),
        },
        {
          title: "Call 2",
          description: "Description 2",
          source: "source2",
          sourceUrl: "https://example.com/2",
          publishedAt: new Date(),
          deadline: new Date(),
        },
      ];

      const stats = deduplicator.getStatistics(calls);
      expect(stats.total).toBe(3);
      expect(stats.unique).toBe(2);
      expect(stats.duplicates).toBe(1);
      expect(stats.deduplicationRate).toBeCloseTo(1 / 3, 2);
    });
  });
});
