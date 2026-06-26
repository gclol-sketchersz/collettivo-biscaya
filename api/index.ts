import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";
import { cleanupExpiredCallsHandler } from "../server/scheduled/cleanup-expired-calls";
import { webScrapingJobHandler } from "../server/scheduled/web-scraping-job";
import { rssImportJobHandler } from "../server/scheduled/rss-import-job";
import { publicAPIImportJobHandler } from "../server/scheduled/public-api-import-job";
import { handleMultiSourceImport } from "../server/scheduled/multi-source-import-job";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerOAuthRoutes(app);

app.post("/api/scheduled/cleanup-expired-calls", cleanupExpiredCallsHandler);
app.post("/api/scheduled/web-scraping", webScrapingJobHandler);
app.post("/api/scheduled/rss-import", rssImportJobHandler);
app.post("/api/scheduled/public-api-import", publicAPIImportJobHandler);
app.post("/api/scheduled/multi-source-import", handleMultiSourceImport);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
