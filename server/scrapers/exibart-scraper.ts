/**
 * Exibart Scraper
 * Scrapes cultural calls from exibart.com
 * 
 * URL: https://www.exibart.com/bandi-e-concorsi/
 * Structure: Article list with pagination
 */

import { BaseScraper, ScrapedCall } from "./base-scraper";

export class ExibartScraper extends BaseScraper {
  constructor() {
    super({
      baseUrl: "https://www.exibart.com",
      timeout: 30000,
      retries: 3,
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      },
    });
  }

  /**
   * Scrape Exibart bandi page
   */
  async scrape(url: string = "/bandi-e-concorsi/"): Promise<ScrapedCall[]> {
    try {
      const html = await this.fetchHtml(url);
      const $ = this.loadHtml(html);

      const calls: ScrapedCall[] = [];

      // Select article containers
      // Exibart uses various selectors, try multiple
      const articles = $("article.td-module-container, article.post, div.td-module-container");

      articles.each((_, element) => {
        try {
          const $article = $(element);

          // Extract title
          const titleEl = $article.find("h3.entry-title a, h3 a, .entry-title");
          const title = this.normalizeText(titleEl.text());
          const articleUrl = titleEl.attr("href") || "";

          if (!title || !articleUrl) return; // Skip if no title or URL

          // Extract date
          const dateEl = $article.find("time, .td-post-date, .post-date");
          const dateStr = dateEl.attr("datetime") || dateEl.text();
          const publishedAt = this.parseDate(dateStr) || new Date();

          // Extract description
          const descEl = $article.find(".td-excerpt, .entry-summary, p");
          const description = this.normalizeText(descEl.text()).substring(0, 500);

          // Extract deadline from description or content
          let deadline = this.extractDeadlineFromText(description);
          if (!deadline) {
            // Try to find deadline in full article text
            const fullText = $article.text();
            deadline = this.extractDeadlineFromText(fullText);
          }
          if (!deadline) {
            // Default: 60 days from publication
            deadline = new Date(publishedAt);
            deadline.setDate(deadline.getDate() + 60);
          }

          // Extract call type from title or content
          const callType = this.extractCallType(title);

          // Extract budget if mentioned
          const budget = this.extractBudgetFromText(description);

          // Filter out expired calls (only if deadline is in the past)
          const now = new Date();
          if (deadline < now) {
            console.log(`[Exibart] Skipping expired call: ${title} (deadline: ${deadline})`);
            return;
          }

          const call: ScrapedCall = {
            title,
            description,
            source: "exibart",
            sourceUrl: articleUrl,
            publishedAt,
            deadline,
            callType: this.mapCallTypeToStandard(callType),
            budget: budget || undefined,
            entity: "Exibart",
            country: "IT",
            tags: ["arte", "cultura", "concorso"],
          };

          calls.push(call);
        } catch (error) {
          console.error("[ExibartScraper] Error parsing article:", error);
        }
      });

      console.log(`[ExibartScraper] Extracted ${calls.length} calls from ${url}`);
      return calls;
    } catch (error) {
      console.error("[ExibartScraper] Error scraping:", error);
      return [];
    }
  }

  /**
   * Extract deadline from text
   * Looks for patterns like "scadenza 30 giugno", "entro il 30 giugno", etc.
   */
  private extractDeadlineFromText(text: string): Date | null {
    if (!text) return null;

    // Pattern: "scadenza 30 giugno" or "entro il 30 giugno"
    const patterns = [
      /scadenza\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /entro\s+il?\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /deadline\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /fino\s+al?\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /candidature\s+entro\s+il?\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const [, day, month, year] = match;
        const date = this.parseDate(`${day} ${month} ${year}`);
        if (date) return date;
      }
    }

    return null;
  }

  /**
   * Map internal call type to standard call type
   */
  private mapCallTypeToStandard(internalType: string): string {
    const mappings: Record<string, string> = {
      residenza: "residency",
      premio: "award",
      concorso: "competition",
      mostra: "exhibition",
      biennale: "exhibition",
      fellowship: "fellowship",
      grant: "grant",
      contributo: "grant",
      borsa: "fellowship",
      open_call: "curatorial_open_call",
      "open call": "curatorial_open_call",
    };
    return mappings[internalType.toLowerCase()] || "exhibition";
  }

  /**
   * Extract call type from title
   */
  private extractCallType(title: string): string {
    const types = [
      { keyword: "residenza", type: "residenza" },
      { keyword: "premio", type: "premio" },
      { keyword: "concorso", type: "concorso" },
      { keyword: "mostra", type: "mostra" },
      { keyword: "biennale", type: "biennale" },
      { keyword: "fellowship", type: "fellowship" },
      { keyword: "grant", type: "grant" },
      { keyword: "award", type: "award" },
      { keyword: "call", type: "open call" },
      { keyword: "open call", type: "open call" },
    ];

    const lowerTitle = title.toLowerCase();
    for (const { keyword, type } of types) {
      if (lowerTitle.includes(keyword)) {
        return type;
      }
    }

    return "open call";
  }

  /**
   * Extract budget from text
   */
  private extractBudgetFromText(text: string): number | null {
    if (!text) return null;

    // Look for patterns like "€ 5.000", "5000 euro", etc.
    const patterns = [
      /€\s*([\d.,]+)/i,
      /([\d.,]+)\s*€/i,
      /([\d.,]+)\s*euro/i,
      /budget\s*[:=]\s*([\d.,]+)/i,
      /contributo\s*[:=]\s*([\d.,]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const budget = this.extractNumber(match[1]);
        if (budget && budget > 0) {
          return budget;
        }
      }
    }

    return null;
  }

  /**
   * Scrape all pages of Exibart bandi
   */
  async scrapeAllPages(maxPages: number = 5): Promise<ScrapedCall[]> {
    const allCalls: ScrapedCall[] = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        const url = `/bandi-e-concorsi/page/${page}/`;
        console.log(`[ExibartScraper] Scraping page ${page}...`);
        const calls = await this.scrape(url);
        allCalls.push(...calls);

        if (calls.length === 0) {
          console.log(`[ExibartScraper] No more calls found, stopping at page ${page}`);
          break;
        }

        // Rate limiting
        await this.delay(2000);
      } catch (error) {
        console.error(`[ExibartScraper] Error scraping page ${page}:`, error);
        break;
      }
    }

    return allCalls;
  }
}
