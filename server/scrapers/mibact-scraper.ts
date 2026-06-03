/**
 * MiBACT (Ministero della Cultura) Scraper
 * Scrapes cultural calls from cultura.gov.it
 * 
 * URL: https://cultura.gov.it/comunicati/bandi-e-concorsi
 * Structure: Card-based list with pagination
 */

import { BaseScraper, ScrapedCall } from "./base-scraper";

export class MiBACTScraper extends BaseScraper {
  constructor() {
    super({
      baseUrl: "https://cultura.gov.it",
      timeout: 30000,
      retries: 3,
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      },
    });
  }

  /**
   * Scrape MiBACT bandi page
   */
  async scrape(url: string = "/comunicati/bandi-e-concorsi"): Promise<ScrapedCall[]> {
    try {
      const html = await this.fetchHtml(url);
      const $ = this.loadHtml(html);

      const calls: ScrapedCall[] = [];

      // Select card containers
      const cards = $("article, .card-item, .bando-item, div[class*='card']");

      cards.each((_, element) => {
        try {
          const $card = $(element);

          // Extract title
          const titleEl = $card.find("h3, .card-title, [class*='title']");
          const title = this.normalizeText(titleEl.text());

          // Extract link
          const linkEl = $card.find("a");
          const articleUrl = linkEl.attr("href") || "";

          if (!title || !articleUrl) return;

          // Extract date
          const dateEl = $card.find("time, .card-date, [class*='date']");
          const dateStr = dateEl.attr("datetime") || dateEl.text();
          const publishedAt = this.parseDate(dateStr) || new Date();

          // Extract description
          const descEl = $card.find(".card-description, p, [class*='summary']");
          const description = this.normalizeText(descEl.text()).substring(0, 500);

          // Extract bando type (Bando, Avviso, Procedura, etc.)
          const typeEl = $card.find(".badge, [class*='type'], [class*='label']");
          const typeText = typeEl.text().trim();
          const callType = this.extractCallType(typeText || title);

          // Extract deadline
          let deadline = this.extractDeadlineFromText(description);
          if (!deadline) {
            deadline = this.extractDeadlineFromText($card.text());
          }
          if (!deadline) {
            // Default: 90 days for government calls
            deadline = new Date(publishedAt);
            deadline.setDate(deadline.getDate() + 90);
          }

          // Extract budget if mentioned
          const budget = this.extractBudgetFromText(description);

          // Filter out expired calls (only if deadline is in the past)
          const now = new Date();
          if (deadline < now) {
            console.log(`[MiBACT] Skipping expired call: ${title} (deadline: ${deadline})`);
            return;
          }

          const call: ScrapedCall = {
            title,
            description,
            source: "mibact",
            sourceUrl: this.normalizeUrl(articleUrl),
            publishedAt,
            deadline,
            callType: this.mapCallTypeToStandard(callType),
            budget: budget || undefined,
            entity: "Ministero della Cultura",
            country: "IT",
            tags: ["bando", "ministero", "cultura"],
          };

          calls.push(call);
        } catch (error) {
          console.error("[MiBACTScraper] Error parsing card:", error);
        }
      });

      console.log(`[MiBACTScraper] Extracted ${calls.length} calls from ${url}`);
      return calls;
    } catch (error) {
      console.error("[MiBACTScraper] Error scraping:", error);
      return [];
    }
  }

  /**
   * Extract deadline from text
   */
  private extractDeadlineFromText(text: string): Date | null {
    if (!text) return null;

    // Pattern: "scadenza 30 giugno" or "entro il 30 giugno"
    const patterns = [
      /scadenza\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /entro\s+il?\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /deadline\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /fino\s+al?\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /presentazione\s+entro\s+il?\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
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
      bando: "exhibition",
      avviso: "grant",
      procedura: "competition",
      gara: "competition",
      concorso: "competition",
      capitale: "grant",
      contributo: "grant",
      finanziamento: "grant",
    };
    return mappings[internalType.toLowerCase()] || "exhibition";
  }

  /**
   * Extract call type from text
   */
  private extractCallType(text: string): string {
    const types = [
      { keyword: "bando", type: "bando" },
      { keyword: "avviso", type: "avviso" },
      { keyword: "procedura", type: "procedura" },
      { keyword: "gara", type: "gara" },
      { keyword: "concorso", type: "concorso" },
      { keyword: "capitale", type: "capitale" },
      { keyword: "contributo", type: "contributo" },
      { keyword: "finanziamento", type: "finanziamento" },
    ];

    const lowerText = text.toLowerCase();
    for (const { keyword, type } of types) {
      if (lowerText.includes(keyword)) {
        return type;
      }
    }

    return "bando";
  }

  /**
   * Extract budget from text
   */
  private extractBudgetFromText(text: string): number | null {
    if (!text) return null;

    const patterns = [
      /€\s*([\d.,]+)/i,
      /([\d.,]+)\s*€/i,
      /([\d.,]+)\s*euro/i,
      /budget\s*[:=]\s*([\d.,]+)/i,
      /contributo\s*[:=]\s*([\d.,]+)/i,
      /finanziamento\s*[:=]\s*([\d.,]+)/i,
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
   * Normalize URL to absolute
   */
  private normalizeUrl(url: string): string {
    if (url.startsWith("http")) {
      return url;
    }
    if (url.startsWith("/")) {
      return `https://cultura.gov.it${url}`;
    }
    return `https://cultura.gov.it/${url}`;
  }

  /**
   * Scrape all pages of MiBACT bandi
   */
  async scrapeAllPages(maxPages: number = 5): Promise<ScrapedCall[]> {
    const allCalls: ScrapedCall[] = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        const url = page === 1 ? "/comunicati/bandi-e-concorsi" : `/comunicati/bandi-e-concorsi?page=${page}`;
        console.log(`[MiBACTScraper] Scraping page ${page}...`);
        const calls = await this.scrape(url);
        allCalls.push(...calls);

        if (calls.length === 0) {
          console.log(`[MiBACTScraper] No more calls found, stopping at page ${page}`);
          break;
        }

        // Rate limiting
        await this.delay(2000);
      } catch (error) {
        console.error(`[MiBACTScraper] Error scraping page ${page}:`, error);
        break;
      }
    }

    return allCalls;
  }
}
