/**
 * On the Move RSS Parser
 * Parses On the Move RSS feed for cultural calls and residencies
 * Feed URL: https://www.on-the-move.org/en/calls/rss
 */

import { BaseRSSParser, type RSSCall, type RSSFeedConfig } from "./base-rss-parser";

export class OnTheMovRSSParser extends BaseRSSParser {
  constructor() {
    const config: RSSFeedConfig = {
      name: "On the Move",
      url: "https://www.on-the-move.org/en/calls/rss",
      entity: "On the Move",
      source: "on-the-move-rss",
    };
    super(config);
  }

  /**
   * Parse On the Move RSS items with custom logic
   */
  protected parseRSSItem(item: any): RSSCall | null {
    const baseCall = super.parseRSSItem(item);
    if (!baseCall) return null;

    // On the Move typically focuses on residencies and mobility programs
    baseCall.callType = "residency";
    baseCall.country = "EU"; // On the Move is European

    // Extract additional metadata
    const description = this.getText(item.description);
    const content = this.getText(item["content:encoded"]);
    const fullText = (description + " " + content).toLowerCase();

    // Detect more specific call type
    if (fullText.includes("residenza") || fullText.includes("residency")) {
      baseCall.callType = "residency";
    } else if (fullText.includes("fellowship")) {
      baseCall.callType = "fellowship";
    } else if (fullText.includes("grant")) {
      baseCall.callType = "grant";
    }

    // Try to extract deadline from description or content
    const deadline = this.extractDeadline(description + " " + content);
    if (deadline) {
      baseCall.deadline = deadline;
    }

    return baseCall;
  }
}
