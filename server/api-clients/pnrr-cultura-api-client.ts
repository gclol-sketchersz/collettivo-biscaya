/**
 * PNRR Cultura API Client
 * Fetches cultural calls from PNRR (Piano Nazionale di Ripresa e Resilienza)
 * 
 * API: https://pnrr.cultura.gov.it/
 */

import axios, { AxiosInstance } from "axios";

export interface PNRRCall {
  title: string;
  description: string;
  deadline?: Date;
  budget?: number;
  callType: string;
  entity: string;
  sourceUrl: string;
  publishedAt: Date;
}

export class PNRRCulturaAPIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "https://pnrr.cultura.gov.it",
      timeout: 30000,
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; CollettivoBiscaya/1.0)",
      },
    });
  }

  /**
   * Fetch bandi from PNRR API
   */
  async fetchBandi(): Promise<PNRRCall[]> {
    try {
      console.log("[PNRRCulturaAPIClient] Fetching bandi...");

      // PNRR provides HTML page with bandi list
      // We'll use web scraping to extract data
      const response = await this.client.get("/bandi-e-avvisi/");
      const html = response.data;

      const calls: PNRRCall[] = [];

      // Parse HTML to extract bandi
      // This is a simplified extraction - in production, use Cheerio
      const bandoRegex = /<h[2-3][^>]*>([^<]+)<\/h[2-3]>/g;
      let match;

      while ((match = bandoRegex.exec(html)) !== null) {
        const title = match[1].trim();
        if (title.length > 5) {
          const call: PNRRCall = {
            title,
            description: `PNRR Cultura - ${title}`,
            callType: this.detectCallType(title),
            entity: "Ministero della Cultura - PNRR",
            sourceUrl: "https://pnrr.cultura.gov.it/bandi-e-avvisi/",
            publishedAt: new Date(),
            deadline: this.getDefaultDeadline(),
          };
          calls.push(call);
        }
      }

      console.log(`[PNRRCulturaAPIClient] Found ${calls.length} bandi`);
      return calls;
    } catch (error) {
      console.error("[PNRRCulturaAPIClient] Error fetching bandi:", error);
      return [];
    }
  }

  /**
   * Search bandi by keyword
   */
  async searchBandi(keyword: string): Promise<PNRRCall[]> {
    try {
      console.log(`[PNRRCulturaAPIClient] Searching for: ${keyword}`);

      const response = await this.client.get("/bandi-e-avvisi/", {
        params: { search: keyword },
      });

      const html = response.data;
      const calls: PNRRCall[] = [];

      // Parse HTML to extract matching bandi
      const bandoRegex = new RegExp(`<h[2-3][^>]*>([^<]*${keyword}[^<]*)<\\/h[2-3]>`, "gi");
      let match;

      while ((match = bandoRegex.exec(html)) !== null) {
        const title = match[1].trim();
        if (title.length > 5) {
          const call: PNRRCall = {
            title,
            description: `PNRR Cultura - ${title}`,
            callType: this.detectCallType(title),
            entity: "Ministero della Cultura - PNRR",
            sourceUrl: "https://pnrr.cultura.gov.it/bandi-e-avvisi/",
            publishedAt: new Date(),
            deadline: this.getDefaultDeadline(),
          };
          calls.push(call);
        }
      }

      console.log(`[PNRRCulturaAPIClient] Found ${calls.length} matching bandi`);
      return calls;
    } catch (error) {
      console.error("[PNRRCulturaAPIClient] Error searching bandi:", error);
      return [];
    }
  }

  /**
   * Detect call type from title
   */
  private detectCallType(title: string): string {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("residenza") || lowerTitle.includes("residenze")) {
      return "residency";
    }
    if (lowerTitle.includes("premio") || lowerTitle.includes("award")) {
      return "award";
    }
    if (lowerTitle.includes("concorso") || lowerTitle.includes("competition")) {
      return "competition";
    }
    if (lowerTitle.includes("fellowship") || lowerTitle.includes("borsa")) {
      return "fellowship";
    }
    if (lowerTitle.includes("mostra") || lowerTitle.includes("exhibition")) {
      return "exhibition";
    }
    if (lowerTitle.includes("finanziamento") || lowerTitle.includes("contributo") || lowerTitle.includes("grant")) {
      return "grant";
    }

    return "grant"; // Default to grant for PNRR
  }

  /**
   * Get default deadline (90 days from now)
   */
  private getDefaultDeadline(): Date {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 90);
    return deadline;
  }
}
