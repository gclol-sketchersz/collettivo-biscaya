/**
 * Artabus RSS Parser
 * Parses Artabus RSS feed for cultural calls and opportunities
 * Feed URL: https://www.artabus.com/feed/
 */

import { BaseRSSParser, type RSSCall, type RSSFeedConfig } from "./base-rss-parser";

export class ArtabusRSSParser extends BaseRSSParser {
  constructor() {
    const config: RSSFeedConfig = {
      name: "Artabus",
      url: "https://www.artabus.com/feed/",
      entity: "Artabus",
      source: "artabus-rss",
    };
    super(config);
  }

  /**
   * Parse Artabus RSS items with custom logic
   */
  protected parseRSSItem(item: any): RSSCall | null {
    const baseCall = super.parseRSSItem(item);
    if (!baseCall) return null;

    // Extract category and content
    const category = this.getText(item.category);
    const content = this.getText(item["content:encoded"]);
    const description = this.getText(item.description);
    const fullText = (category + " " + description + " " + content).toLowerCase();

    // Detect call type from Artabus categories
    if (fullText.includes("residenza") || fullText.includes("residency")) {
      baseCall.callType = "residency";
    } else if (fullText.includes("premio") || fullText.includes("award")) {
      baseCall.callType = "award";
    } else if (fullText.includes("concorso") || fullText.includes("competition")) {
      baseCall.callType = "competition";
    } else if (fullText.includes("mostra") || fullText.includes("exhibition")) {
      baseCall.callType = "exhibition";
    } else if (fullText.includes("fellowship")) {
      baseCall.callType = "fellowship";
    } else if (fullText.includes("finanziamento") || fullText.includes("grant")) {
      baseCall.callType = "grant";
    }

    // Try to extract deadline
    const deadline = this.extractDeadline(fullText);
    if (deadline) {
      baseCall.deadline = deadline;
    }

    // Try to extract budget
    const budget = this.extractNumber(fullText);
    if (budget) {
      baseCall.budget = budget;
    }

    return baseCall;
  }
}
