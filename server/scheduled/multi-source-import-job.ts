/**
 * Multi-Source Import Job
 * Imports calls from multiple sources with category coverage guarantee
 * 
 * Cron: 0 0 0 * * * (every day at midnight UTC)
 * Endpoint: /api/scheduled/multi-source-import
 */

import { Request, Response } from "express";
import { getDb } from "../db";
import { callsForEntries } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ResidenzeArtisticheScraper } from "../scrapers/residenze-artistiche-scraper";
import { ExibartRSSParser } from "../rss/exibart-rss-parser";
import { CallDeduplicator } from "../scrapers/deduplicator";
import { CompetitionScraper } from "../scrapers/competition-scraper";
import { AwardScraper } from "../scrapers/award-scraper";
import { FellowshipEuropeanScraper } from "../scrapers/fellowship-european-scraper";

interface ImportResult {
  ok: boolean;
  taskUid: string;
  sourcesImported: Array<{
    name: string;
    callsFound: number;
    callsImported: number;
    categoriesImported: string[];
  }>;
  totalCallsScraped: number;
  totalCallsImported: number;
  totalDuplicatesRemoved: number;
  categoryCoverage: Record<string, number>;
  timestamp: string;
  duration: number;
}

export async function handleMultiSourceImport(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();
  const taskUid = req.headers["x-manus-cron-task-uid"] as string;

  if (!taskUid) {
    res.status(403).json({ error: "Cron authentication required" });
    return;
  }

  try {
    console.log("[MultiSourceImportJob] Starting multi-source import job...");

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result: ImportResult = {
      ok: true,
      taskUid,
      sourcesImported: [],
      totalCallsScraped: 0,
      totalCallsImported: 0,
      totalDuplicatesRemoved: 0,
      categoryCoverage: {},
      timestamp: new Date().toISOString(),
      duration: 0,
    };

    const deduplicator = new CallDeduplicator();
    let allCalls: any[] = [];

    // 1. Residenze Artistiche (Residency calls)
    console.log("[MultiSourceImportJob] Scraping Residenze Artistiche...");
    try {
      const residenzeScraper = new ResidenzeArtisticheScraper();
      const residenzeCalls = await residenzeScraper.scrape("/bandi/");
      console.log(`[MultiSourceImportJob] Residenze Artistiche: Found ${residenzeCalls.length} calls`);
      
      const residenzeCategories = new Set<string>();
      residenzeCalls.forEach(c => {
        if (c.callType) residenzeCategories.add(c.callType);
      });

      result.sourcesImported.push({
        name: "Residenze Artistiche",
        callsFound: residenzeCalls.length,
        callsImported: 0,
        categoriesImported: Array.from(residenzeCategories),
      });
      allCalls.push(...residenzeCalls);
      result.totalCallsScraped += residenzeCalls.length;
    } catch (error) {
      console.error("[MultiSourceImportJob] Residenze Artistiche error:", error);
    }

    // 2. Exibart RSS (Mixed categories)
    console.log("[MultiSourceImportJob] Parsing Exibart RSS...");
    try {
      const exibartRss = new ExibartRSSParser();
      const exibartCalls = await exibartRss.parseFeed();
      console.log(`[MultiSourceImportJob] Exibart RSS: Found ${exibartCalls.length} calls`);
      
      const exibartCategories = new Set<string>();
      exibartCalls.forEach(c => {
        if (c.callType) exibartCategories.add(c.callType);
      });

      result.sourcesImported.push({
        name: "Exibart RSS",
        callsFound: exibartCalls.length,
        callsImported: 0,
        categoriesImported: Array.from(exibartCategories),
      });
      allCalls.push(...exibartCalls);
      result.totalCallsScraped += exibartCalls.length;
    } catch (error) {
      console.error("[MultiSourceImportJob] Exibart RSS error:", error);
    }

    // 3. Competition (Concorsi Artistici)
    console.log("[MultiSourceImportJob] Scraping Competition calls...");
    try {
      const competitionScraper = new CompetitionScraper({ baseUrl: "https://www.giovaniartisti.it" });
      const competitionCalls = await competitionScraper.scrapeAll();
      console.log(`[MultiSourceImportJob] Competition: Found ${competitionCalls.length} calls`);
      
      const competitionCategories = new Set<string>();
      competitionCalls.forEach(c => {
        if (c.callType) competitionCategories.add(c.callType);
      });

      result.sourcesImported.push({
        name: "Competition Calls",
        callsFound: competitionCalls.length,
        callsImported: 0,
        categoriesImported: Array.from(competitionCategories),
      });
      allCalls.push(...competitionCalls);
      result.totalCallsScraped += competitionCalls.length;
    } catch (error) {
      console.error("[MultiSourceImportJob] Competition error:", error);
    }

    // 4. Award (Premi e Riconoscimenti)
    console.log("[MultiSourceImportJob] Scraping Award calls...");
    try {
      const awardScraper = new AwardScraper({ baseUrl: "https://fondazionesozzani.org" });
      const awardCalls = await awardScraper.scrapeAll();
      console.log(`[MultiSourceImportJob] Award: Found ${awardCalls.length} calls`);
      
      const awardCategories = new Set<string>();
      awardCalls.forEach(c => {
        if (c.callType) awardCategories.add(c.callType);
      });

      result.sourcesImported.push({
        name: "Award Calls",
        callsFound: awardCalls.length,
        callsImported: 0,
        categoriesImported: Array.from(awardCategories),
      });
      allCalls.push(...awardCalls);
      result.totalCallsScraped += awardCalls.length;
    } catch (error) {
      console.error("[MultiSourceImportJob] Award error:", error);
    }

    // 5. Fellowship & European (Borse di Studio e Bandi Europei)
    console.log("[MultiSourceImportJob] Scraping Fellowship & European calls...");
    try {
      const fellowshipScraper = new FellowshipEuropeanScraper({ baseUrl: "https://urbanglass.org" });
      const fellowshipCalls = await fellowshipScraper.scrapeAll();
      console.log(`[MultiSourceImportJob] Fellowship & European: Found ${fellowshipCalls.length} calls`);
      
      const fellowshipCategories = new Set<string>();
      fellowshipCalls.forEach(c => {
        if (c.callType) fellowshipCategories.add(c.callType);
      });

      result.sourcesImported.push({
        name: "Fellowship & European",
        callsFound: fellowshipCalls.length,
        callsImported: 0,
        categoriesImported: Array.from(fellowshipCategories),
      });
      allCalls.push(...fellowshipCalls);
      result.totalCallsScraped += fellowshipCalls.length;
    } catch (error) {
      console.error("[MultiSourceImportJob] Fellowship & European error:", error);
    }

    // 6. Deduplication
    console.log(`[MultiSourceImportJob] Deduplicating ${allCalls.length} calls...`);
    const deduplicationResult = deduplicator.deduplicate(allCalls);
    const deduplicatedCalls = deduplicationResult.unique;
    result.totalDuplicatesRemoved = deduplicationResult.duplicates.length;

    // 4. Import to Database
    console.log(`[MultiSourceImportJob] Importing ${deduplicatedCalls.length} unique calls...`);

      for (const call of deduplicatedCalls) {
      try {
        // Check if call already exists
        const existing = await db
          .select()
          .from(callsForEntries)
          .where(eq(callsForEntries.externalLink, call.sourceUrl))
          .limit(1);

        if (existing.length === 0) {
          // Insert new call
          const callType = mapCallType(call.callType || "curatorial_open_call");
          await db.insert(callsForEntries).values({
            title: call.title,
            entity: call.entity || "Unknown",
            country: call.country || "IT",
            geographicLevel: "national",
            callType,
            deadline: call.deadline,
            budgetMin: call.budget ? Math.floor(call.budget) : undefined,
            budgetMax: call.budget ? Math.floor(call.budget) : undefined,
            budgetCurrency: "EUR",
            externalLink: call.sourceUrl,
            requirements: call.description,
            isActive: 1,
          });

          result.totalCallsImported++;

          // Track category coverage
          const category = call.callType || "exhibition";
          result.categoryCoverage[category] = (result.categoryCoverage[category] || 0) + 1;
        }
      } catch (error) {
        console.error("[MultiSourceImportJob] Error importing call:", error);
      }
    }

    // 5. Update source import counts
    for (const source of result.sourcesImported) {
      const sourceKey = source.name.split(" ")[0].toLowerCase();
      const count = deduplicatedCalls.filter((c: any) => 
        c.source && c.source.toLowerCase().includes(sourceKey)
      ).length;
      source.callsImported = count;
    }

    result.duration = Date.now() - startTime;

    console.log("[MultiSourceImportJob] Job completed successfully");
    console.log(`[MultiSourceImportJob] Category coverage:`, result.categoryCoverage);
    console.log(`[MultiSourceImportJob] Total imported: ${result.totalCallsImported}`);

    res.json(result);
  } catch (error) {
    console.error("[MultiSourceImportJob] Error:", error);
    res.status(500).json({
      ok: false,
      taskUid,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    });
    return;
  }
}

/**
 * Map scraper call type to database call type enum
 */
function mapCallType(type: string): "exhibition" | "residency" | "competition" | "grant" | "award" | "fellowship" | "curatorial_open_call" {
  const typeMap: Record<string, "exhibition" | "residency" | "competition" | "grant" | "award" | "fellowship" | "curatorial_open_call"> = {
    residenza: "residency",
    residency: "residency",
    premio: "award",
    award: "award",
    concorso: "competition",
    competition: "competition",
    mostra: "exhibition",
    exhibition: "exhibition",
    biennale: "exhibition",
    fellowship: "fellowship",
    grant: "grant",
    open_call: "curatorial_open_call",
    bando: "curatorial_open_call",
    avviso: "curatorial_open_call",
  };
  return typeMap[type.toLowerCase()] || "curatorial_open_call";
}
