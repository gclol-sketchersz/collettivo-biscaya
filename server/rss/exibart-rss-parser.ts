/**
 * Exibart RSS Parser
 * Parses Exibart RSS feed for cultural calls
 * Feed URL: https://www.exibart.com/feed/
 */

import { BaseRSSParser, type RSSCall, type RSSFeedConfig } from "./base-rss-parser";

export class ExibartRSSParser extends BaseRSSParser {
  constructor() {
    const config: RSSFeedConfig = {
      name: "Exibart",
      url: "https://www.exibart.com/feed/",
      entity: "Exibart",
      source: "exibart-rss",
    };
    super(config);
  }

  /**
   * Parse Exibart RSS items with custom logic
   */
  protected parseRSSItem(item: any): RSSCall | null {
    const baseCall = super.parseRSSItem(item);
    if (!baseCall) return null;

    // Extract additional metadata from Exibart items
    const category = this.getText(item.category);
    const content = this.getText(item["content:encoded"]);

    // Detect call type from category or content
    if (category) {
      baseCall.callType = this.detectCallType(category);
    } else if (content) {
      baseCall.callType = this.detectCallType(content);
    }

    // Try to extract deadline from content
    if (content) {
      const deadline = this.extractDeadline(content);
      if (deadline) {
        baseCall.deadline = deadline;
      }

      // Try to extract budget
      const budget = this.extractNumber(content);
      if (budget) {
        baseCall.budget = budget;
      }
    }

    return baseCall;
  }
}
