import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptions, callsForEntries, savedCalls, notifications } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all active calls for entries
 */
export async function getAllActiveCalls() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(callsForEntries)
    .where(eq(callsForEntries.isActive, 1))
    .orderBy(desc(callsForEntries.deadline));
}

/**
 * Get calls filtered by geographic level
 */
export async function getCallsByLevel(level: "regional" | "national" | "european") {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(callsForEntries)
    .where(
      and(
        eq(callsForEntries.isActive, 1),
        eq(callsForEntries.geographicLevel, level)
      )
    )
    .orderBy(desc(callsForEntries.deadline));
}

/**
 * Get call by ID
 */
export async function getCallById(callId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(callsForEntries)
    .where(eq(callsForEntries.id, callId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get user's saved calls
 */
export async function getUserSavedCalls(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(callsForEntries)
    .innerJoin(savedCalls, eq(savedCalls.callId, callsForEntries.id))
    .where(eq(savedCalls.userId, userId));
}

/**
 * Save a call for user
 */
export async function saveCallForUser(userId: number, callId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(savedCalls).values({ userId, callId });
    return true;
  } catch (error) {
    console.error("Failed to save call:", error);
    return false;
  }
}

/**
 * Remove saved call
 */
export async function removeSavedCall(userId: number, callId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .delete(savedCalls)
      .where(and(eq(savedCalls.userId, userId), eq(savedCalls.callId, callId)));
    return true;
  } catch (error) {
    console.error("Failed to remove saved call:", error);
    return false;
  }
}

/**
 * Create or update user subscription
 */
export async function upsertSubscription(
  userId: number,
  level: "base" | "premium" | "pro"
) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .insert(subscriptions)
      .values({
        userId,
        level,
        startDate: new Date(),
        isActive: 1,
      })
      .onDuplicateKeyUpdate({
        set: {
          level,
          updatedAt: new Date(),
        },
      });
    return true;
  } catch (error) {
    console.error("Failed to upsert subscription:", error);
    return false;
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.id, notificationId));
    return true;
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return false;
  }
}

/**
 * Create notification
 */
export async function createNotification(
  userId: number,
  type: "new_call" | "deadline_reminder" | "subscription_update",
  title: string,
  message?: string,
  callId?: number
) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(notifications).values({
      userId,
      type,
      title,
      message,
      callId,
      isRead: 0,
    });
    return true;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return false;
  }
}
