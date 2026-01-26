import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getOrCreateEmailPreferences,
  updateEmailPreferences,
} from "../db";
import { sendTestEmail } from "../email-service";

export const emailPreferencesRouter = router({
  /**
   * Get current user's email preferences
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const preferences = await getOrCreateEmailPreferences(ctx.user!.id);
    return preferences;
  }),

  /**
   * Update email preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        newCallsNotification: z.boolean().optional(),
        deadlineReminderNotification: z.boolean().optional(),
        deadlineReminderDays: z.number().min(1).max(30).optional(),
        notificationFrequency: z
          .enum(["daily", "weekly", "never"])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updates: Record<string, any> = {};

      if (input.newCallsNotification !== undefined) {
        updates.newCallsNotification = input.newCallsNotification ? 1 : 0;
      }

      if (input.deadlineReminderNotification !== undefined) {
        updates.deadlineReminderNotification = input.deadlineReminderNotification
          ? 1
          : 0;
      }

      if (input.deadlineReminderDays !== undefined) {
        updates.deadlineReminderDays = input.deadlineReminderDays;
      }

      if (input.notificationFrequency !== undefined) {
        updates.notificationFrequency = input.notificationFrequency;
      }

      const success = await updateEmailPreferences(ctx.user!.id, updates);

      if (!success) {
        throw new Error("Failed to update email preferences");
      }

      const updated = await getOrCreateEmailPreferences(ctx.user!.id);
      return updated;
    }),

  /**
   * Send test email to verify configuration
   */
  sendTestEmail: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.user!.email) {
      throw new Error("User email not found");
    }

    const success = await sendTestEmail(ctx.user!.email);

    if (!success) {
      throw new Error("Failed to send test email. Check server logs.");
    }

    return {
      success: true,
      message: `Test email sent to ${ctx.user!.email}`,
    };
  }),
});
