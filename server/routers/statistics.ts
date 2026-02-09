import { publicProcedure, router } from "../_core/trpc";
import { getDashboardStatistics, getCallsStatisticsByType } from "../db";

export const statisticsRouter = router({
  getDashboardStats: publicProcedure.query(async () => {
    return await getDashboardStatistics();
  }),

  getCallsStats: publicProcedure.query(async () => {
    return await getCallsStatisticsByType();
  }),
});
