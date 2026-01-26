import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getCallsWithAdvancedFilters,
  getBudgetStatistics,
  getFilterOptions,
  countCallsWithFilters,
  type AdvancedFilterParams,
} from "../db-advanced-filters";

export const advancedSearchRouter = router({
  /**
   * Search calls with advanced filters
   */
  search: publicProcedure
    .input(
      z.object({
        budgetMin: z.number().optional(),
        budgetMax: z.number().optional(),
        geographicLevels: z.array(z.enum(["regional", "national", "european"])).optional(),
        callTypes: z.array(
          z.enum([
            "exhibition",
            "residency",
            "competition",
            "grant",
            "award",
            "fellowship",
            "curatorial_open_call",
          ])
        ).optional(),
        deadlineFrom: z.date().optional(),
        deadlineTo: z.date().optional(),
        searchQuery: z.string().optional(),
        sortBy: z
          .enum(["deadline-asc", "deadline-desc", "budget-asc", "budget-desc", "relevance"])
          .default("relevance"),
        page: z.number().default(1),
        pageSize: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.pageSize;

      const params: AdvancedFilterParams = {
        budgetMin: input.budgetMin,
        budgetMax: input.budgetMax,
        geographicLevels: input.geographicLevels,
        callTypes: input.callTypes,
        deadlineFrom: input.deadlineFrom,
        deadlineTo: input.deadlineTo,
        searchQuery: input.searchQuery,
        sortBy: input.sortBy,
        limit: input.pageSize,
        offset,
      };

      const [calls, total] = await Promise.all([
        getCallsWithAdvancedFilters(params),
        countCallsWithFilters(params),
      ]);

      return {
        calls,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          total,
          totalPages: Math.ceil(total / input.pageSize),
        },
      };
    }),

  /**
   * Get budget statistics for filter UI
   */
  getBudgetStats: publicProcedure.query(async () => {
    return await getBudgetStatistics();
  }),

  /**
   * Get available filter options
   */
  getFilterOptions: publicProcedure.query(async () => {
    return await getFilterOptions();
  }),
});
