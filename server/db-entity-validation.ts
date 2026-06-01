/**
 * Entity authority validation helpers
 * - Whitelist management
 * - Authority scoring
 * - Verification status
 */

import { and, eq, gte, desc } from "drizzle-orm";
import { verifiedEntities, entityScoringHistory } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Known authoritative entities (whitelist)
 * These are pre-verified cultural institutions
 */
const AUTHORITY_WHITELIST = new Set([
  "Fondazione Italia Patria della Bellezza",
  "Exibart",
  "On the Move",
  "MAXXI",
  "Castello di Rivoli",
  "Fondazione Sandretto Re Rebaudengo",
  "Fondazione Querini Stampalia",
  "Fondazione Prada",
  "Fondazione Morra",
  "Fondazione Carriero",
  "Fondazione Bevilacqua La Masa",
  "Fondazione Memmo",
  "Fondazione Plart",
  "Fondazione Arnaldo Pomodoro",
  "Fondazione Mazzotta",
  "Fondazione Ragghianti",
  "Fondazione Orestiadi",
  "Fondazione Cassa di Risparmio di Cuneo",
  "Fondazione Cassa di Risparmio di Alessandria",
  "Fondazione Cassa di Risparmio di Asti",
  "Fondazione Cassa di Risparmio di Biella",
  "Fondazione Cassa di Risparmio di Novara",
  "Fondazione Cassa di Risparmio di Vercelli",
  "Fondazione Cassa di Risparmio di Treviso",
  "Fondazione Cassa di Risparmio di Padova",
  "Fondazione Cassa di Risparmio di Venezia",
  "Fondazione Cassa di Risparmio di Verona",
  "Fondazione Cassa di Risparmio di Brescia",
  "Fondazione Cassa di Risparmio di Cremona",
  "Fondazione Cassa di Risparmio di Mantova",
  "Fondazione Cassa di Risparmio di Pavia",
  "Fondazione Cassa di Risparmio di Lodi",
  "Fondazione Cassa di Risparmio di Como",
  "Fondazione Cassa di Risparmio di Lecco",
  "Fondazione Cassa di Risparmio di Bergamo",
  "Fondazione Cassa di Risparmio di Brescia",
  "Fondazione Cariplo",
  "Fondazione Cariparo",
  "Fondazione Cassa di Risparmio di Padova e Rovigo",
  "Fondazione Cassa di Risparmio di Perugia",
  "Fondazione Cassa di Risparmio di Terni",
  "Fondazione Cassa di Risparmio di Spoleto",
  "Fondazione Cassa di Risparmio di Foligno",
  "Fondazione Cassa di Risparmio di Assisi",
  "Fondazione Cassa di Risparmio di Gubbio",
  "Fondazione Cassa di Risparmio di Narni",
  "Fondazione Cassa di Risparmio di Orvieto",
  "Fondazione Cassa di Risparmio di Civitavecchia",
  "Fondazione Cassa di Risparmio di Frosinone",
  "Fondazione Cassa di Risparmio di Latina",
  "Fondazione Cassa di Risparmio di Rieti",
  "Fondazione Cassa di Risparmio di Terracina",
  "Fondazione Cassa di Risparmio di Viterbo",
  "Fondazione Cassa di Risparmio di Roma",
  "Fondazione Cassa di Risparmio di Frascati",
  "Fondazione Cassa di Risparmio di Civitavecchia",
  "Fondazione Cassa di Risparmio di Valmontone",
]);

/**
 * Minimum authority score for verification (0-100)
 */
const MINIMUM_AUTHORITY_SCORE = 50;

/**
 * Check if an entity is in the whitelist
 */
export function isEntityInWhitelist(entityName: string): boolean {
  return AUTHORITY_WHITELIST.has(entityName);
}

/**
 * Get or create verified entity record
 */
export async function getOrCreateVerifiedEntity(entityName: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get entity: database not available");
    return null;
  }

  try {
    // Check if entity already exists
    const existing = await db
      .select()
      .from(verifiedEntities)
      .where(eq(verifiedEntities.name, entityName))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new entity record
    const isWhitelisted = isEntityInWhitelist(entityName);
    const initialScore = isWhitelisted ? 85 : 50; // Higher score for whitelisted entities

    const result = await db
      .insert(verifiedEntities)
      .values({
        name: entityName,
        type: "foundation",
        country: "IT",
        authorityScore: initialScore,
        isVerified: isWhitelisted ? 1 : 0,
      });

    // Return the created entity
    const created = await db
      .select()
      .from(verifiedEntities)
      .where(eq(verifiedEntities.name, entityName))
      .limit(1);

    return created[0] || null;
  } catch (error) {
    console.error("Failed to get or create verified entity:", error);
    return null;
  }
}

/**
 * Update entity authority score
 */
export async function updateEntityAuthorityScore(
  entityId: number,
  newScore: number,
  reason: string
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update entity: database not available");
    return false;
  }

  try {
    // Get current score
    const entity = await db
      .select()
      .from(verifiedEntities)
      .where(eq(verifiedEntities.id, entityId))
      .limit(1);

    if (entity.length === 0) {
      console.warn(`Entity with ID ${entityId} not found`);
      return false;
    }

    const previousScore = entity[0].authorityScore;

    // Update entity score
    await db
      .update(verifiedEntities)
      .set({
        authorityScore: newScore,
        isVerified: newScore >= MINIMUM_AUTHORITY_SCORE ? 1 : 0,
        updatedAt: new Date(),
      })
      .where(eq(verifiedEntities.id, entityId));

    // Log the change
    await db.insert(entityScoringHistory).values({
      entityId,
      previousScore,
      newScore,
      reason,
      createdAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error("Failed to update entity authority score:", error);
    return false;
  }
}

/**
 * Get verified entities with minimum score
 */
export async function getVerifiedEntities(
  minScore: number = MINIMUM_AUTHORITY_SCORE,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get entities: database not available");
    return [];
  }

  try {
    const entities = await db
      .select()
      .from(verifiedEntities)
      .where(gte(verifiedEntities.authorityScore, minScore))
      .orderBy(desc(verifiedEntities.authorityScore))
      .limit(limit);

    return entities;
  } catch (error) {
    console.error("Failed to get verified entities:", error);
    return [];
  }
}

/**
 * Validate entity authority
 * Returns true if entity is verified or has sufficient score
 */
export async function validateEntityAuthority(entityName: string): Promise<boolean> {
  // Quick whitelist check
  if (isEntityInWhitelist(entityName)) {
    return true;
  }

  // Check database
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot validate entity: database not available");
    return false;
  }

  try {
    const entity = await db
      .select()
      .from(verifiedEntities)
      .where(eq(verifiedEntities.name, entityName))
      .limit(1);

    if (entity.length === 0) {
      return false;
    }

    return entity[0].isVerified === 1 && entity[0].authorityScore >= MINIMUM_AUTHORITY_SCORE;
  } catch (error) {
    console.error("Failed to validate entity authority:", error);
    return false;
  }
}

/**
 * Get entity scoring history
 */
export async function getEntityScoringHistory(
  entityId: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get history: database not available");
    return [];
  }

  try {
    const history = await db
      .select()
      .from(entityScoringHistory)
      .where(eq(entityScoringHistory.entityId, entityId))
      .orderBy(desc(entityScoringHistory.createdAt))
      .limit(limit);

    return history;
  } catch (error) {
    console.error("Failed to get entity scoring history:", error);
    return [];
  }
}

/**
 * Get authority whitelist
 */
export function getAuthorityWhitelist(): string[] {
  return Array.from(AUTHORITY_WHITELIST).sort();
}

/**
 * Add entity to whitelist (admin only)
 * Note: This modifies the in-memory whitelist for this session
 * For persistence, update the AUTHORITY_WHITELIST constant
 */
export function addToWhitelist(entityName: string): void {
  AUTHORITY_WHITELIST.add(entityName);
}

/**
 * Remove entity from whitelist (admin only)
 * Note: This modifies the in-memory whitelist for this session
 * For persistence, update the AUTHORITY_WHITELIST constant
 */
export function removeFromWhitelist(entityName: string): void {
  AUTHORITY_WHITELIST.delete(entityName);
}
