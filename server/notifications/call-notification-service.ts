/**
 * Call Notification Service
 * Handles email and in-app notifications for relevant calls
 */

import { getDb } from "../db";
import { notifications, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

export interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  minBudget?: number;
  callTypes?: string[];
  regions?: string[];
  frequency: "immediate" | "daily" | "weekly";
}

export interface CallNotificationPayload {
  callId: number;
  userId: number;
  title: string;
  entity: string;
  budget?: number;
  deadline?: Date;
  callType: string;
  sourceUrl: string;
  reason: string; // Why this call is relevant
}

/**
 * Send notification for a relevant call
 */
export async function sendCallNotification(payload: CallNotificationPayload) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[CallNotificationService] Database connection failed");
      return false;
    }

    // Get user
    const user = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

    if (!user || user.length === 0) {
      console.warn("[CallNotificationService] User not found:", payload.userId);
      return false;
    }

    const userRecord = user[0];

    // Create notification message
    const message = `${payload.entity} - ${payload.callType} - Budget: €${payload.budget?.toLocaleString("it-IT") || "N/A"} - Scadenza: ${payload.deadline?.toLocaleDateString("it-IT") || "N/A"}`;

    // Store notification in database
    await db.insert(notifications).values({
      userId: payload.userId,
      callId: payload.callId,
      type: "new_call",
      title: payload.title,
      message,
      isRead: 0,
    });

    // Send email notification if user has email
    if (userRecord.email) {
      await sendEmailNotification(payload, userRecord.email);
    }

    console.log(`[CallNotificationService] Notification created for user ${payload.userId}`);
    return true;
  } catch (error) {
    console.error("[CallNotificationService] Error sending notification:", error);
    return false;
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(payload: CallNotificationPayload, email: string) {
  try {
    // In a real implementation, this would use a service like SendGrid, Mailgun, etc.
    // For now, we'll use the built-in notifyOwner for demonstration

    const subject = `Nuovo bando rilevante: ${payload.title}`;
    const content = `
Abbiamo trovato un bando che potrebbe interessarti:

**${payload.title}**

Ente: ${payload.entity}
Tipo: ${payload.callType}
${payload.budget ? `Budget: €${payload.budget.toLocaleString("it-IT")}` : ""}
${payload.deadline ? `Scadenza: ${payload.deadline.toLocaleDateString("it-IT")}` : ""}

Motivo della segnalazione: ${payload.reason}

Visualizza il bando: ${payload.sourceUrl}

---
Collettivo Biscaya - Scopri i migliori bandi culturali
    `;

    // Send notification to owner for demonstration
    await notifyOwner({
      title: subject,
      content,
    });

    console.log(`[CallNotificationService] Email notification sent to ${email}`);
    return true;
  } catch (error) {
    console.error("[CallNotificationService] Error sending email:", error);
    return false;
  }
}

/**
 * Check if a call matches user preferences
 */
export function isCallRelevantForUser(
  call: any,
  preferences: NotificationPreferences
): { relevant: boolean; reason?: string } {
  // Check budget filter
  if (preferences.minBudget && call.budgetMin && call.budgetMin < preferences.minBudget) {
    return { relevant: false };
  }

  // Check call type filter
  if (preferences.callTypes && preferences.callTypes.length > 0) {
    if (!preferences.callTypes.includes(call.callType)) {
      return { relevant: false };
    }
  }

  // Check region filter
  if (preferences.regions && preferences.regions.length > 0) {
    if (!preferences.regions.includes(call.geographicLevel)) {
      return { relevant: false };
    }
  }

  // Check deadline (must not be expired)
  if (call.deadline) {
    const now = new Date();
    if (new Date(call.deadline) < now) {
      return { relevant: false, reason: "Deadline scaduto" };
    }
  }

  // Build reason for notification
  let reason = "Corrisponde ai tuoi criteri di ricerca";

  if (call.budgetMin && call.budgetMin >= (preferences.minBudget || 0)) {
    reason += ` (Budget: €${call.budgetMin.toLocaleString("it-IT")})`;
  }

  return { relevant: true, reason };
}

/**
 * Send batch notifications for new calls
 */
export async function sendBatchNotifications(calls: any[]) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[CallNotificationService] Database connection failed");
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Get all users with notification preferences
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
      // Get user preferences (simplified - in real app would be stored in DB)
      const preferences: NotificationPreferences = {
        emailNotifications: !!user.email, // Send email if user has email
        inAppNotifications: true,
        minBudget: 500, // Default €500 minimum
        callTypes: undefined,
        regions: undefined,
        frequency: "daily",
      };

      // Check each call
      for (const call of calls) {
        const { relevant, reason } = isCallRelevantForUser(call, preferences);

        if (relevant) {
          const success = await sendCallNotification({
            callId: call.id,
            userId: user.id,
            title: call.title,
            entity: call.entity,
            budget: call.budgetMin,
            deadline: call.deadline,
            callType: call.callType,
            sourceUrl: call.externalLink,
            reason: reason || "Corrisponde ai tuoi criteri",
          });

          if (success) {
            sent++;
          } else {
            failed++;
          }
        }
      }
    }

    console.log(
      `[CallNotificationService] Batch notifications sent: ${sent}, failed: ${failed}`
    );
    return { sent, failed };
  } catch (error) {
    console.error("[CallNotificationService] Error sending batch notifications:", error);
    return { sent: 0, failed: 0 };
  }
}

/**
 * Get unread notifications for user
 */
export async function getUserNotifications(userId: number, limit: number = 20) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[CallNotificationService] Database connection failed");
      return [];
    }

    const notificationList = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .limit(limit);

    return notificationList;
  } catch (error) {
    console.error("[CallNotificationService] Error getting user notifications:", error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[CallNotificationService] Database connection failed");
      return false;
    }

    await db
      .update(notifications)
      .set({ isRead: 1 })
      .where(eq(notifications.id, notificationId));

    return true;
  } catch (error) {
    console.error("[CallNotificationService] Error marking notification as read:", error);
    return false;
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[CallNotificationService] Database connection failed");
      return false;
    }

    await db.delete(notifications).where(eq(notifications.id, notificationId));

    return true;
  } catch (error) {
    console.error("[CallNotificationService] Error deleting notification:", error);
    return false;
  }
}

/**
 * Get notification statistics for user
 */
export async function getUserNotificationStats(userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[CallNotificationService] Database connection failed");
      return { total: 0, unread: 0, read: 0 };
    }

    const notificationList = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    const total = notificationList.length;
    const unread = notificationList.filter((n) => n.isRead === 0).length;
    const read = total - unread;

    return { total, unread, read };
  } catch (error) {
    console.error("[CallNotificationService] Error getting notification stats:", error);
    return { total: 0, unread: 0, read: 0 };
  }
}
