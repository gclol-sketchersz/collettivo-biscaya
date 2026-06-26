/**
 * Scheduled job to remove expired calls (deadline < now)
 * Runs daily at 3:00 AM UTC
 * 
 * This handler is called by the Manus Heartbeat system
 * Path: /api/scheduled/cleanup-expired-calls
 * Cron: 0 0 3 * * * (daily 3:00 AM UTC)
 */

import type { Request, Response } from "express";
import { removeExpiredCalls, getExpiredCalls } from "../db-automation";
import { getDb } from "../db";
import { importLogs } from "../../drizzle/schema";

export async function cleanupExpiredCallsHandler(req: Request, res: Response): Promise<void> {
  try {
    // Verify this is a cron request from Manus platform
    // The platform sets this header for authenticated cron calls
    const cronTaskUid = req.headers["x-manus-cron-task-uid"];
    if (!cronTaskUid || typeof cronTaskUid !== "string") {
      res.status(403).json({ error: "cron-only", message: "This endpoint is for cron jobs only" });
      return;
    }

    // Get expired calls before removal (for logging)
    const expiredCalls = await getExpiredCalls(1000);
    
    // Remove expired calls
    const removedCount = await removeExpiredCalls();
    
    // Log the operation (optional - for audit trail)
    const db = await getDb();
    if (db && removedCount > 0) {
      try {
        await db.insert(importLogs).values({
          status: "success",
          reason: `System cleanup: removed ${removedCount} expired calls`,
          createdAt: new Date(),
        });
      } catch (logError) {
        console.warn("Failed to log cleanup operation:", logError);
      }
    }
    
    // Return success response
    res.json({
      ok: true,
      removedCount,
      expiredCallsCount: expiredCalls.length,
      taskUid: cronTaskUid,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in cleanup-expired-calls handler:", error);
    
    // Return error response with details for platform Investigate flow
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        handler: "cleanup-expired-calls",
        taskUid: req.headers["x-manus-cron-task-uid"],
        timestamp: new Date().toISOString(),
      },
    });
  }
}

/**
 * Helper function to create the scheduled job
 * Call this from the CLI or from a setup procedure
 * 
 * Usage from CLI:
 * manus-heartbeat create \
 *   --name cleanup-expired-calls \
 *   --cron "0 0 3 * * *" \
 *   --path /api/scheduled/cleanup-expired-calls \
 *   --description "Daily cleanup of expired cultural calls"
 */
export const CLEANUP_JOB_CONFIG = {
  name: "cleanup-expired-calls",
  cron: "0 0 3 * * *", // Daily at 3:00 AM UTC
  path: "/api/scheduled/cleanup-expired-calls",
  description: "Daily cleanup of expired cultural calls at 3:00 AM UTC",
};
