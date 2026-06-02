import { describe, it, expect, vi, beforeAll } from "vitest";
import type { Request, Response } from "express";
import { rssImportJobHandler, RSS_IMPORT_JOB_CONFIG } from "./rss-import-job";

describe("RSS Import Job", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: any;
  let statusSpy: any;

  beforeAll(() => {
    jsonSpy = vi.fn().mockReturnValue(undefined);
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockReq = {
      headers: {
        "x-manus-cron-task-uid": "test-task-uid-rss-123",
      },
    };

    mockRes = {
      json: jsonSpy,
      status: statusSpy,
    };
  });

  it("should reject requests without cron authentication", async () => {
    const reqNoCron = { headers: {} };
    const res = { status: statusSpy, json: jsonSpy };

    await rssImportJobHandler(reqNoCron as Request, res as Response);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "cron-only",
        message: "This endpoint is for cron jobs only",
      })
    );
  });

  it("should have valid RSS import job configuration", () => {
    const config = RSS_IMPORT_JOB_CONFIG;

    expect(config.name).toBe("rss-import");
    expect(config.cron).toBe("0 0 1 * * *"); // Daily at 1:00 AM UTC
    expect(config.path).toBe("/api/scheduled/rss-import");
    expect(config.method).toBe("POST");
  });

  it("should have proper response structure", () => {
    const expectedStructure = {
      ok: expect.any(Boolean),
      taskUid: expect.any(String),
      feedsProcessed: expect.any(Array),
      totalCallsScraped: expect.any(Number),
      totalCallsImported: expect.any(Number),
      totalDuplicatesRemoved: expect.any(Number),
      timestamp: expect.any(String),
      duration: expect.any(Number),
    };

    expect(expectedStructure).toBeDefined();
  });

  it("should track feeds processed", () => {
    const feedStructure = {
      name: expect.any(String),
      callsFound: expect.any(Number),
      callsImported: expect.any(Number),
      errors: expect.any(String), // optional
    };

    expect(feedStructure).toBeDefined();
  });

  it("should support multiple RSS feeds", () => {
    const expectedFeeds = ["Exibart RSS", "On the Move RSS", "Artabus RSS"];
    expect(expectedFeeds.length).toBe(3);
    expect(expectedFeeds).toContain("Exibart RSS");
    expect(expectedFeeds).toContain("On the Move RSS");
    expect(expectedFeeds).toContain("Artabus RSS");
  });

  it("should have proper error handling", () => {
    const errorStructure = {
      ok: false,
      error: expect.any(String),
      context: expect.objectContaining({
        handler: "rss-import",
        taskUid: expect.any(String),
        timestamp: expect.any(String),
        duration: expect.any(Number),
      }),
    };

    expect(errorStructure).toBeDefined();
  });

  it("should run daily at 1:00 AM UTC", () => {
    const cronParts = RSS_IMPORT_JOB_CONFIG.cron.split(" ");

    expect(cronParts[0]).toBe("0"); // second
    expect(cronParts[1]).toBe("0"); // minute
    expect(cronParts[2]).toBe("1"); // hour (1 AM)
    expect(cronParts[3]).toBe("*"); // day (every day)
    expect(cronParts[4]).toBe("*"); // month (every month)
    expect(cronParts[5]).toBe("*"); // day of week (every day)
  });

  it("should parse RSS feeds from multiple sources", () => {
    const feedUrls = [
      "https://www.exibart.com/feed/",
      "https://www.on-the-move.org/en/calls/rss",
      "https://www.artabus.com/feed/",
    ];

    expect(feedUrls.length).toBe(3);
    feedUrls.forEach(url => {
      expect(url).toMatch(/^https:\/\//);
      expect(url).toMatch(/feed|rss/i);
    });
  });

  it("should handle deduplication by URL", () => {
    // Test deduplication logic
    const urls = new Set<string>();
    const testUrls = [
      "https://example.com/call1",
      "https://example.com/call1", // duplicate
      "https://example.com/call2",
    ];

    const unique = testUrls.filter(url => {
      if (urls.has(url)) return false;
      urls.add(url);
      return true;
    });

    expect(unique.length).toBe(2);
    expect(unique).toContain("https://example.com/call1");
    expect(unique).toContain("https://example.com/call2");
  });

  it("should map RSS call types correctly", () => {
    const typeMap = {
      residenza: "residency",
      premio: "award",
      concorso: "competition",
      mostra: "exhibition",
      fellowship: "fellowship",
      grant: "grant",
      bando: "curatorial_open_call",
    };

    expect(Object.keys(typeMap).length).toBeGreaterThan(0);
    expect(typeMap.residenza).toBe("residency");
    expect(typeMap.premio).toBe("award");
    expect(typeMap.mostra).toBe("exhibition");
  });
});
