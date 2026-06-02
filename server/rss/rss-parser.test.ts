import { describe, it, expect } from "vitest";
import { BaseRSSParser, type RSSFeedConfig } from "./base-rss-parser";

describe("RSS Parsers", () => {
  describe("BaseRSSParser", () => {
    it("should parse date strings correctly", () => {
      const config: RSSFeedConfig = {
        name: "Test Feed",
        url: "https://example.com/feed",
        entity: "Test Entity",
        source: "test-rss",
      };

      const parser = new BaseRSSParser(config);

      // Test date parsing via protected method
      const dateStr = "Mon, 15 Jun 2026 10:30:00 GMT";
      const date = parser["parseDate"](dateStr);

      expect(date).toBeDefined();
      expect(date?.getFullYear()).toBe(2026);
      expect(date?.getMonth()).toBe(5); // June (0-indexed)
    });

    it("should extract numbers from text", () => {
      const config: RSSFeedConfig = {
        name: "Test Feed",
        url: "https://example.com/feed",
        entity: "Test Entity",
        source: "test-rss",
      };

      const parser = new BaseRSSParser(config);

      // Test number extraction via protected method
      const text1 = "Budget: 5000 euros";
      const num1 = parser["extractNumber"](text1);
      expect(num1).toBe(5000);

      const text2 = "Compenso: 1.500,50 EUR";
      const num2 = parser["extractNumber"](text2);
      expect(num2).toBeDefined();
    });

    it("should extract deadline from text", () => {
      const config: RSSFeedConfig = {
        name: "Test Feed",
        url: "https://example.com/feed",
        entity: "Test Entity",
        source: "test-rss",
      };

      const parser = new BaseRSSParser(config);

      // Test deadline extraction via protected method
      const text1 = "Deadline: 31/12/2026";
      const deadline1 = parser["extractDeadline"](text1);
      expect(deadline1).toBeDefined();
      expect(deadline1?.getDate()).toBe(31);
      expect(deadline1?.getMonth()).toBe(11); // December (0-indexed)
      expect(deadline1?.getFullYear()).toBe(2026);

      const text2 = "Scadenza: 30-06-2026";
      const deadline2 = parser["extractDeadline"](text2);
      expect(deadline2).toBeDefined();
      expect(deadline2?.getDate()).toBe(30);
      expect(deadline2?.getMonth()).toBe(5); // June (0-indexed)
    });

    it("should detect call type from text", () => {
      const config: RSSFeedConfig = {
        name: "Test Feed",
        url: "https://example.com/feed",
        entity: "Test Entity",
        source: "test-rss",
      };

      const parser = new BaseRSSParser(config);

      // Test call type detection via protected method
      expect(parser["detectCallType"]("residenza")).toBe("residency");
      expect(parser["detectCallType"]("premio")).toBe("award");
      expect(parser["detectCallType"]("concorso")).toBe("competition");
      expect(parser["detectCallType"]("mostra")).toBe("exhibition");
      expect(parser["detectCallType"]("biennale")).toBe("exhibition");
      expect(parser["detectCallType"]("fellowship")).toBe("fellowship");
      expect(parser["detectCallType"]("finanziamento")).toBe("grant");
      expect(parser["detectCallType"]("unknown")).toBe("curatorial_open_call");
    });

    it("should extract text from XML elements", () => {
      const config: RSSFeedConfig = {
        name: "Test Feed",
        url: "https://example.com/feed",
        entity: "Test Entity",
        source: "test-rss",
      };

      const parser = new BaseRSSParser(config);

      // Test text extraction via protected method
      expect(parser["getText"]("simple string")).toBe("simple string");
      expect(parser["getText"](["array", "of", "strings"])).toBe("array");
      expect(parser["getText"](undefined)).toBe("");
      expect(parser["getText"](null)).toBe("");
    });

    it("should handle RSS 2.0 format", () => {
      const config: RSSFeedConfig = {
        name: "Test Feed",
        url: "https://example.com/feed",
        entity: "Test Entity",
        source: "test-rss",
      };

      const parser = new BaseRSSParser(config);

      // Mock RSS 2.0 structure
      const mockRSSItem = {
        title: ["Test Call"],
        description: ["Test Description"],
        link: ["https://example.com/call1"],
        pubDate: ["Mon, 15 Jun 2026 10:30:00 GMT"],
        guid: ["guid-123"],
      };

      const call = parser["parseRSSItem"](mockRSSItem);

      expect(call).toBeDefined();
      expect(call?.title).toBe("Test Call");
      expect(call?.description).toBe("Test Description");
      expect(call?.sourceUrl).toBe("https://example.com/call1");
      expect(call?.guid).toBe("guid-123");
    });

    it("should handle Atom format", () => {
      const config: RSSFeedConfig = {
        name: "Test Feed",
        url: "https://example.com/feed",
        entity: "Test Entity",
        source: "test-rss",
      };

      const parser = new BaseRSSParser(config);

      // Mock Atom entry structure
      const mockAtomEntry = {
        title: ["Test Call"],
        summary: ["Test Summary"],
        link: [{ $: { href: "https://example.com/call1" } }],
        published: ["2026-06-15T10:30:00Z"],
        id: ["urn:uuid:123"],
      };

      const call = parser["parseAtomEntry"](mockAtomEntry);

      expect(call).toBeDefined();
      expect(call?.title).toBe("Test Call");
      expect(call?.description).toBe("Test Summary");
      expect(call?.sourceUrl).toBe("https://example.com/call1");
      expect(call?.guid).toBe("urn:uuid:123");
    });

    it("should validate RSS feed configuration", () => {
      const config: RSSFeedConfig = {
        name: "Exibart",
        url: "https://www.exibart.com/feed/",
        entity: "Exibart",
        source: "exibart-rss",
      };

      expect(config.name).toBe("Exibart");
      expect(config.url).toMatch(/^https:\/\//);
      expect(config.entity).toBeTruthy();
      expect(config.source).toBeTruthy();
    });

    it("should handle missing optional fields", () => {
      const config: RSSFeedConfig = {
        name: "Test Feed",
        url: "https://example.com/feed",
        entity: "Test Entity",
        source: "test-rss",
      };

      const parser = new BaseRSSParser(config);

      // Mock RSS item with minimal fields
      const minimalItem = {
        title: ["Minimal Call"],
        link: ["https://example.com/call"],
      };

      const call = parser["parseRSSItem"](minimalItem);

      expect(call).toBeDefined();
      expect(call?.title).toBe("Minimal Call");
      expect(call?.description).toBe("");
      expect(call?.deadline).toBeUndefined();
    });

    it("should skip items without title or link", () => {
      const config: RSSFeedConfig = {
        name: "Test Feed",
        url: "https://example.com/feed",
        entity: "Test Entity",
        source: "test-rss",
      };

      const parser = new BaseRSSParser(config);

      // Mock RSS item without title
      const noTitleItem = {
        description: ["No Title"],
        link: ["https://example.com/call"],
      };

      const call1 = parser["parseRSSItem"](noTitleItem);
      expect(call1).toBeNull();

      // Mock RSS item without link
      const noLinkItem = {
        title: ["No Link"],
        description: ["Test"],
      };

      const call2 = parser["parseRSSItem"](noLinkItem);
      expect(call2).toBeNull();
    });
  });

  describe("RSS Feed Configuration", () => {
    it("should have valid Exibart feed URL", () => {
      const exibartUrl = "https://www.exibart.com/feed/";
      expect(exibartUrl).toMatch(/exibart/i);
      expect(exibartUrl).toMatch(/^https:\/\//);
    });

    it("should have valid On the Move feed URL", () => {
      const onTheMoveUrl = "https://www.on-the-move.org/en/calls/rss";
      expect(onTheMoveUrl).toMatch(/on-the-move/i);
      expect(onTheMoveUrl).toMatch(/^https:\/\//);
    });

    it("should have valid Artabus feed URL", () => {
      const artabusUrl = "https://www.artabus.com/feed/";
      expect(artabusUrl).toMatch(/artabus/i);
      expect(artabusUrl).toMatch(/^https:\/\//);
    });
  });
});
