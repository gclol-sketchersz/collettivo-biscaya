/**
 * Base RSS Parser
 * Handles RSS/Atom feed parsing and extraction of cultural calls
 */

import axios from "axios";
import { parseStringPromise } from "xml2js";

export interface RSSCall {
  title: string;
  description: string;
  entity: string;
  callType: string;
  deadline?: Date;
  budget?: number;
  country?: string;
  sourceUrl: string; // Must be non-empty
  source: string;
  feedUrl: string;
  pubDate?: Date;
  publishedAt: Date;
  guid?: string;
}

export interface RSSFeedConfig {
  name: string;
  url: string;
  entity: string;
  source: string;
}

export class BaseRSSParser {
  protected feedUrl: string;
  protected feedName: string;
  protected entity: string;
  protected source: string;

  constructor(config: RSSFeedConfig) {
    this.feedUrl = config.url;
    this.feedName = config.name;
    this.entity = config.entity;
    this.source = config.source;
  }

  /**
   * Fetch and parse RSS feed
   */
  async parseFeed(): Promise<RSSCall[]> {
    try {
      console.log(`[RSSParser] Fetching feed: ${this.feedName}`);

      const response = await axios.get(this.feedUrl, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const parsed = await parseStringPromise(response.data);
      const items = this.extractItems(parsed);

      console.log(`[RSSParser] Found ${items.length} items in ${this.feedName}`);

      return items;
    } catch (error) {
      console.error(`[RSSParser] Error parsing ${this.feedName}:`, error);
      return [];
    }
  }

  /**
   * Extract items from parsed RSS/Atom feed
   * Override in subclasses for specific feed formats
   */
  protected extractItems(parsed: any): RSSCall[] {
    const items: RSSCall[] = [];

    // Try RSS 2.0 format
    if (parsed.rss?.channel?.[0]?.item) {
      for (const item of parsed.rss.channel[0].item) {
        const call = this.parseRSSItem(item);
        if (call) items.push(call);
      }
    }

    // Try Atom format
    if (parsed.feed?.entry) {
      for (const entry of parsed.feed.entry) {
        const call = this.parseAtomEntry(entry);
        if (call) items.push(call);
      }
    }

    return items;
  }

  /**
   * Parse RSS 2.0 item
   */
  protected parseRSSItem(item: any): RSSCall | null {
    try {
      const title = this.getText(item.title);
      const description = this.getText(item.description);
      const link = this.getText(item.link);
      const pubDate = this.parseDate(this.getText(item.pubDate));
      const guid = this.getText(item.guid);

      if (!title || !link) return null;

      return {
        title,
        description: description || "",
        entity: this.entity,
        callType: "curatorial_open_call",
        deadline: pubDate,
        country: "IT",
        sourceUrl: link,
        source: this.source,
        feedUrl: this.feedUrl,
        pubDate,
        publishedAt: pubDate || new Date(),
        guid,
      };
    } catch (error) {
      console.warn("[RSSParser] Error parsing RSS item:", error);
      return null;
    }
  }

  /**
   * Parse Atom entry
   */
  protected parseAtomEntry(entry: any): RSSCall | null {
    try {
      const title = this.getText(entry.title);
      const summary = this.getText(entry.summary);
      const content = this.getText(entry.content);
      const description = content || summary || "";

      // Get link from entry
      let link = "";
      if (entry.link) {
        if (Array.isArray(entry.link)) {
          const alternateLink = entry.link.find((l: any) => l.$.rel === "alternate" || !l.$.rel);
          link = alternateLink?.$.href || entry.link[0]?.$.href || "";
        } else {
          link = entry.link.$.href || "";
        }
      }

      const published = this.parseDate(this.getText(entry.published));
      const id = this.getText(entry.id);

      if (!title || !link) return null;

      return {
        title,
        description,
        entity: this.entity,
        callType: "curatorial_open_call",
        deadline: published,
        country: "IT",
        sourceUrl: link,
        source: this.source,
        feedUrl: this.feedUrl,
        pubDate: published,
        publishedAt: published || new Date(),
        guid: id,
      };
    } catch (error) {
      console.warn("[RSSParser] Error parsing Atom entry:", error);
      return null;
    }
  }

  /**
   * Helper to extract text from XML element
   */
  protected getText(element: any): string {
    if (!element) return "";
    if (typeof element === "string") return element;
    if (Array.isArray(element)) return element[0] || "";
    if (element._ !== undefined) return element._;
    return "";
  }

  /**
   * Parse date string to Date object
   */
  protected parseDate(dateStr: string): Date | undefined {
    if (!dateStr) return undefined;

    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      console.warn("[RSSParser] Error parsing date:", dateStr);
    }

    return undefined;
  }

  /**
   * Extract number from text
   */
  protected extractNumber(text: string): number | undefined {
    if (!text) return undefined;

    const match = text.match(/\d+(?:[.,]\d{2})?/);
    if (match) {
      return parseFloat(match[0].replace(",", "."));
    }

    return undefined;
  }

  /**
   * Extract deadline from text
   */
  protected extractDeadline(text: string): Date | undefined {
    if (!text) return undefined;

    // Try to find date patterns like "31/12/2026", "31-12-2026", "31 dicembre 2026"
    const datePatterns = [
      /(\d{1,2})[\/\-\s]+(\d{1,2})[\/\-\s]+(\d{4})/,
      /(\d{4})[\/\-\s]+(\d{1,2})[\/\-\s]+(\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          const parts = match[0].split(/[\/\-\s]+/);
          let day, month, year;

          if (parts[2].length === 4) {
            // DD/MM/YYYY or DD-MM-YYYY
            day = parseInt(parts[0]);
            month = parseInt(parts[1]);
            year = parseInt(parts[2]);
          } else {
            // YYYY/MM/DD or YYYY-MM-DD
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
            day = parseInt(parts[2]);
          }

          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (error) {
          console.warn("[RSSParser] Error parsing deadline:", error);
        }
      }
    }

    return undefined;
  }

  /**
   * Detect call type from text
   */
  protected detectCallType(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("residenza") || lowerText.includes("residency")) return "residency";
    if (lowerText.includes("premio") || lowerText.includes("award")) return "award";
    if (lowerText.includes("concorso") || lowerText.includes("competition")) return "competition";
    if (lowerText.includes("mostra") || lowerText.includes("exhibition")) return "exhibition";
    if (lowerText.includes("biennale")) return "exhibition";
    if (lowerText.includes("fellowship")) return "fellowship";
    if (lowerText.includes("grant") || lowerText.includes("finanziamento")) return "grant";

    return "curatorial_open_call";
  }
}
