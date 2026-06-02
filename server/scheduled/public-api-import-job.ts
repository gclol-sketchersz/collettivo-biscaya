/**
 * Public API Import Job
 * Imports bandi from ANAC and OpenCoesione APIs
 * Scheduled: Daily at 4:00 AM UTC (0 0 4 * * *)
 */

import type { Request, Response } from "express";
import { ANACAPIClient } from "../api-clients/anac-api-client";
import { OpenCoesioneAPIClient } from "../api-clients/opencoesione-api-client";
import { getDb } from "../db";
import { callsForEntries, importLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const PUBLIC_API_IMPORT_JOB_CONFIG = {
  name: "public-api-import",
  cron: "0 0 4 * * *", // Daily at 4:00 AM UTC
  path: "/api/scheduled/public-api-import",
  method: "POST" as const,
};

interface ImportResult {
  ok: boolean;
  taskUid?: string;
  error?: string;
  context?: {
    handler: string;
    taskUid: string;
    timestamp: string;
    duration: number;
  };
  apisProcessed?: Array<{
    name: string;
    callsFound: number;
    callsImported: number;
    errors?: string;
  }>;
  totalCallsScraped?: number;
  totalCallsImported?: number;
  totalDuplicatesRemoved?: number;
  timestamp?: string;
  duration?: number;
}

export async function publicAPIImportJobHandler(req: Request, res: Response) {
  const startTime = Date.now();
  const taskUid = req.headers["x-manus-cron-task-uid"] as string;

  // Verify cron-only access
  if (!taskUid) {
    return res.status(403).json({
      error: "cron-only",
      message: "This endpoint is for cron jobs only",
    });
  }

  const result: ImportResult = {
    ok: true,
    taskUid,
    apisProcessed: [],
    totalCallsScraped: 0,
    totalCallsImported: 0,
    totalDuplicatesRemoved: 0,
    timestamp: new Date().toISOString(),
    duration: 0,
  };

  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }

    // 1. Import from ANAC API
    console.log("[PublicAPIImportJob] Importing from ANAC API...");
    try {
      const anacClient = new ANACAPIClient();
      const anacCalls = await anacClient.fetchBandi(100, 0);
      console.log(`[PublicAPIImportJob] ANAC API: Found ${anacCalls.length} calls`);

      // Simple deduplication: remove duplicates by URL
      const anacUrls = new Set<string>();
      const anacUnique = anacCalls.filter(call => {
        if (anacUrls.has(call.sourceUrl)) return false;
        anacUrls.add(call.sourceUrl);
        return true;
      });
      const anacDuplicateCount = anacCalls.length - anacUnique.length;

      let importedCount = 0;
      for (const call of anacUnique) {
        if (!call.sourceUrl) continue;
        try {
          const existing = await db
            .select()
            .from(callsForEntries)
            .where(eq(callsForEntries.externalLink, call.sourceUrl))
            .limit(1);

          if (existing.length === 0) {
            const callType = mapPublicAPICallType(call.callType);
            const values = {
              title: call.title,
              entity: call.entity || "ANAC",
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
          console.error("[PublicAPIImportJob] Error importing ANAC call:", error);
        }
      }

      result.apisProcessed!.push({
        name: "ANAC API",
        callsFound: anacCalls.length,
        callsImported: importedCount,
      });
      result.totalCallsScraped! += anacCalls.length;
      result.totalCallsImported! += importedCount;
      result.totalDuplicatesRemoved! += anacDuplicateCount;
    } catch (error) {
      console.error("[PublicAPIImportJob] Error importing ANAC API:", error);
      result.apisProcessed!.push({
        name: "ANAC API",
        callsFound: 0,
        callsImported: 0,
        errors: String(error),
      });
    }

    // 2. Import from OpenCoesione API
    console.log("[PublicAPIImportJob] Importing from OpenCoesione API...");
    try {
      const openCoesioneClient = new OpenCoesioneAPIClient();
      const openCoesioneCalls = await openCoesioneClient.fetchOpportunities(100, 0);
      console.log(
        `[PublicAPIImportJob] OpenCoesione API: Found ${openCoesioneCalls.length} calls`
      );

      // Simple deduplication: remove duplicates by URL
      const openCoesioneUrls = new Set<string>();
      const openCoesioneUnique = openCoesioneCalls.filter(call => {
        if (openCoesioneUrls.has(call.sourceUrl)) return false;
        openCoesioneUrls.add(call.sourceUrl);
        return true;
      });
      const openCoesioneDuplicateCount = openCoesioneCalls.length - openCoesioneUnique.length;

      let importedCount = 0;
      for (const call of openCoesioneUnique) {
        if (!call.sourceUrl) continue;
        try {
          const existing = await db
            .select()
            .from(callsForEntries)
            .where(eq(callsForEntries.externalLink, call.sourceUrl))
            .limit(1);

          if (existing.length === 0) {
            const callType = mapPublicAPICallType(call.callType);
            const values = {
              title: call.title,
              entity: call.entity || "OpenCoesione",
              country: (call.country || "IT") as string,
              geographicLevel: (call.geographicLevel || "national") as
                | "regional"
                | "national"
                | "european",
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
          console.error("[PublicAPIImportJob] Error importing OpenCoesione call:", error);
        }
      }

      result.apisProcessed!.push({
        name: "OpenCoesione API",
        callsFound: openCoesioneCalls.length,
        callsImported: importedCount,
      });
      result.totalCallsScraped! += openCoesioneCalls.length;
      result.totalCallsImported! += importedCount;
      result.totalDuplicatesRemoved! += openCoesioneDuplicateCount;
    } catch (error) {
      console.error("[PublicAPIImportJob] Error importing OpenCoesione API:", error);
      result.apisProcessed!.push({
        name: "OpenCoesione API",
        callsFound: 0,
        callsImported: 0,
        errors: String(error),
      });
    }

    // Note: importLogs structure is different - it logs individual imports
    // For now, we skip logging to importLogs table as it requires sourceId reference
    // This could be extended to create import_sources entries and log each call

    result.duration = Date.now() - startTime;
    return res.json(result);
  } catch (error) {
    console.error("[PublicAPIImportJob] Error:", error);
    result.duration = Date.now() - startTime;

    return res.status(500).json({
      ok: false,
      error: String(error),
      context: {
        handler: "public-api-import",
        taskUid,
        timestamp: new Date().toISOString(),
        duration: result.duration,
      },
    });
  }
}

/**
 * Map public API call type to standard enum
 */
function mapPublicAPICallType(
  callType: string
): "exhibition" | "residency" | "competition" | "grant" | "award" | "fellowship" | "curatorial_open_call" {
  const lower = callType.toLowerCase();

  if (lower.includes("residenza") || lower.includes("residency")) return "residency";
  if (lower.includes("premio") || lower.includes("award")) return "award";
  if (lower.includes("concorso") || lower.includes("competition")) return "competition";
  if (lower.includes("mostra") || lower.includes("exhibition") || lower.includes("biennale"))
    return "exhibition";
  if (lower.includes("fellowship")) return "fellowship";
  if (lower.includes("finanziamento") || lower.includes("grant")) return "grant";

  return "curatorial_open_call";
}
