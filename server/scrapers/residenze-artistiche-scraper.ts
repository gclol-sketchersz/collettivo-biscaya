/**
 * Residenze Artistiche Scraper
 * Scrapes residency calls from residenzeartistiche.it
 * 
 * URL: https://www.residenzeartistiche.it/bandi/
 * Structure: Dynamic list with filters
 */

import { BaseScraper, ScrapedCall } from "./base-scraper";

export class ResidenzeArtisticheScraper extends BaseScraper {
  private normalizeUrl(url: string): string {
    if (url.startsWith("http")) return url;
    return this.config.baseUrl + url;
  }
  constructor() {
    super({
      baseUrl: "https://www.residenzeartistiche.it",
      timeout: 30000,
      retries: 3,
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
      },
    });
  }

  /**
   * Scrape residenze artistiche bandi page
   */
  async scrape(url: string = "/bandi/"): Promise<ScrapedCall[]> {
    try {
      const html = await this.fetchHtml(url);
      const $ = this.loadHtml(html);

      const calls: ScrapedCall[] = [];

      // Select bando containers (h3 headings with links)
      const bandos = $("h3 a");

      bandos.each((_, element) => {
        try {
          const $bando = $(element);

          // Extract title
          const title = this.normalizeText($bando.text());
          const bandoUrl = $bando.attr("href") || "";

          if (!title || !bandoUrl) return; // Skip if no title or URL

          // Extract description from following paragraph
          const descEl = $bando.closest("h3").next("p");
          const description = this.normalizeText(descEl.text()).substring(0, 500);

          // Extract deadline from description
          let deadline = this.extractDeadlineFromText(description);
          if (!deadline) {
            deadline = this.extractDeadlineFromText(title);
          }
          if (!deadline) {
            // Default: 90 days from now
            deadline = new Date();
            deadline.setDate(deadline.getDate() + 90);
          }

          // Filter out expired calls
          const now = new Date();
          if (deadline < now) {
            console.log(`[ResidenzeArtistiche] Skipping expired call: ${title} (deadline: ${deadline})`);
            return;
          }

          // Extract call type (residency is the main type here)
          const callType = this.extractCallType(title + " " + description);

          // Extract budget if mentioned
          const budget = this.extractBudgetFromText(description);

          // Extract region from title or description
          const region = this.extractRegion(title + " " + description);

          const call: ScrapedCall = {
            title,
            description,
            source: "residenze-artistiche",
            sourceUrl: bandoUrl.startsWith("http") ? bandoUrl : this.config.baseUrl + bandoUrl,
            publishedAt: new Date(),
            deadline,
            callType: this.mapCallTypeToStandard(callType),
            budget: budget || undefined,
            entity: "Residenze Artistiche",
            country: "IT",
            tags: ["residenza", "artista", "residenza-artistica", region || "nazionale"],
          };

          calls.push(call);
        } catch (error) {
          console.error("[ResidenzeArtisticheScraper] Error parsing bando:", error);
        }
      });

      console.log(`[ResidenzeArtisticheScraper] Extracted ${calls.length} calls from ${url}`);
      return calls;
    } catch (error) {
      console.error("[ResidenzeArtisticheScraper] Error scraping:", error);
      return [];
    }
  }

  /**
   * Map internal call type to standard call type
   */
  private mapCallTypeToStandard(internalType: string): string {
    const mappings: Record<string, string> = {
      residenza: "residency",
      residenze: "residency",
      residency: "residency",
      artistiche: "residency",
      artista: "residency",
      artist: "residency",
      fellowship: "fellowship",
      borsa: "fellowship",
      premio: "award",
      award: "award",
      concorso: "competition",
      competition: "competition",
      mostra: "exhibition",
      exhibition: "exhibition",
      grant: "grant",
      finanziamento: "grant",
    };
    return mappings[internalType.toLowerCase()] || "residency";
  }

  /**
   * Extract call type from text
   */
  private extractCallType(text: string): string {
    const types = [
      { keyword: "residenza", type: "residenza" },
      { keyword: "residenze", type: "residenza" },
      { keyword: "artistiche", type: "residenza" },
      { keyword: "artista", type: "residenza" },
      { keyword: "fellowship", type: "fellowship" },
      { keyword: "borsa", type: "fellowship" },
      { keyword: "premio", type: "premio" },
      { keyword: "concorso", type: "concorso" },
      { keyword: "mostra", type: "mostra" },
      { keyword: "grant", type: "grant" },
    ];

    const lowerText = text.toLowerCase();
    for (const { keyword, type } of types) {
      if (lowerText.includes(keyword)) {
        return type;
      }
    }

    return "residenza";
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
      /candidature\s+entro\s+il?\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /apertura\s+bando\s*:\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i,
      /chiusura\s+bando\s*:\s*(\d{1,2})\s+(\w+)\s+(\d{4})/i,
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
   * Extract region from text
   */
  private extractRegion(text: string): string | null {
    const regions = [
      "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
      "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
      "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
      "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto",
      "Matera", "Umbria", "Etna", "Sicilia", "Toscana", "Lombardia",
      "Marchigiana", "Marche", "Bresciano", "Brescia", "Perugia", "Ravenna",
      "Livorno", "Torino", "Rimini", "Sansepolcro", "Bassano", "Vicenza", "Rovigo"
    ];

    const lowerText = text.toLowerCase();
    for (const region of regions) {
      if (lowerText.includes(region.toLowerCase())) {
        return region;
      }
    }

    return null;
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
        const numberStr = match[1].replace(/\./g, "").replace(/,/g, ".");
        const number = parseFloat(numberStr);
        if (!isNaN(number) && number > 0) {
          return number;
        }
      }
    }

    return null;
  }
}
