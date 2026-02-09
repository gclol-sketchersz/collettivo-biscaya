import { publicProcedure, router, adminProcedure } from "../_core/trpc";
import { runRssImportJob } from "../rss-service";
import { TRPCError } from "@trpc/server";

export const rssRouter = router({
  importFeeds: adminProcedure.mutation(async () => {
    try {
      const results = await runRssImportJob();
      return {
        success: true,
        results,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to import RSS feeds",
      });
    }
  }),

  getImportStatus: publicProcedure.query(async () => {
    return {
      lastImport: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "completed",
      callsImported: 0,
    };
  }),
});
