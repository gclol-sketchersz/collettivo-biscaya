/**
 * Advanced automation helpers for linking calls to verified entities
 * - Join calls with verified_entities based on authority score
 * - Filter calls by verified entity status
 * - Get calls only from authoritative sources
 */

import { and, gte, lt, eq, gt, desc, inArray } from "drizzle-orm";
import { callsForEntries, verifiedEntities } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get calls only from verified entities with minimum authority score
 * Joins callsForEntries with verifiedEntities and filters by authority
 */
export async function getCallsFromVerifiedEntities(
  minAuthorityScore: number = 50,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get calls from verified entities: database not available");
    return [];
  }

  try {
    // Get verified entities with minimum score
    const verifiedEntityList = await db
      .select({ name: verifiedEntities.name })
      .from(verifiedEntities)
      .where(
        and(
          gte(verifiedEntities.authorityScore, minAuthorityScore),
          eq(verifiedEntities.isVerified, 1)
        )
      );

    if (verifiedEntityList.length === 0) {
      return [];
    }

    const verifiedEntityNames = verifiedEntityList.map(e => e.name);

    // Get calls from verified entities
    const conditions = [
      eq(callsForEntries.isActive, 1),
      inArray(callsForEntries.entity, verifiedEntityNames),
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
    console.error("Failed to get calls from verified entities:", error);
    return [];
  }
}

/**
 * Count calls from verified entities
 */
export async function countCallsFromVerifiedEntities(
  minAuthorityScore: number = 50
): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot count calls: database not available");
    return 0;
  }

  try {
    // Get verified entities with minimum score
    const verifiedEntityList = await db
      .select({ name: verifiedEntities.name })
      .from(verifiedEntities)
      .where(
        and(
          gte(verifiedEntities.authorityScore, minAuthorityScore),
          eq(verifiedEntities.isVerified, 1)
        )
      );

    if (verifiedEntityList.length === 0) {
      return 0;
    }

    const verifiedEntityNames = verifiedEntityList.map(e => e.name);

    // Count calls from verified entities
    const conditions = [
      eq(callsForEntries.isActive, 1),
      inArray(callsForEntries.entity, verifiedEntityNames),
      gt(callsForEntries.deadline, new Date())
    ];

    const result = await db
      .select({ count: callsForEntries.id })
      .from(callsForEntries)
      .where(and(...conditions));

    return result.length;
  } catch (error) {
    console.error("Failed to count calls from verified entities:", error);
    return 0;
  }
}

/**
 * Get calls with minimum compensation from verified entities
 * Combines minimum compensation filter with verified entity filter
 */
export async function getCallsWithMinCompensationFromVerifiedEntities(
  minCompensation: number = 500,
  minAuthorityScore: number = 50,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get calls: database not available");
    return [];
  }

  try {
    // Get verified entities with minimum score
    const verifiedEntityList = await db
      .select({ name: verifiedEntities.name })
      .from(verifiedEntities)
      .where(
        and(
          gte(verifiedEntities.authorityScore, minAuthorityScore),
          eq(verifiedEntities.isVerified, 1)
        )
      );

    if (verifiedEntityList.length === 0) {
      return [];
    }

    const verifiedEntityNames = verifiedEntityList.map(e => e.name);

    // Get calls with minimum compensation from verified entities
    const conditions = [
      eq(callsForEntries.isActive, 1),
      inArray(callsForEntries.entity, verifiedEntityNames),
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
    console.error("Failed to get calls with minimum compensation from verified entities:", error);
    return [];
  }
}

/**
 * Get entity verification status for a call
 * Returns entity info and verification details
 */
export async function getCallEntityVerificationStatus(callId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get entity status: database not available");
    return null;
  }

  try {
    // Get call
    const call = await db
      .select()
      .from(callsForEntries)
      .where(eq(callsForEntries.id, callId))
      .limit(1);

    if (call.length === 0) {
      return null;
    }

    const callEntity = call[0];

    // Get entity verification status
    const entity = await db
      .select()
      .from(verifiedEntities)
      .where(eq(verifiedEntities.name, callEntity.entity))
      .limit(1);

    if (entity.length === 0) {
      return {
        callId,
        entity: callEntity.entity,
        isVerified: false,
        authorityScore: 0,
        verificationStatus: "unknown"
      };
    }

    const entityData = entity[0];
    return {
      callId,
      entity: callEntity.entity,
      isVerified: entityData.isVerified === 1,
      authorityScore: entityData.authorityScore,
      verificationStatus: entityData.isVerified === 1 ? "verified" : "pending",
      entityType: entityData.type,
      country: entityData.country,
      website: entityData.website
    };
  } catch (error) {
    console.error("Failed to get entity verification status:", error);
    return null;
  }
}
