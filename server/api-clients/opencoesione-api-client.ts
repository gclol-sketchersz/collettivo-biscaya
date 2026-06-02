/**
 * OpenCoesione API Client
 * Integrates with OpenCoesione (Politiche di Coesione) for funding opportunities
 * Source: https://opencoesione.gov.it/
 */

import axios, { AxiosInstance } from "axios";

export interface OpenCoesioneCall {
  title: string;
  description: string;
  entity: string;
  callType: string;
  deadline?: Date;
  budget?: number;
  country: string;
  geographicLevel: string;
  sourceUrl: string;
  source: string;
  publishedAt: Date;
  guid?: string;
  programmingPeriod?: string;
  fundingSource?: string;
}

export interface OpenCoesioneConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class OpenCoesioneAPIClient {
  private client: AxiosInstance;
  private config: Required<OpenCoesioneConfig>;

  constructor(config: OpenCoesioneConfig = {}) {
    this.config = {
      baseUrl: "https://opencoesione.gov.it/api/",
      timeout: 30000,
      retries: 3,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
  }

  /**
   * Fetch funding opportunities from OpenCoesione
   */
  async fetchOpportunities(limit: number = 100, offset: number = 0): Promise<OpenCoesioneCall[]> {
    try {
      const response = await this.client.get("/opportunita/", {
        params: {
          limit,
          offset,
          format: "json",
        },
      });

      const calls: OpenCoesioneCall[] = [];

      if (response.data && Array.isArray(response.data.results)) {
        for (const item of response.data.results) {
          const call = this.parseOpportunity(item);
          if (call) {
            calls.push(call);
          }
        }
      }

      return calls;
    } catch (error) {
      console.error("[OpenCoesioneAPIClient] Error fetching opportunities:", error);
      return [];
    }
  }

  /**
   * Parse OpenCoesione opportunity to standard format
   */
  private parseOpportunity(item: any): OpenCoesioneCall | null {
    try {
      const title = this.getText(item.titolo || item.title);
      const sourceUrl = this.getText(item.url || item.link);

      if (!title || !sourceUrl) {
        return null;
      }

      const description = this.getText(item.descrizione || item.description || "");
      const entity = this.getText(item.amministrazione || item.entity || "OpenCoesione");

      // Parse deadline
      const deadlineStr = this.getText(item.data_scadenza || item.deadline);
      const deadline = deadlineStr ? this.parseDate(deadlineStr) : undefined;

      // Parse budget
      const budget = this.extractNumber(item.importo_totale || item.budget || "");

      // Detect call type
      const callType = this.detectCallType(title + " " + description);

      // Get geographic level
      const geographicLevel = this.getGeographicLevel(item);

      // Get programming period (2021-2027 or 2014-2020)
      const programmingPeriod = this.getText(item.ciclo_programmazione || "2021-2027");

      // Get funding source
      const fundingSource = this.getText(item.fonte_finanziaria || "EU Coesione");

      return {
        title,
        description,
        entity,
        callType,
        deadline,
        budget,
        country: "IT",
        geographicLevel,
        sourceUrl,
        source: "opencoesione-api",
        publishedAt: this.parseDate(this.getText(item.data_pubblicazione)) || new Date(),
        guid: sourceUrl,
        programmingPeriod,
        fundingSource,
      };
    } catch (error) {
      console.warn("[OpenCoesioneAPIClient] Error parsing opportunity:", error);
      return null;
    }
  }

  /**
   * Determine geographic level from item
   */
  private getGeographicLevel(item: any): string {
    const region = this.getText(item.regione || "");
    const province = this.getText(item.provincia || "");

    if (region && region.toLowerCase() !== "italia") {
      return "regional";
    }
    if (province) {
      return "regional";
    }

    return "national";
  }

  /**
   * Parse date from various formats
   */
  private parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    try {
      // Try ISO format
      const isoDate = new Date(dateStr);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }

      // Try DD/MM/YYYY format
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // Try DD-MM-YYYY format
      const parts2 = dateStr.split("-");
      if (parts2.length === 3 && parts2[0].length === 2) {
        const date = new Date(parseInt(parts2[2]), parseInt(parts2[1]) - 1, parseInt(parts2[0]));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      return undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Extract number from text
   */
  private extractNumber(text: string): number | undefined {
    if (!text) return undefined;

    try {
      // Remove non-numeric characters except decimal point and comma
      const cleaned = text.replace(/[^\d,.-]/g, "");
      const normalized = cleaned.replace(",", ".");
      const num = parseFloat(normalized);

      return !isNaN(num) ? num : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Detect call type from text
   */
  private detectCallType(text: string): string {
    const lower = text.toLowerCase();

    if (lower.includes("residenza") || lower.includes("residency")) return "residency";
    if (lower.includes("premio") || lower.includes("award")) return "award";
    if (lower.includes("concorso") || lower.includes("competition")) return "competition";
    if (lower.includes("mostra") || lower.includes("exhibition") || lower.includes("biennale"))
      return "exhibition";
    if (lower.includes("fellowship")) return "fellowship";
    if (lower.includes("finanziamento") || lower.includes("grant")) return "grant";

    return "curatorial_open_call";
  }

  /**
   * Extract text from various formats
   */
  private getText(value: any): string {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value[0] || "";
    if (value && typeof value === "object" && value.text) return value.text;
    return "";
  }

  /**
   * Search opportunities by keywords
   */
  async searchOpportunities(keywords: string, limit: number = 50): Promise<OpenCoesioneCall[]> {
    try {
      const response = await this.client.get("/opportunita/search/", {
        params: {
          q: keywords,
          limit,
          format: "json",
        },
      });

      const calls: OpenCoesioneCall[] = [];

      if (response.data && Array.isArray(response.data.results)) {
        for (const item of response.data.results) {
          const call = this.parseOpportunity(item);
          if (call) {
            calls.push(call);
          }
        }
      }

      return calls;
    } catch (error) {
      console.error("[OpenCoesioneAPIClient] Error searching opportunities:", error);
      return [];
    }
  }

  /**
   * Get opportunities by region
   */
  async getOpportunitiesByRegion(region: string, limit: number = 50): Promise<OpenCoesioneCall[]> {
    try {
      const response = await this.client.get("/opportunita/", {
        params: {
          regione: region,
          limit,
          format: "json",
        },
      });

      const calls: OpenCoesioneCall[] = [];

      if (response.data && Array.isArray(response.data.results)) {
        for (const item of response.data.results) {
          const call = this.parseOpportunity(item);
          if (call) {
            calls.push(call);
          }
        }
      }

      return calls;
    } catch (error) {
      console.error("[OpenCoesioneAPIClient] Error fetching opportunities by region:", error);
      return [];
    }
  }

  /**
   * Get opportunities by programming period
   */
  async getOpportunitiesByPeriod(
    period: "2014-2020" | "2021-2027",
    limit: number = 50
  ): Promise<OpenCoesioneCall[]> {
    try {
      const response = await this.client.get("/opportunita/", {
        params: {
          ciclo_programmazione: period,
          limit,
          format: "json",
        },
      });

      const calls: OpenCoesioneCall[] = [];

      if (response.data && Array.isArray(response.data.results)) {
        for (const item of response.data.results) {
          const call = this.parseOpportunity(item);
          if (call) {
            calls.push(call);
          }
        }
      }

      return calls;
    } catch (error) {
      console.error("[OpenCoesioneAPIClient] Error fetching opportunities by period:", error);
      return [];
    }
  }
}
