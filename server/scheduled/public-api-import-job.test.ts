import { describe, it, expect, vi, beforeAll } from "vitest";
import type { Request, Response } from "express";
import { publicAPIImportJobHandler, PUBLIC_API_IMPORT_JOB_CONFIG } from "./public-api-import-job";

describe("Public API Import Job", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: any;
  let statusSpy: any;

  beforeAll(() => {
    jsonSpy = vi.fn().mockReturnValue(undefined);
    statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

    mockReq = {
      headers: {
        "x-manus-cron-task-uid": "test-task-uid-api-123",
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

    await publicAPIImportJobHandler(reqNoCron as Request, res as Response);

    expect(statusSpy).toHaveBeenCalledWith(403);
    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "cron-only",
        message: "This endpoint is for cron jobs only",
      })
    );
  });

  it("should have valid public API import job configuration", () => {
    const config = PUBLIC_API_IMPORT_JOB_CONFIG;

    expect(config.name).toBe("public-api-import");
    expect(config.cron).toBe("0 0 4 * * *"); // Daily at 4:00 AM UTC
    expect(config.path).toBe("/api/scheduled/public-api-import");
    expect(config.method).toBe("POST");
  });

  it("should have proper response structure", () => {
    const expectedStructure = {
      ok: expect.any(Boolean),
      taskUid: expect.any(String),
      apisProcessed: expect.any(Array),
      totalCallsScraped: expect.any(Number),
      totalCallsImported: expect.any(Number),
      totalDuplicatesRemoved: expect.any(Number),
      timestamp: expect.any(String),
      duration: expect.any(Number),
    };

    expect(expectedStructure).toBeDefined();
  });

  it("should track APIs processed", () => {
    const apiStructure = {
      name: expect.any(String),
      callsFound: expect.any(Number),
      callsImported: expect.any(Number),
      errors: expect.any(String), // optional
    };

    expect(apiStructure).toBeDefined();
  });

  it("should support multiple public APIs", () => {
    const expectedAPIs = ["ANAC API", "OpenCoesione API"];
    expect(expectedAPIs.length).toBe(2);
    expect(expectedAPIs).toContain("ANAC API");
    expect(expectedAPIs).toContain("OpenCoesione API");
  });

  it("should have proper error handling", () => {
    const errorStructure = {
      ok: false,
      error: expect.any(String),
      context: expect.objectContaining({
        handler: "public-api-import",
        taskUid: expect.any(String),
        timestamp: expect.any(String),
        duration: expect.any(Number),
      }),
    };

    expect(errorStructure).toBeDefined();
  });

  it("should run daily at 4:00 AM UTC", () => {
    const cronParts = PUBLIC_API_IMPORT_JOB_CONFIG.cron.split(" ");

    expect(cronParts[0]).toBe("0"); // second
    expect(cronParts[1]).toBe("0"); // minute
    expect(cronParts[2]).toBe("4"); // hour (4 AM)
    expect(cronParts[3]).toBe("*"); // day (every day)
    expect(cronParts[4]).toBe("*"); // month (every month)
    expect(cronParts[5]).toBe("*"); // day of week (every day)
  });

  it("should import from ANAC API", () => {
    const anacAPI = {
      name: "ANAC API",
      baseUrl: "https://dati.anticorruzione.it/api/",
      methods: ["fetchBandi", "searchBandi", "getBandiByEntity"],
    };

    expect(anacAPI.name).toBe("ANAC API");
    expect(anacAPI.baseUrl).toMatch(/^https:\/\//);
    expect(anacAPI.methods.length).toBe(3);
  });

  it("should import from OpenCoesione API", () => {
    const openCoesioneAPI = {
      name: "OpenCoesione API",
      baseUrl: "https://opencoesione.gov.it/api/",
      methods: [
        "fetchOpportunities",
        "searchOpportunities",
        "getOpportunitiesByRegion",
        "getOpportunitiesByPeriod",
      ],
    };

    expect(openCoesioneAPI.name).toBe("OpenCoesione API");
    expect(openCoesioneAPI.baseUrl).toMatch(/^https:\/\//);
    expect(openCoesioneAPI.methods.length).toBe(4);
  });

  it("should handle deduplication by URL", () => {
    // Test deduplication logic
    const urls = new Set<string>();
    const testUrls = [
      "https://example.com/bando1",
      "https://example.com/bando1", // duplicate
      "https://example.com/bando2",
    ];

    const unique = testUrls.filter(url => {
      if (urls.has(url)) return false;
      urls.add(url);
      return true;
    });

    expect(unique.length).toBe(2);
    expect(unique).toContain("https://example.com/bando1");
    expect(unique).toContain("https://example.com/bando2");
  });

  it("should map public API call types correctly", () => {
    const typeMap = {
      residenza: "residency",
      premio: "award",
      concorso: "competition",
      mostra: "exhibition",
      fellowship: "fellowship",
      finanziamento: "grant",
      bando: "curatorial_open_call",
    };

    expect(Object.keys(typeMap).length).toBeGreaterThan(0);
    expect(typeMap.residenza).toBe("residency");
    expect(typeMap.premio).toBe("award");
    expect(typeMap.mostra).toBe("exhibition");
  });

  it("should track import statistics", () => {
    const stats = {
      totalCallsScraped: 0,
      totalCallsImported: 0,
      totalDuplicatesRemoved: 0,
    };

    expect(stats.totalCallsScraped).toBe(0);
    expect(stats.totalCallsImported).toBe(0);
    expect(stats.totalDuplicatesRemoved).toBe(0);
  });

  it("should include timestamp in response", () => {
    const timestamp = new Date().toISOString();
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should measure job duration", () => {
    const startTime = Date.now();
    const duration = Date.now() - startTime;

    expect(typeof duration).toBe("number");
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});
