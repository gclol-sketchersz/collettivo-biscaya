/**
 * Scheduled job for RSS feed import
 * Runs daily to import cultural calls from RSS feeds
 * 
 * Handler path: /api/scheduled/rss-import
 * Cron: 0 0 1 * * * (daily 1:00 AM UTC)
 */

import type { Request, Response } from "express";
import { ExibartRSSParser } from "../rss/exibart-rss-parser";
import { OnTheMovRSSParser } from "../rss/on-the-move-rss-parser";
import { ArtabusRSSParser } from "../rss/artabus-rss-parser";
// Note: RSS calls have different structure than ScrapedCalls
// We'll use a simple deduplication based on URL
import { getDb } from "../db";
import { callsForEntries } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface RSSImportJobResult {
  ok: boolean;
  taskUid?: string;
  feedsProcessed: {
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
 * Map RSS call type to database call type enum
 */
function mapRSSCallType(type: string): "exhibition" | "residency" | "competition" | "grant" | "award" | "fellowship" | "curatorial_open_call" {
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

/**
 * Main RSS import job handler
 */
export async function rssImportJobHandler(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    // Verify this is a cron request from Manus platform
    const cronTaskUid = req.headers["x-manus-cron-task-uid"];
    if (!cronTaskUid || typeof cronTaskUid !== "string") {
      return res.status(403).json({ error: "cron-only", message: "This endpoint is for cron jobs only" });
    }

    console.log("[RSSImportJob] Starting RSS import job...");

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result: RSSImportJobResult = {
      ok: false,
      taskUid: cronTaskUid,
      feedsProcessed: [],
      totalCallsScraped: 0,
      totalCallsImported: 0,
      totalDuplicatesRemoved: 0,
      timestamp: new Date().toISOString(),
      duration: 0,
    };



    // 1. Import from Exibart RSS
    console.log("[RSSImportJob] Importing Exibart RSS...");
    try {
      const exibartParser = new ExibartRSSParser();
      const exibartCalls = await exibartParser.parseFeed();
      console.log(`[RSSImportJob] Exibart RSS: Found ${exibartCalls.length} calls`);

      // Simple deduplication: remove duplicates by URL
      const exibartUrls = new Set<string>();
      const exibartUnique = exibartCalls.filter(call => {
        if (exibartUrls.has(call.sourceUrl)) return false;
        exibartUrls.add(call.sourceUrl);
        return true;
      });
      const exibartDuplicateCount = exibartCalls.length - exibartUnique.length;

      let importedCount = 0;
      for (const call of exibartUnique) {
        if (!call.sourceUrl) continue; // Skip calls without URL
        try {
          const existing = await db
            .select()
            .from(callsForEntries)
            .where(eq(callsForEntries.externalLink, call.sourceUrl))
            .limit(1);

          if (existing.length === 0) {
            const callType = mapRSSCallType(call.callType);
            const values = {
              title: call.title,
              entity: call.entity || "Unknown",
              country: (call.country || "IT") as string,
              geographicLevel: "national" as const,
              callType,
              deadline: call.deadline || new Date(),
              budgetMin: call.budget ? Math.floor(call.budget) : undefined,
              budgetMax: call.budget ? Math.floor(call.budget) : undefined,
              budgetCurrency: "EUR",
              externalLink: call.sourceUrl,
              requirements: call.description || "",
              isActive: 1,
            };
            await db.insert(callsForEntries).values(values);
            importedCount++;
          }
        } catch (error) {
          console.error("[RSSImportJob] Error importing Exibart call:", error);
        }
      }

      result.feedsProcessed.push({
        name: "Exibart RSS",
        callsFound: exibartCalls.length,
        callsImported: importedCount,
      });
      result.totalCallsScraped += exibartCalls.length;
      result.totalCallsImported += importedCount;
      result.totalDuplicatesRemoved += exibartDuplicateCount;
    } catch (error) {
      console.error("[RSSImportJob] Error importing Exibart RSS:", error);
      result.feedsProcessed.push({
        name: "Exibart RSS",
        callsFound: 0,
        callsImported: 0,
        errors: error instanceof Error ? error.message : String(error),
      });
    }

    // 2. Import from On the Move RSS
    console.log("[RSSImportJob] Importing On the Move RSS...");
    try {
      const onTheMoveParser = new OnTheMovRSSParser();
      const onTheMoveCalls = await onTheMoveParser.parseFeed();
      console.log(`[RSSImportJob] On the Move RSS: Found ${onTheMoveCalls.length} calls`);

      // Simple deduplication: remove duplicates by URL
      const onTheMoveUrls = new Set<string>();
      const onTheMoveUnique = onTheMoveCalls.filter(call => {
        if (onTheMoveUrls.has(call.sourceUrl)) return false;
        onTheMoveUrls.add(call.sourceUrl);
        return true;
      });
      const onTheMoveDuplicateCount = onTheMoveCalls.length - onTheMoveUnique.length;

      let importedCount = 0;
      for (const call of onTheMoveUnique) {
        if (!call.sourceUrl) continue; // Skip calls without URL
        try {
          const existing = await db
            .select()
            .from(callsForEntries)
            .where(eq(callsForEntries.externalLink, call.sourceUrl))
            .limit(1);

          if (existing.length === 0) {
            const callType = mapRSSCallType(call.callType);
            const values = {
              title: call.title,
              entity: call.entity || "Unknown",
              country: (call.country || "EU") as string,
              geographicLevel: "european" as const,
              callType,
              deadline: call.deadline || new Date(),
              budgetMin: call.budget ? Math.floor(call.budget) : undefined,
              budgetMax: call.budget ? Math.floor(call.budget) : undefined,
              budgetCurrency: "EUR",
              externalLink: call.sourceUrl,
              requirements: call.description || "",
              isActive: 1,
            };
            await db.insert(callsForEntries).values(values);
            importedCount++;
          }
        } catch (error) {
          console.error("[RSSImportJob] Error importing On the Move call:", error);
        }
      }

      result.feedsProcessed.push({
        name: "On the Move RSS",
        callsFound: onTheMoveCalls.length,
        callsImported: importedCount,
      });
      result.totalCallsScraped += onTheMoveCalls.length;
      result.totalCallsImported += importedCount;
      result.totalDuplicatesRemoved += onTheMoveDuplicateCount;
    } catch (error) {
      console.error("[RSSImportJob] Error importing On the Move RSS:", error);
      result.feedsProcessed.push({
        name: "On the Move RSS",
        callsFound: 0,
        callsImported: 0,
        errors: error instanceof Error ? error.message : String(error),
      });
    }

    // 3. Import from Artabus RSS
    console.log("[RSSImportJob] Importing Artabus RSS...");
    try {
      const artabusParser = new ArtabusRSSParser();
      const artabusCalls = await artabusParser.parseFeed();
      console.log(`[RSSImportJob] Artabus RSS: Found ${artabusCalls.length} calls`);

      // Simple deduplication: remove duplicates by URL
      const artabusUrls = new Set<string>();
      const artabusUnique = artabusCalls.filter(call => {
        if (artabusUrls.has(call.sourceUrl)) return false;
        artabusUrls.add(call.sourceUrl);
        return true;
      });
      const artabusDuplicateCount = artabusCalls.length - artabusUnique.length;

      let importedCount = 0;
      for (const call of artabusUnique) {
        if (!call.sourceUrl) continue; // Skip calls without URL
        try {
          const existing = await db
            .select()
            .from(callsForEntries)
            .where(eq(callsForEntries.externalLink, call.sourceUrl))
            .limit(1);

          if (existing.length === 0) {
            const callType = mapRSSCallType(call.callType);
            const values = {
              title: call.title,
              entity: call.entity || "Unknown",
              country: (call.country || "IT") as string,
              geographicLevel: "national" as const,
              callType,
              deadline: call.deadline || new Date(),
              budgetMin: call.budget ? Math.floor(call.budget) : undefined,
              budgetMax: call.budget ? Math.floor(call.budget) : undefined,
              budgetCurrency: "EUR",
              externalLink: call.sourceUrl,
              requirements: call.description || "",
              isActive: 1,
            };
            await db.insert(callsForEntries).values(values);
            importedCount++;
          }
        } catch (error) {
          console.error("[RSSImportJob] Error importing Artabus call:", error);
        }
      }

      result.feedsProcessed.push({
        name: "Artabus RSS",
        callsFound: artabusCalls.length,
        callsImported: importedCount,
      });
      result.totalCallsScraped += artabusCalls.length;
      result.totalCallsImported += importedCount;
      result.totalDuplicatesRemoved += artabusDuplicateCount;
    } catch (error) {
      console.error("[RSSImportJob] Error importing Artabus RSS:", error);
      result.feedsProcessed.push({
        name: "Artabus RSS",
        callsFound: 0,
        callsImported: 0,
        errors: error instanceof Error ? error.message : String(error),
      });
    }

    result.ok = true;
    result.duration = Date.now() - startTime;

    console.log(`[RSSImportJob] Job completed: ${result.totalCallsImported} calls imported in ${result.duration}ms`);

    res.json(result);
  } catch (error) {
    console.error("[RSSImportJob] Error in RSS import job:", error);

    const duration = Date.now() - startTime;
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        handler: "rss-import",
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
export const RSS_IMPORT_JOB_CONFIG = {
  name: "rss-import",
  cron: "0 0 1 * * *", // Daily at 1:00 AM UTC
  path: "/api/scheduled/rss-import",
  method: "POST" as const,
  description: "Daily RSS import from cultural feeds (Exibart, On the Move, Artabus)",
};

export function getRSSImportJobConfig() {
  return RSS_IMPORT_JOB_CONFIG;
}
