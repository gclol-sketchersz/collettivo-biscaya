/**
 * Base Web Scraper for cultural calls
 * Provides common scraping functionality and error handling
 */

import axios, { AxiosInstance } from "axios";
import { load, CheerioAPI } from "cheerio";

export interface ScrapedCall {
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  publishedAt: Date;
  deadline: Date;
  callType?: string;
  budget?: number;
  entity?: string;
  country?: string;
  tags?: string[];
  fullContent?: string;
}

export interface ScraperConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  userAgent?: string;
  headers?: Record<string, string>;
}

export class BaseScraper {
  protected client: AxiosInstance;
  protected config: Required<ScraperConfig>;
  protected $: CheerioAPI | null = null;

  constructor(config: ScraperConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      headers: {},
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        "User-Agent": this.config.userAgent,
        ...this.config.headers,
      },
    });
  }

  /**
   * Fetch HTML content from URL with retry logic
   */
  protected async fetchHtml(url: string, retries = this.config.retries): Promise<string> {
    try {
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      if (retries > 0) {
        console.warn(`[Scraper] Retry ${this.config.retries - retries + 1} for ${url}`);
        await this.delay(1000);
        return this.fetchHtml(url, retries - 1);
      }
      throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load HTML content into Cheerio
   */
  protected loadHtml(html: string): CheerioAPI {
    return load(html);
  }

  /**
   * Parse date string to Date object
   * Supports common Italian date formats
   */
  protected parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try ISO format first
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // Try Italian format: "1 giugno 2026" or "01/06/2026"
    const italianMonths: Record<string, number> = {
      gennaio: 0,
      febbraio: 1,
      marzo: 2,
      aprile: 3,
      maggio: 4,
      giugno: 5,
      luglio: 6,
      agosto: 7,
      settembre: 8,
      ottobre: 9,
      novembre: 10,
      dicembre: 11,
    };

    // Format: "1 giugno 2026"
    const italianMatch = dateStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/i);
    if (italianMatch) {
      const [, day, month, year] = italianMatch;
      const monthIndex = italianMonths[month.toLowerCase()];
      if (monthIndex !== undefined) {
        return new Date(parseInt(year), monthIndex, parseInt(day));
      }
    }

    // Format: "01/06/2026" or "1/6/2026"
    const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const [, day, month, year] = slashMatch;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    return null;
  }

  /**
   * Extract number from string (e.g., "€ 5.000" -> 5000)
   */
  protected extractNumber(str: string): number | null {
    if (!str) return null;
    const match = str.replace(/[^\d,.-]/g, "").match(/[\d,.-]+/);
    if (!match) return null;
    const numStr = match[0].replace(/\./g, "").replace(",", ".");
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  }

  /**
   * Normalize text (trim, remove extra spaces)
   */
  protected normalizeText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\n+/g, " ");
  }

  /**
   * Delay execution (for rate limiting)
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Extract calls from page (to be implemented by subclasses)
   */
  async scrape(url: string): Promise<ScrapedCall[]> {
    throw new Error("scrape() must be implemented by subclass");
  }

  /**
   * Scrape multiple pages
   */
  async scrapePages(baseUrl: string, pageCount: number): Promise<ScrapedCall[]> {
    const allCalls: ScrapedCall[] = [];

    for (let page = 1; page <= pageCount; page++) {
      try {
        const url = `${baseUrl}?page=${page}`;
        console.log(`[Scraper] Scraping page ${page}...`);
        const calls = await this.scrape(url);
        allCalls.push(...calls);

        // Rate limiting
        await this.delay(2000);
      } catch (error) {
        console.error(`[Scraper] Error scraping page ${page}:`, error);
      }
    }

    return allCalls;
  }
}
