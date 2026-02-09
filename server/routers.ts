import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { emailPreferencesRouter } from "./routers/email-preferences";
import { advancedSearchRouter } from "./routers/advanced-search";
import { statisticsRouter } from "./routers/statistics";
import { rssRouter } from "./routers/rss";
import {
  getAllActiveCalls,
  getCallsByLevel,
  getCallById,
  getUserSubscription,
  getUserSavedCalls,
  saveCallForUser,
  removeSavedCall,
  upsertSubscription,
  getUserNotifications,
  markNotificationAsRead,
  createNotification,
} from "./db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Calls for entries (bandi culturali)
   */
  calls: router({
    /**
     * Get all active calls
     */
    getAll: publicProcedure.query(async () => {
      return await getAllActiveCalls();
    }),

    /**
     * Get calls by geographic level (regional, national, european)
     */
    getByLevel: publicProcedure
      .input(z.enum(["regional", "national", "european"]))
      .query(async ({ input }) => {
        return await getCallsByLevel(input);
      }),

    /**
     * Get single call by ID
     */
    getById: publicProcedure
      .input(z.number())
      .query(async ({ input }) => {
        return await getCallById(input);
      }),

    /**
     * Search and filter calls
     */
    search: publicProcedure
      .input(
        z.object({
          query: z.string().optional(),
          callType: z.enum(["exhibition", "residency", "competition", "grant", "award", "fellowship", "curatorial_open_call"]).optional(),
          geographicLevel: z.enum(["regional", "national", "european"]).optional(),
          minDeadline: z.date().optional(),
          maxDeadline: z.date().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Get user's subscription level to determine access
        let userLevel: "base" | "premium" | "pro" = "base";
        if (ctx.user) {
          const subscription = await getUserSubscription(ctx.user.id);
          if (subscription) {
            userLevel = subscription.level;
          }
        }

        // Get all calls
        let calls = await getAllActiveCalls();

        // Filter by subscription level
        const levelMap: Record<string, string[]> = {
          base: ["regional"],
          premium: ["regional", "national"],
          pro: ["regional", "national", "european"],
        };

        calls = calls.filter(call =>
          levelMap[userLevel].includes(call.geographicLevel)
        );

        // Apply filters
        if (input.query) {
          const query = input.query.toLowerCase();
          calls = calls.filter(call =>
            call.title.toLowerCase().includes(query) ||
            call.entity.toLowerCase().includes(query)
          );
        }

        if (input.callType) {
          calls = calls.filter(call => call.callType === input.callType);
        }

        if (input.geographicLevel) {
          calls = calls.filter(call => call.geographicLevel === input.geographicLevel);
        }

        if (input.minDeadline) {
          calls = calls.filter(call => call.deadline >= input.minDeadline!);
        }

        if (input.maxDeadline) {
          calls = calls.filter(call => call.deadline <= input.maxDeadline!);
        }

        return calls;
      }),
  }),

  /**
   * Saved calls management
   */
  savedCalls: router({
    /**
     * Get user's saved calls
     */
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const saved = await getUserSavedCalls(ctx.user.id);
      return saved.map(item => item.calls_for_entries);
    }),

    /**
     * Save a call
     */
    save: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const success = await saveCallForUser(ctx.user.id, input);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to save call",
          });
        }
        return { success: true };
      }),

    /**
     * Remove saved call
     */
    remove: protectedProcedure
      .input(z.number())
      .mutation(async ({ input, ctx }) => {
        const success = await removeSavedCall(ctx.user.id, input);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to remove saved call",
          });
        }
        return { success: true };
      }),
  }),

  /**
   * Subscriptions management
   */
  subscriptions: router({
    /**
     * Get current user subscription
     */
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      return await getUserSubscription(ctx.user.id);
    }),

    /**
     * Upgrade/downgrade subscription
     */
    update: protectedProcedure
      .input(z.enum(["base", "premium", "pro"]))
      .mutation(async ({ input, ctx }) => {
        const success = await upsertSubscription(ctx.user.id, input);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update subscription",
          });
        }

        // Create notification
        await createNotification(
          ctx.user.id,
          "subscription_update",
          `Subscription updated to ${input}`,
          `Your subscription level has been updated to ${input}.`
        );

        return { success: true, level: input };
      }),
  }),

  /**
   * Notifications management
   */
  notifications: router({
    /**
     * Get user notifications
     */
    getAll: protectedProcedure
      .input(z.object({ limit: z.number().default(10) }).optional())
      .query(async ({ input, ctx }) => {
        return await getUserNotifications(ctx.user.id, input?.limit);
      }),

    /**
     * Mark notification as read
     */
    markAsRead: protectedProcedure
      .input(z.number())
      .mutation(async ({ input }) => {
        const success = await markNotificationAsRead(input);
        if (!success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to mark notification as read",
          });
        }
        return { success: true };
      }),
  }),

  /**
   * Email preferences management
   */
  emailPreferences: emailPreferencesRouter,

  /**
   * Advanced search and filtering
   */
  advancedSearch: advancedSearchRouter,

  /**
   * Statistics
   */
  statistics: statisticsRouter,

  /**
   * RSS Import
   */
  rss: rssRouter,
});

export type AppRouter = typeof appRouter;
