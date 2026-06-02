/**
 * ANAC API Client
 * Integrates with ANAC (Autorità Nazionale Anticorruzione) open data
 * Source: https://dati.anticorruzione.it/opendata/
 */

import axios, { AxiosInstance } from "axios";

export interface ANACCall {
  title: string;
  description: string;
  entity: string;
  callType: string;
  deadline?: Date;
  budget?: number;
  country: string;
  sourceUrl: string;
  source: string;
  publishedAt: Date;
  guid?: string;
  cig?: string; // Codice Identificativo Gara
  importoBase?: number;
  importoSommato?: number;
}

export interface ANACConfig {
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

export class ANACAPIClient {
  private client: AxiosInstance;
  private config: Required<ANACConfig>;

  constructor(config: ANACConfig = {}) {
    this.config = {
      baseUrl: "https://dati.anticorruzione.it/api/",
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
   * Fetch bandi from ANAC open data
   */
  async fetchBandi(limit: number = 100, offset: number = 0): Promise<ANACCall[]> {
    try {
      // ANAC provides data through their open data portal
      // This is a simplified integration - actual endpoint may vary
      const response = await this.client.get("/bandi", {
        params: {
          limit,
          offset,
          format: "json",
        },
      });

      const calls: ANACCall[] = [];

      if (response.data && Array.isArray(response.data.data)) {
        for (const item of response.data.data) {
          const call = this.parseANACBando(item);
          if (call) {
            calls.push(call);
          }
        }
      }

      return calls;
    } catch (error) {
      console.error("[ANACAPIClient] Error fetching bandi:", error);
      return [];
    }
  }

  /**
   * Parse ANAC bando to standard format
   */
  private parseANACBando(item: any): ANACCall | null {
    try {
      const title = this.getText(item.oggetto || item.title);
      const sourceUrl = this.getText(item.url || item.link);

      if (!title || !sourceUrl) {
        return null;
      }

      const description = this.getText(item.descrizione || item.description || "");
      const entity = this.getText(item.stazione_appaltante || item.entity || "ANAC");

      // Parse deadline
      const deadlineStr = this.getText(item.data_scadenza || item.deadline);
      const deadline = deadlineStr ? this.parseDate(deadlineStr) : undefined;

      // Parse budget
      const importoBase = this.extractNumber(item.importo_base || "");
      const importoSommato = this.extractNumber(item.importo_sommato || "");
      const budget = importoSommato || importoBase;

      // Detect call type
      const callType = this.detectCallType(title + " " + description);

      // Extract CIG (Codice Identificativo Gara)
      const cig = this.getText(item.cig || item.codice_gara);

      return {
        title,
        description,
        entity,
        callType,
        deadline,
        budget,
        country: "IT",
        sourceUrl,
        source: "anac-api",
        publishedAt: this.parseDate(this.getText(item.data_pubblicazione)) || new Date(),
        guid: cig || sourceUrl,
        cig,
        importoBase,
        importoSommato,
      };
    } catch (error) {
      console.warn("[ANACAPIClient] Error parsing bando:", error);
      return null;
    }
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
   * Search bandi by keywords
   */
  async searchBandi(keywords: string, limit: number = 50): Promise<ANACCall[]> {
    try {
      const response = await this.client.get("/bandi/search", {
        params: {
          q: keywords,
          limit,
          format: "json",
        },
      });

      const calls: ANACCall[] = [];

      if (response.data && Array.isArray(response.data.data)) {
        for (const item of response.data.data) {
          const call = this.parseANACBando(item);
          if (call) {
            calls.push(call);
          }
        }
      }

      return calls;
    } catch (error) {
      console.error("[ANACAPIClient] Error searching bandi:", error);
      return [];
    }
  }

  /**
   * Get bandi by entity
   */
  async getBandiByEntity(entity: string, limit: number = 50): Promise<ANACCall[]> {
    try {
      const response = await this.client.get("/bandi/entity", {
        params: {
          entity,
          limit,
          format: "json",
        },
      });

      const calls: ANACCall[] = [];

      if (response.data && Array.isArray(response.data.data)) {
        for (const item of response.data.data) {
          const call = this.parseANACBando(item);
          if (call) {
            calls.push(call);
          }
        }
      }

      return calls;
    } catch (error) {
      console.error("[ANACAPIClient] Error fetching bandi by entity:", error);
      return [];
    }
  }
}
