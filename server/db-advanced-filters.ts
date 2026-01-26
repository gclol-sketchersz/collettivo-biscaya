import { and, between, gte, lte, eq, inArray, desc, asc, or, like, count } from "drizzle-orm";
import { callsForEntries } from "../drizzle/schema";
import { getDb } from "./db";

export type SortOption = "deadline-asc" | "deadline-desc" | "budget-asc" | "budget-desc" | "relevance";
export type GeographicLevel = "regional" | "national" | "european";
export type CallType = "exhibition" | "residency" | "competition" | "grant" | "award" | "fellowship" | "curatorial_open_call";

export interface AdvancedFilterParams {
  budgetMin?: number;
  budgetMax?: number;
  geographicLevels?: GeographicLevel[];
  callTypes?: CallType[];
  deadlineFrom?: Date;
  deadlineTo?: Date;
  searchQuery?: string;
  sortBy?: SortOption;
  limit?: number;
  offset?: number;
}

/**
 * Get calls with advanced filtering and sorting
 */
export async function getCallsWithAdvancedFilters(params: AdvancedFilterParams) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get calls: database not available");
    return [];
  }

  try {
    const conditions: any[] = [eq(callsForEntries.isActive, 1)];

    // Budget filter
    if (params.budgetMin !== undefined && params.budgetMax !== undefined) {
      conditions.push(
        or(
          and(
            gte(callsForEntries.budgetMax, params.budgetMin),
            lte(callsForEntries.budgetMin, params.budgetMax)
          )
        )
      );
    } else if (params.budgetMin !== undefined) {
      conditions.push(gte(callsForEntries.budgetMax, params.budgetMin));
    } else if (params.budgetMax !== undefined) {
      conditions.push(lte(callsForEntries.budgetMin, params.budgetMax));
    }

    // Geographic level filter
    if (params.geographicLevels && params.geographicLevels.length > 0) {
      conditions.push(inArray(callsForEntries.geographicLevel, params.geographicLevels));
    }

    // Call type filter
    if (params.callTypes && params.callTypes.length > 0) {
      conditions.push(inArray(callsForEntries.callType, params.callTypes));
    }

    // Deadline filter
    if (params.deadlineFrom && params.deadlineTo) {
      conditions.push(
        between(callsForEntries.deadline, params.deadlineFrom, params.deadlineTo)
      );
    } else if (params.deadlineFrom) {
      conditions.push(gte(callsForEntries.deadline, params.deadlineFrom));
    } else if (params.deadlineTo) {
      conditions.push(lte(callsForEntries.deadline, params.deadlineTo));
    }

    // Search query filter
    if (params.searchQuery) {
      const searchTerm = `%${params.searchQuery}%`;
      conditions.push(
        or(
          like(callsForEntries.title, searchTerm),
          like(callsForEntries.entity, searchTerm),
          like(callsForEntries.qualitativeNotes, searchTerm)
        )
      );
    }

    // Build base query
    let query: any = db.select().from(callsForEntries).where(and(...conditions));

    // Apply sorting
    if (params.sortBy === "deadline-asc") {
      query = query.orderBy(asc(callsForEntries.deadline));
    } else if (params.sortBy === "deadline-desc") {
      query = query.orderBy(desc(callsForEntries.deadline));
    } else if (params.sortBy === "budget-asc") {
      query = query.orderBy(asc(callsForEntries.budgetMin));
    } else if (params.sortBy === "budget-desc") {
      query = query.orderBy(desc(callsForEntries.budgetMax));
    } else {
      query = query.orderBy(desc(callsForEntries.createdAt));
    }

    // Apply pagination
    if (params.limit) {
      query = query.limit(params.limit);
    }
    if (params.offset) {
      query = query.offset(params.offset);
    }

    const results = await query;
    return results;
  } catch (error) {
    console.error("[Database] Failed to get calls with advanced filters:", error);
    throw error;
  }
}

/**
 * Get budget statistics for filtering UI
 */
export async function getBudgetStatistics() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get budget statistics: database not available");
    return null;
  }

  try {
    const calls = await db
      .select({
        budgetMin: callsForEntries.budgetMin,
        budgetMax: callsForEntries.budgetMax,
      })
      .from(callsForEntries)
      .where(eq(callsForEntries.isActive, 1));

    if (calls.length === 0) {
      return {
        minBudget: 0,
        maxBudget: 0,
        avgBudget: 0,
      };
    }

    const budgets = calls
      .map((c) => c.budgetMin || c.budgetMax || 0)
      .filter((b) => b > 0);

    const minBudget = Math.min(...budgets);
    const maxBudget = Math.max(...budgets);
    const avgBudget = Math.round(
      budgets.reduce((a, b) => a + b, 0) / budgets.length
    );

    return {
      minBudget,
      maxBudget,
      avgBudget,
    };
  } catch (error) {
    console.error("[Database] Failed to get budget statistics:", error);
    return null;
  }
}

/**
 * Get available geographic levels and call types for filtering
 */
export async function getFilterOptions() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get filter options: database not available");
    return null;
  }

  try {
    const calls = await db
      .select({
        geographicLevel: callsForEntries.geographicLevel,
        callType: callsForEntries.callType,
      })
      .from(callsForEntries)
      .where(eq(callsForEntries.isActive, 1));

    const geographicLevels = Array.from(new Set(calls.map((c) => c.geographicLevel)));
    const callTypes = Array.from(new Set(calls.map((c) => c.callType)));

    return {
      geographicLevels: geographicLevels as GeographicLevel[],
      callTypes: callTypes as CallType[],
    };
  } catch (error) {
    console.error("[Database] Failed to get filter options:", error);
    return null;
  }
}

/**
 * Count calls matching filters (for pagination)
 */
export async function countCallsWithFilters(params: AdvancedFilterParams): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot count calls: database not available");
    return 0;
  }

  try {
    const conditions: any[] = [eq(callsForEntries.isActive, 1)];

    if (params.budgetMin !== undefined && params.budgetMax !== undefined) {
      conditions.push(
        or(
          and(
            gte(callsForEntries.budgetMax, params.budgetMin),
            lte(callsForEntries.budgetMin, params.budgetMax)
          )
        )
      );
    }

    if (params.geographicLevels && params.geographicLevels.length > 0) {
      conditions.push(inArray(callsForEntries.geographicLevel, params.geographicLevels));
    }

    if (params.callTypes && params.callTypes.length > 0) {
      conditions.push(inArray(callsForEntries.callType, params.callTypes));
    }

    if (params.deadlineFrom && params.deadlineTo) {
      conditions.push(
        between(callsForEntries.deadline, params.deadlineFrom, params.deadlineTo)
      );
    }

    if (params.searchQuery) {
      const searchTerm = `%${params.searchQuery}%`;
      conditions.push(
        or(
          like(callsForEntries.title, searchTerm),
          like(callsForEntries.entity, searchTerm),
          like(callsForEntries.qualitativeNotes, searchTerm)
        )
      );
    }

    const result = await db
      .select({ count: count() })
      .from(callsForEntries)
      .where(and(...conditions));

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Failed to count calls:", error);
    return 0;
  }
}
