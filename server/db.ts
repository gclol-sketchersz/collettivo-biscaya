import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, subscriptions, callsForEntries, savedCalls, notifications, emailPreferences, rssFeeds, rssImports, callViews, callInteractions, InsertRssFeed, chatHistory, InsertChatHistory } from "../drizzle/schema";
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


/**
 * Get or create email preferences for user
 */
export async function getOrCreateEmailPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const existing = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create default preferences
    await db.insert(emailPreferences).values({
      userId,
      newCallsNotification: 1,
      deadlineReminderNotification: 1,
      deadlineReminderDays: 7,
      notificationFrequency: "daily",
    });

    const created = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1);

    return created[0] || null;
  } catch (error) {
    console.error("Failed to get/create email preferences:", error);
    return null;
  }
}

/**
 * Update email preferences
 */
export async function updateEmailPreferences(
  userId: number,
  updates: Partial<{
    newCallsNotification: number;
    deadlineReminderNotification: number;
    deadlineReminderDays: number;
    notificationFrequency: string;
  }>
) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(emailPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailPreferences.userId, userId));
    return true;
  } catch (error) {
    console.error("Failed to update email preferences:", error);
    return false;
  }
}

/**
 * Get users who should receive new call notifications
 */
export async function getUsersForNewCallNotifications() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      preferences: emailPreferences,
    })
    .from(users)
    .innerJoin(
      emailPreferences,
      and(
        eq(emailPreferences.userId, users.id),
        eq(emailPreferences.newCallsNotification, 1)
      )
    );
}

/**
 * Get users who should receive deadline reminder notifications
 */
export async function getUsersForDeadlineReminders() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      preferences: emailPreferences,
    })
    .from(users)
    .innerJoin(
      emailPreferences,
      and(
        eq(emailPreferences.userId, users.id),
        eq(emailPreferences.deadlineReminderNotification, 1)
      )
    );
}

/**
 * Get calls with upcoming deadlines
 */
export async function getCallsWithUpcomingDeadlines(daysAhead: number) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return await db
    .select()
    .from(callsForEntries)
    .where(
      and(
        eq(callsForEntries.isActive, 1),
        gte(callsForEntries.deadline, now),
        lte(callsForEntries.deadline, futureDate)
      )
    )
    .orderBy(callsForEntries.deadline);
}

/**
 * Get recently added calls
 */
export async function getRecentlyAddedCalls(hoursAgo: number = 24) {
  const db = await getDb();
  if (!db) return [];

  const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  return await db
    .select()
    .from(callsForEntries)
    .where(
      and(
        eq(callsForEntries.isActive, 1),
        gte(callsForEntries.createdAt, cutoffTime)
      )
    )
    .orderBy(desc(callsForEntries.createdAt));
}

/**
 * Update last email sent timestamp
 */
export async function updateLastEmailSent(userId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db
      .update(emailPreferences)
      .set({ lastEmailSent: new Date() })
      .where(eq(emailPreferences.userId, userId));
    return true;
  } catch (error) {
    console.error("Failed to update last email sent:", error);
    return false;
  }
}


/**
 * RSS Feeds Management
 */
export async function getRssFeeds() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(rssFeeds).where(eq(rssFeeds.isActive, 1));
}

export async function createRssFeed(feed: InsertRssFeed) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(rssFeeds).values(feed);
  return result;
}

/**
 * Call Views & Interactions Tracking
 */
export async function trackCallView(callId: number, userId?: number) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(callViews).values({ callId, userId });
}

export async function trackCallInteraction(callId: number, interactionType: string, userId?: number) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(callInteractions).values({
    callId,
    userId,
    interactionType: interactionType as any,
  });
}

/**
 * Statistics
 */
export async function getCallStatistics(callId: number) {
  const db = await getDb();
  if (!db) return { views: 0, saves: 0, clicks: 0 };
  
  const views = await db.select().from(callViews).where(eq(callViews.callId, callId));
  const interactions = await db.select().from(callInteractions).where(eq(callInteractions.callId, callId));
  
  const saves = interactions.filter(i => i.interactionType === 'save').length;
  const clicks = interactions.filter(i => i.interactionType === 'external_link_click').length;
  
  return {
    views: views.length,
    saves,
    clicks,
    conversionRate: views.length > 0 ? ((saves + clicks) / views.length * 100).toFixed(2) : 0,
  };
}

export async function getDashboardStatistics() {
  const db = await getDb();
  if (!db) return { totalViews: 0, totalSaves: 0, totalClicks: 0, avgConversionRate: 0 };
  
  const allViews = await db.select().from(callViews);
  const allInteractions = await db.select().from(callInteractions);
  
  const totalSaves = allInteractions.filter(i => i.interactionType === 'save').length;
  const totalClicks = allInteractions.filter(i => i.interactionType === 'external_link_click').length;
  const totalViews = allViews.length;
  
  return {
    totalViews,
    totalSaves,
    totalClicks,
    avgConversionRate: totalViews > 0 ? ((totalSaves + totalClicks) / totalViews * 100).toFixed(2) : 0,
  };
}

export async function getCallsStatisticsByType() {
  const db = await getDb();
  if (!db) return [];
  
  const calls = await db.select().from(callsForEntries);
  const views = await db.select().from(callViews);
  const interactions = await db.select().from(callInteractions);
  
  const stats = calls.map(call => {
    const callViews = views.filter(v => v.callId === call.id).length;
    const callInteractions = interactions.filter(i => i.callId === call.id);
    const saves = callInteractions.filter(i => i.interactionType === 'save').length;
    const clicks = callInteractions.filter(i => i.interactionType === 'external_link_click').length;
    
    return {
      callId: call.id,
      title: call.title,
      callType: call.callType,
      views: callViews,
      saves,
      clicks,
      conversionRate: callViews > 0 ? ((saves + clicks) / callViews * 100).toFixed(2) : 0,
    };
  });
  
  return stats;
}

/**
 * Chat History Management
 */
export async function saveChatMessage(userId: number | undefined, role: 'user' | 'assistant', content: string) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(chatHistory).values({
      userId: userId || null,
      role,
      content,
    });
    return result;
  } catch (error) {
    console.error("Failed to save chat message:", error);
    return null;
  }
}

export async function getChatHistory(userId: number | undefined, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    if (userId) {
      return await db
        .select()
        .from(chatHistory)
        .where(eq(chatHistory.userId, userId))
        .orderBy(desc(chatHistory.createdAt))
        .limit(limit);
    } else {
      // For anonymous users, return empty array
      return [];
    }
  } catch (error) {
    console.error("Failed to get chat history:", error);
    return [];
  }
}

export async function clearChatHistory(userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.delete(chatHistory).where(eq(chatHistory.userId, userId));
    return true;
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    return false;
  }
}


/**
 * Get user profile with subscription and saved calls for Juana personalization
 */
export async function getUserProfileForJuana(userId: number | undefined) {
  if (!userId) return null;
  
  const db = await getDb();
  if (!db) return null;

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) return null;

    const subscription = await getUserSubscription(userId);
    const savedCalls = await getUserSavedCalls(userId);

    return {
      name: user[0].name,
      email: user[0].email,
      subscriptionLevel: subscription?.level || "base",
      savedCallsCount: savedCalls.length,
      savedCallIds: savedCalls.map(call => call.saved_calls.callId),
    };
  } catch (error) {
    console.error("Failed to get user profile for Juana:", error);
    return null;
  }
}


/**
 * Save rating and feedback for a chat message
 */
export async function saveMessageRating(messageId: number, rating: number, feedback?: string) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    await db.update(chatHistory)
      .set({ rating, feedback, updatedAt: new Date() })
      .where(eq(chatHistory.id, messageId));
    return true;
  } catch (error) {
    console.error("Failed to save message rating:", error);
    return false;
  }
}

/**
 * Get chat history with ratings for export
 */
export async function getChatHistoryForExport(userId: number | undefined) {
  if (!userId) return [];
  
  const db = await getDb();
  if (!db) return [];
  
  try {
    const history = await db.select().from(chatHistory)
      .where(eq(chatHistory.userId, userId))
      .orderBy(chatHistory.createdAt);
    return history;
  } catch (error) {
    console.error("Failed to get chat history for export:", error);
    return [];
  }
}

/**
 * Get chat statistics for Juana
 */
export async function getChatStatistics(userId: number | undefined) {
  if (!userId) return null;
  
  const db = await getDb();
  if (!db) return null;
  
  try {
    const history = await db.select().from(chatHistory)
      .where(eq(chatHistory.userId, userId));
    
    const totalMessages = history.length;
    const userMessages = history.filter(m => m.role === "user").length;
    const assistantMessages = history.filter(m => m.role === "assistant").length;
    const ratedMessages = history.filter(m => m.rating !== null).length;
    const averageRating = history
      .filter(m => m.rating !== null)
      .reduce((sum, m) => sum + (m.rating || 0), 0) / (ratedMessages || 1);
    
    return {
      totalMessages,
      userMessages,
      assistantMessages,
      ratedMessages,
      averageRating: Math.round(averageRating * 10) / 10,
    };
  } catch (error) {
    console.error("Failed to get chat statistics:", error);
    return null;
  }
}


/**
 * Get personalized context for Juana based on user data
 * Includes: saved calls, user preferences, subscription level
 */
export async function getPersonalizedContextForJuana(userId: number | undefined) {
  if (!userId) return null;
  
  const db = await getDb();
  if (!db) return null;
  
  try {
    // Get user profile
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.length === 0) return null;
    
    const userProfile = user[0];
    
    // Get user subscription
    const subscription = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    
    const subscriptionLevel = subscription && subscription.length > 0 
      ? subscription[0].level 
      : "base";
    
    // Get saved calls (up to 10 most recent)
    const savedCallsData = await db.select({
      id: savedCalls.callId,
      title: callsForEntries.title,
      callType: callsForEntries.callType,
      deadline: callsForEntries.deadline,
    })
      .from(savedCalls)
      .innerJoin(callsForEntries, eq(savedCalls.callId, callsForEntries.id))
      .where(eq(savedCalls.userId, userId))
      .orderBy(desc(savedCalls.savedAt))
      .limit(10);
    
    // Get email preferences
    const emailPrefs = await db.select().from(emailPreferences)
      .where(eq(emailPreferences.userId, userId))
      .limit(1);
    
    const preferences = emailPrefs && emailPrefs.length > 0 ? emailPrefs[0] : null;
    
    return {
      userName: userProfile.name || "Artista",
      email: userProfile.email,
      subscriptionLevel,
      savedCallsCount: savedCallsData.length,
      savedCalls: savedCallsData.map(call => ({
        title: call.title,
        callType: call.callType,
        deadline: call.deadline,
      })),
      newCallsNotificationEnabled: preferences?.newCallsNotification === 1,
      deadlineReminderEnabled: preferences?.deadlineReminderNotification === 1,
      notificationFrequency: preferences?.notificationFrequency || "daily",
    };
  } catch (error) {
    console.error("Failed to get personalized context for Juana:", error);
    return null;
  }
}
