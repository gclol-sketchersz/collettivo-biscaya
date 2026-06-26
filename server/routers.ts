import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { emailPreferencesRouter } from "./routers/email-preferences";
import { advancedSearchRouter } from "./routers/advanced-search";
import { statisticsRouter } from "./routers/statistics";
import { rssRouter } from "./routers/rss";
import { getAirtableCalls, getAirtableCallById, isAirtableConfigured, type AirtableCall } from "./airtable";
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
  saveChatMessage,
  getChatHistory,
  clearChatHistory,
  getUserProfileForJuana,
  saveMessageRating,
  getChatHistoryForExport,
  getChatStatistics,
  getPersonalizedContextForJuana,
} from "./db";
import {
  getCallsWithMinimumCompensation,
  countCallsWithMinimumCompensation,
  removeExpiredCalls,
  getExpiredCalls,
  getCallsByVerifiedEntity,
} from "./db-automation";
import {
  getCallsFromVerifiedEntities,
  countCallsFromVerifiedEntities,
  getCallsWithMinCompensationFromVerifiedEntities,
  getCallEntityVerificationStatus,
} from "./db-automation-advanced";
import {
  validateEntityAuthority,
  getOrCreateVerifiedEntity,
  getVerifiedEntities,
} from "./db-entity-validation";
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
   * Uses Airtable when configured, falls back to database otherwise.
   */
  calls: router({
    /**
     * Get all active calls
     */
    getAll: publicProcedure.query(async () => {
      if (isAirtableConfigured()) {
        return await getAirtableCalls();
      }
      return await getAllActiveCalls();
    }),

    /**
     * Get calls by geographic level (regional, national, european)
     */
    getByLevel: publicProcedure
      .input(z.enum(["regional", "national", "european"]))
      .query(async ({ input }) => {
        if (isAirtableConfigured()) {
          const all = await getAirtableCalls();
          return all.filter((c) => c.geographicLevel === input);
        }
        return await getCallsByLevel(input);
      }),

    /**
     * Get single call by ID
     * Accepts both numeric (DB) and string (Airtable) IDs.
     */
    getById: publicProcedure
      .input(z.union([z.number(), z.string()]))
      .query(async ({ input }) => {
        if (isAirtableConfigured()) {
          return await getAirtableCallById(String(input));
        }
        return await getCallById(typeof input === "number" ? input : parseInt(input) || 0);
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
          minDeadline: z.string().optional(),
          maxDeadline: z.string().optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (isAirtableConfigured()) {
          let calls: AirtableCall[] = await getAirtableCalls();

          if (input.query) {
            const q = input.query.toLowerCase();
            calls = calls.filter(c =>
              c.title.toLowerCase().includes(q) ||
              c.entity.toLowerCase().includes(q)
            );
          }

          if (input.callType) {
            calls = calls.filter(c => c.callType === input.callType);
          }

          if (input.geographicLevel) {
            calls = calls.filter(c => c.geographicLevel === input.geographicLevel);
          }

          if (input.minDeadline) {
            const min = new Date(input.minDeadline);
            calls = calls.filter(c => new Date(c.deadline) >= min);
          }

          if (input.maxDeadline) {
            const max = new Date(input.maxDeadline);
            calls = calls.filter(c => new Date(c.deadline) <= max);
          }

          return calls;
        }

        // Database fallback
        let userLevel: "base" | "premium" | "pro" = "base";
        if (ctx.user) {
          const subscription = await getUserSubscription(ctx.user.id);
          if (subscription) {
            userLevel = subscription.level;
          }
        }

        let calls = await getAllActiveCalls();

        const levelMap: Record<string, string[]> = {
          base: ["regional"],
          premium: ["regional", "national"],
          pro: ["regional", "national", "european"],
        };

        calls = calls.filter(call =>
          levelMap[userLevel].includes(call.geographicLevel)
        );

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
          calls = calls.filter(call => call.deadline >= new Date(input.minDeadline!));
        }

        if (input.maxDeadline) {
          calls = calls.filter(call => call.deadline <= new Date(input.maxDeadline!));
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

  /**
   * Juana AI Chat Assistant
   */
  juana: router({
    /**
     * Send message to Juana and get response
     */
    sendMessage: publicProcedure
      .input(z.object({
        message: z.string().min(1, "Message cannot be empty"),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Save user message
          await saveChatMessage(ctx.user?.id, 'user', input.message);

          // Get recent chat history for context
          const recentHistory = await getChatHistory(ctx.user?.id, 10);
          const allCalls = await getAllActiveCalls();
          
          // Get personalized context for the user
          const personalizedContext = ctx.user?.id ? await getPersonalizedContextForJuana(ctx.user.id) : null;

          // Build system prompt with context about available calls
          const callsContext = allCalls
            .slice(0, 5)
            .map(call => `- ${call.title} (${call.callType}, deadline: ${call.deadline.toLocaleDateString()})`)
            .join('\n');
          
          // Build personalized context section
          let personalizedSection = '';
          if (personalizedContext) {
            personalizedSection = `

User Profile:
- Name: ${personalizedContext.userName}
- Subscription Level: ${personalizedContext.subscriptionLevel}
- Saved Calls: ${personalizedContext.savedCallsCount}`;
            
            if (personalizedContext.savedCalls.length > 0) {
              personalizedSection += `
- Recently Saved Calls: ${personalizedContext.savedCalls.map((c: any) => c.title).join(', ')}`;
            }
          }

          const systemPrompt = `You are Juana, a helpful AI assistant for Collettivo Biscaya, a platform for discovering and applying to cultural calls for entries (bandi culturali) in Italy and Europe.

Your role is to:
1. Help users find relevant cultural calls based on their interests and qualifications
2. Provide advice on application strategies and candidature tips
3. Answer questions about the platform and how to use it
4. Suggest calls that match user profiles
5. Provide information about different call types (exhibitions, residencies, competitions, grants, awards, fellowships)

Current available calls on the platform:
${callsContext}${personalizedSection}

Be friendly, encouraging, and professional. Personalize your responses based on the user's subscription level and saved calls.

Use Italian when the user writes in Italian, and English when they write in English.`;

          // Build conversation history for LLM
          const messages: any[] = [
            { role: 'system', content: systemPrompt },
          ];

          // Add recent chat history
          recentHistory.reverse().forEach(msg => {
            messages.push({
              role: msg.role,
              content: msg.content,
            });
          });

          // Add current message
          messages.push({
            role: 'user',
            content: input.message,
          });

          // Call LLM
          const { invokeLLM } = await import('./_core/llm');
          const response = await invokeLLM({
            messages: messages.slice(-10), // Keep last 10 messages for context
          });

          const messageContent = response.choices[0]?.message?.content;
          const assistantMessage = typeof messageContent === 'string' 
            ? messageContent 
            : Array.isArray(messageContent) 
              ? messageContent.map(m => 'text' in m ? m.text : '').join(' ')
              : 'Sorry, I could not generate a response.';

          // Save assistant response
          await saveChatMessage(ctx.user?.id, 'assistant', assistantMessage);

          return {
            success: true,
            message: assistantMessage,
          };
        } catch (error) {
          console.error('Error in Juana chat:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to process your message. Please try again.',
          });
        }
      }),

    /**
     * Get user profile for personalization
     */
    getUserProfile: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.id) return null;
        return await getUserProfileForJuana(ctx.user.id);
      }),

    /**
     * Get personalized context for LLM (includes saved calls, preferences, etc.)
     */
    getPersonalizedContext: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.id) return null;
        return await getPersonalizedContextForJuana(ctx.user.id);
      }),

    /**
     * Get chat history
     */
    getHistory: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.id) return [];
        const history = await getChatHistory(ctx.user.id, 50);
        return history.reverse(); // Return in chronological order
      }),

    /**
     * Save message feedback (like/dislike)
     */
    saveFeedback: protectedProcedure
      .input(z.object({
        messageId: z.string(),
        feedback: z.enum(['like', 'dislike']),
      }))
      .mutation(async ({ input, ctx }) => {
        // Feedback is tracked client-side for now
        // In a real app, you could save this to the database
        return { success: true };
      }),

    /**
     * Save message rating (1-5 stars) and feedback
     */
    saveRating: protectedProcedure
      .input(z.object({
        messageId: z.number(),
        rating: z.number().min(1).max(5),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to save ratings',
          });
        }
        const success = await saveMessageRating(input.messageId, input.rating, input.feedback);
        return { success };
      }),

    /**
     * Get chat history for export
     */
    getHistoryForExport: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.id) return [];
        return await getChatHistoryForExport(ctx.user.id);
      }),

    /**
     * Get chat statistics
     */
    getStatistics: protectedProcedure
      .query(async ({ ctx }) => {
        if (!ctx.user?.id) return null;
        return await getChatStatistics(ctx.user.id);
      }),

    /**
     * Clear chat history
     */
    clearHistory: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (!ctx.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to clear chat history',
          });
        }
        const success = await clearChatHistory(ctx.user.id);
        return { success };
      }),
  }),

  /**
   * Call Automation
   */
  automation: router({
    /**
     * Get calls with minimum compensation (EUR 500)
     */
    getCallsWithMinCompensation: publicProcedure
      .input(z.object({
        minCompensation: z.number().default(500),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ input }) => {
        const params = input || {};
        return await getCallsWithMinimumCompensation(
          (params as any).minCompensation || 500,
          (params as any).limit || 50,
          (params as any).offset || 0
        );
      }),

    /**
     * Count calls with minimum compensation
     */
    countCallsWithMinCompensation: publicProcedure
      .input(z.object({
        minCompensation: z.number().default(500),
      }).optional())
      .query(async ({ input }) => {
        const minCompensation = (input as any)?.minCompensation || 500;
        return await countCallsWithMinimumCompensation(minCompensation);
      }),

    /**
     * Remove expired calls (admin only)
     */
    removeExpiredCalls: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can remove expired calls',
          });
        }

        const removedCount = await removeExpiredCalls();
        return { success: true, removedCount };
      }),

    /**
     * Get expired calls (admin only)
     */
    getExpiredCalls: protectedProcedure
      .input(z.object({
        limit: z.number().default(50),
      }).optional())
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only admins can view expired calls',
          });
        }

        const limit = input?.limit || 50;
        return await getExpiredCalls(limit);
      }),

    /**
     * Get calls by verified entity
     */
    getCallsByEntity: publicProcedure
      .input(z.object({
        entityId: z.string(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return await getCallsByVerifiedEntity(
          input.entityId,
          input.limit,
          input.offset
        );
      }),

    /**
     * Get calls only from verified entities with authority score
     */
    getCallsFromVerifiedEntities: publicProcedure
      .input(z.object({
        minAuthorityScore: z.number().default(50),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }).optional())
      .query(async ({ input }) => {
        const params = input || {};
        return await getCallsFromVerifiedEntities(
          (params as any).minAuthorityScore || 50,
          (params as any).limit || 50,
          (params as any).offset || 0
        );
      }),

    /**
     * Validate entity authority
     */
    validateEntityAuthority: publicProcedure
      .input(z.object({
        entityName: z.string().min(1),
      }))
      .query(async ({ input }) => {
        const isValid = await validateEntityAuthority(input.entityName);
        return { entityName: input.entityName, isValid, authorityLevel: isValid ? 'verified' : 'unverified' };
      }),

    /**
     * Get entity verification status for a call
     */
    getCallEntityVerificationStatus: publicProcedure
      .input(z.object({
        callId: z.number(),
      }))
      .query(async ({ input }) => {
        return await getCallEntityVerificationStatus(input.callId);
      }),

    /**
     * Get all verified entities
     */
    getVerifiedEntities: publicProcedure
      .input(z.object({
        minScore: z.number().default(50),
        limit: z.number().default(100),
      }).optional())
      .query(async ({ input }) => {
        const params = input || {};
        return await getVerifiedEntities(
          (params as any).minScore || 50,
          (params as any).limit || 100
        );
      }),
  }),
});

export type AppRouter = typeof appRouter;
