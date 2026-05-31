/**
 * Database helpers for call automation:
 * - Filtering by minimum compensation (€500)
 * - Removing expired calls
 * - Entity authority validation
 */

import { and, gte, lt, eq, gt, desc, or } from "drizzle-orm";
import { callsForEntries } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get calls with minimum compensation threshold (€500)
 * Returns active calls where budgetMin >= minCompensation and deadline is in the future
 */
export async function getCallsWithMinimumCompensation(
  minCompensation: number = 500,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get calls: database not available");
    return [];
  }

  try {
    const conditions = [
      eq(callsForEntries.isActive, 1),
      gte(callsForEntries.budgetMin, minCompensation),
      gt(callsForEntries.deadline, new Date())
    ];

    let query: any = db.select().from(callsForEntries).where(and(...conditions));
    query = query.orderBy(desc(callsForEntries.deadline));
    
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }

    const calls = await query;
    return calls;
  } catch (error) {
    console.error("Failed to get calls with minimum compensation:", error);
    return [];
  }
}

/**
 * Count calls with minimum compensation threshold
 */
export async function countCallsWithMinimumCompensation(
  minCompensation: number = 500
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot count calls: database not available");
    return 0;
  }

  try {
    const conditions = [
      eq(callsForEntries.isActive, 1),
      gte(callsForEntries.budgetMin, minCompensation),
      gt(callsForEntries.deadline, new Date())
    ];

    const calls = await db.select().from(callsForEntries).where(and(...conditions));
    return calls.length;
  } catch (error) {
    console.error("Failed to count calls:", error);
    return 0;
  }
}

/**
 * Remove expired calls (deadline < now) by setting isActive to 0
 * Returns the number of calls updated
 */
export async function removeExpiredCalls() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot remove expired calls: database not available");
    return 0;
  }

  try {
    const result = await db
      .update(callsForEntries)
      .set({ isActive: 0 })
      .where(lt(callsForEntries.deadline, new Date()));

    // Drizzle returns different result types depending on the database
    // For MySQL/TiDB, we need to check the result structure
    const affectedRows = (result as any)?.rowsAffected || 0;
    return affectedRows;
  } catch (error) {
    console.error("Failed to remove expired calls:", error);
    return 0;
  }
}

/**
 * Get expired calls (for logging/auditing purposes)
 */
export async function getExpiredCalls(limit: number = 50) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get expired calls: database not available");
    return [];
  }

  try {
    const conditions = [
      eq(callsForEntries.isActive, 1),
      lt(callsForEntries.deadline, new Date())
    ];

    let query: any = db.select().from(callsForEntries).where(and(...conditions));
    query = query.orderBy(desc(callsForEntries.deadline));
    
    if (limit) {
      query = query.limit(limit);
    }

    const calls = await query;
    return calls;
  } catch (error) {
    console.error("Failed to get expired calls:", error);
    return [];
  }
}

/**
 * Get calls by verified entity (for authority validation)
 */
export async function getCallsByVerifiedEntity(
  entityId: string,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get calls: database not available");
    return [];
  }

  try {
    const conditions = [
      eq(callsForEntries.isActive, 1),
      eq(callsForEntries.entity, entityId),
      gt(callsForEntries.deadline, new Date())
    ];

    let query: any = db.select().from(callsForEntries).where(and(...conditions));
    query = query.orderBy(desc(callsForEntries.deadline));
    
    if (limit) {
      query = query.limit(limit);
    }
    if (offset) {
      query = query.offset(offset);
    }

    const calls = await query;
    return calls;
  } catch (error) {
    console.error("Failed to get calls by entity:", error);
    return [];
  }
}
