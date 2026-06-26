/**
 * Scheduled job for web scraping cultural calls
 * Runs daily to scrape from multiple sources and import new calls
 * 
 * Handler path: /api/scheduled/web-scraping
 * Cron: 0 0 2 * * * (daily 2:00 AM UTC)
 */

import type { Request, Response } from "express";
import { ExibartScraper } from "../scrapers/exibart-scraper";
import { MiBACTScraper } from "../scrapers/mibact-scraper";
import { CallDeduplicator } from "../scrapers/deduplicator";
import { getDb } from "../db";
import { callsForEntries } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Map scraper call type to database call type enum
 */
function mapCallType(type: string): "exhibition" | "residency" | "competition" | "grant" | "award" | "fellowship" | "curatorial_open_call" {
  const typeMap: Record<string, "exhibition" | "residency" | "competition" | "grant" | "award" | "fellowship" | "curatorial_open_call"> = {
    residenza: "residency",
    residency: "residency",
    premio: "award",
    award: "award",
    concorso: "competition",
    competition: "competition",
    mostra: "exhibition",
    exhibition: "exhibition",
    biennale: "exhibition",
    fellowship: "fellowship",
    grant: "grant",
    open_call: "curatorial_open_call",
    bando: "curatorial_open_call",
    avviso: "curatorial_open_call",
  };
  return typeMap[type.toLowerCase()] || "curatorial_open_call";
}

export interface ScrapingJobResult {
  ok: boolean;
  taskUid?: string;
  sourcesScraped: {
    name: string;
    callsFound: number;
    callsImported: number;
    errors?: string;
  }[];
  totalCallsScraped: number;
  totalCallsImported: number;
  totalDuplicatesRemoved: number;
  timestamp: string;
  duration: number;
}

/**
 * Main web scraping job handler
 */
export async function webScrapingJobHandler(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();

  try {
    // Verify this is a cron request from Manus platform
    const cronTaskUid = req.headers["x-manus-cron-task-uid"];
    if (!cronTaskUid || typeof cronTaskUid !== "string") {
      res.status(403).json({ error: "cron-only", message: "This endpoint is for cron jobs only" });
      return;
    }

    console.log("[WebScrapingJob] Starting web scraping job...");

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result: ScrapingJobResult = {
      ok: false,
      taskUid: cronTaskUid,
      sourcesScraped: [],
      totalCallsScraped: 0,
      totalCallsImported: 0,
      totalDuplicatesRemoved: 0,
      timestamp: new Date().toISOString(),
      duration: 0,
    };

    const deduplicator = new CallDeduplicator();

    // 1. Scrape from Exibart
    console.log("[WebScrapingJob] Scraping Exibart...");
    try {
      const exibartScraper = new ExibartScraper();
      const exibartCalls = await exibartScraper.scrapeAllPages(3); // First 3 pages
      console.log(`[WebScrapingJob] Exibart: Found ${exibartCalls.length} calls`);

      const exibartDedup = deduplicator.deduplicate(exibartCalls);
      const exibartUnique = exibartDedup.unique;

      // Import unique calls
      let importedCount = 0;
      for (const call of exibartUnique) {
        try {
          // Check if call already exists
          const existing = await db
            .select()
            .from(callsForEntries)
            .where(eq(callsForEntries.externalLink, call.sourceUrl))
            .limit(1);

          if (existing.length === 0) {
            // Insert new call
            const callType = mapCallType(call.callType || "curatorial_open_call");
            await db.insert(callsForEntries).values({
              title: call.title,
              entity: call.entity || "Exibart",
              country: call.country || "IT",
              geographicLevel: "national",
              callType,
              deadline: call.deadline,
              budgetMin: call.budget ? Math.floor(call.budget) : undefined,
              budgetMax: call.budget ? Math.floor(call.budget) : undefined,
              budgetCurrency: "EUR",
              externalLink: call.sourceUrl,
              requirements: call.description,
              isActive: 1,
            });
            importedCount++;
          }
        } catch (error) {
          console.error("[WebScrapingJob] Error importing Exibart call:", error);
        }
      }

      result.sourcesScraped.push({
        name: "Exibart",
        callsFound: exibartCalls.length,
        callsImported: importedCount,
      });
      result.totalCallsScraped += exibartCalls.length;
      result.totalCallsImported += importedCount;
      result.totalDuplicatesRemoved += exibartDedup.duplicates.length;
    } catch (error) {
      console.error("[WebScrapingJob] Error scraping Exibart:", error);
      result.sourcesScraped.push({
        name: "Exibart",
        callsFound: 0,
        callsImported: 0,
        errors: error instanceof Error ? error.message : String(error),
      });
    }

    // 2. Scrape from MiBACT
    console.log("[WebScrapingJob] Scraping MiBACT...");
    try {
      const mibactScraper = new MiBACTScraper();
      const mibactCalls = await mibactScraper.scrapeAllPages(3); // First 3 pages
      console.log(`[WebScrapingJob] MiBACT: Found ${mibactCalls.length} calls`);

      const mibactDedup = deduplicator.deduplicate(mibactCalls);
      const mibactUnique = mibactDedup.unique;

      // Import unique calls
      let importedCount = 0;
      for (const call of mibactUnique) {
        try {
          // Check if call already exists
          const existing = await db
            .select()
            .from(callsForEntries)
            .where(eq(callsForEntries.externalLink, call.sourceUrl))
            .limit(1);

          if (existing.length === 0) {
            // Insert new call
            const callType = mapCallType(call.callType || "curatorial_open_call");
            await db.insert(callsForEntries).values({
              title: call.title,
              entity: call.entity || "Ministero della Cultura",
              country: call.country || "IT",
              geographicLevel: "national",
              callType,
              deadline: call.deadline,
              budgetMin: call.budget ? Math.floor(call.budget) : undefined,
              budgetMax: call.budget ? Math.floor(call.budget) : undefined,
              budgetCurrency: "EUR",
              externalLink: call.sourceUrl,
              requirements: call.description,
              isActive: 1,
            });
            importedCount++;
          }
        } catch (error) {
          console.error("[WebScrapingJob] Error importing MiBACT call:", error);
        }
      }

      result.sourcesScraped.push({
        name: "MiBACT",
        callsFound: mibactCalls.length,
        callsImported: importedCount,
      });
      result.totalCallsScraped += mibactCalls.length;
      result.totalCallsImported += importedCount;
      result.totalDuplicatesRemoved += mibactDedup.duplicates.length;
    } catch (error) {
      console.error("[WebScrapingJob] Error scraping MiBACT:", error);
      result.sourcesScraped.push({
        name: "MiBACT",
        callsFound: 0,
        callsImported: 0,
        errors: error instanceof Error ? error.message : String(error),
      });
    }

    // Note: importLogs is for tracking individual call imports
    // For job-level logging, we could create a separate scraping_logs table
    // For now, just log to console

    result.ok = true;
    result.duration = Date.now() - startTime;

    console.log(`[WebScrapingJob] Job completed: ${result.totalCallsImported} calls imported in ${result.duration}ms`);

    res.json(result);
  } catch (error) {
    console.error("[WebScrapingJob] Error in web scraping job:", error);

    const duration = Date.now() - startTime;
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        handler: "web-scraping",
        taskUid: req.headers["x-manus-cron-task-uid"],
        timestamp: new Date().toISOString(),
        duration,
      },
    });
  }
}

/**
 * Job configuration for Heartbeat scheduler
 */
export const WEB_SCRAPING_JOB_CONFIG = {
  name: "web-scraping",
  cron: "0 0 2 * * *", // Daily at 2:00 AM UTC
  path: "/api/scheduled/web-scraping",
  method: "POST" as const,
  description: "Daily web scraping of cultural calls from Exibart and MiBACT",
};

/**
 * Helper to create the scheduled job
 * Usage from CLI:
 * manus-heartbeat create \
 *   --name web-scraping \
 *   --cron "0 0 2 * * *" \
 *   --path /api/scheduled/web-scraping \
 *   --description "Daily web scraping of cultural calls"
 */
export function getWebScrapingJobConfig() {
  return WEB_SCRAPING_JOB_CONFIG;
}
