import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedCall } from './base-scraper';

// Helper function to extract numbers from text
function extractNumber(text: string): number | undefined {
  const match = text.match(/\d+(?:[.,]\d{2})?/);
  return match ? parseFloat(match[0].replace(',', '.')) : undefined;
}

export class CompetitionScraper extends BaseScraper {
  /**
   * Scrape competition calls from GAi (Giovani Artisti Italiani)
   */
  async scrapeGAi(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'https://www.giovaniartisti.it/concorsi';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse competition items
      $('article, .competition-item, .call-item').each((_, element) => {
        const $el = $(element);
        
        const title = $el.find('h2, h3, .title').text().trim() ||
                     $el.find('a').first().text().trim();
        const description = $el.find('.description, .content, p').text().trim();
        const deadlineText = $el.find('.deadline, .date, .scadenza').text().trim();
        const linkElement = $el.find('a[href*="concorsi"], a').first();
        const externalLink = linkElement.attr('href') || baseUrl;

        if (title && externalLink) {
          const deadline = this.parseDate(deadlineText) || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          
          // Skip expired calls
          if (deadline < new Date()) {
            return;
          }

          const call: ScrapedCall = {
            title,
            description: description || `Concorso artistico: ${title}`,
            source: 'GAi - Giovani Artisti Italiani',
            sourceUrl: externalLink.startsWith('http') ? externalLink : new URL(externalLink, baseUrl).href,
            publishedAt: new Date(),
            deadline,
            callType: 'competition',
            budget: extractNumber(description),
            entity: 'GAi',
            country: 'Italy',
            tags: ['competition', 'national', 'italy']
          };

          calls.push(call);
        }
      });

      return calls;
    } catch (error) {
      console.error('[CompetitionScraper] Error scraping GAi:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape competition calls from Torino Giovani
   */
  async scrapeTorinoGiovani(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'https://www.torinogiovani.it/vivere-a-torino/cosa-fare-a-torino/cultura/concorsi-artistici-vari';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse competition items
      $('article, .competition-item, .call-item, .news-item').each((_, element) => {
        const $el = $(element);
        
        const title = $el.find('h2, h3, .title').text().trim() ||
                     $el.find('a').first().text().trim();
        const description = $el.find('.description, .content, p').text().trim();
        const dateText = $el.find('.date, .published-date, .data').text().trim();
        const linkElement = $el.find('a').first();
        const externalLink = linkElement.attr('href') || baseUrl;

        if (title && externalLink) {
          const deadline = this.parseDate(dateText) || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
          
          // Skip expired calls
          if (deadline < new Date()) {
            return;
          }

          const call: ScrapedCall = {
            title,
            description: description || `Concorso artistico: ${title}`,
            source: 'Torino Giovani',
            sourceUrl: externalLink.startsWith('http') ? externalLink : new URL(externalLink, baseUrl).href,
            publishedAt: new Date(),
            deadline,
            callType: 'competition',
            budget: extractNumber(description),
            entity: 'Torino Giovani',
            country: 'Italy',
            tags: ['competition', 'regional', 'piemonte']
          };

          calls.push(call);
        }
      });

      return calls;
    } catch (error) {
      console.error('[CompetitionScraper] Error scraping Torino Giovani:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape competition calls from ABABO Academy
   */
  async scrapeABABO(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'https://www.ababo.it/objects/bandi-e-concorsi-esterni';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse competition items
      $('article, .bando-item, .call-item, .competition-item').each((_, element) => {
        const $el = $(element);
        
        const title = $el.find('h2, h3, .title, strong').text().trim() ||
                     $el.find('a').first().text().trim();
        const description = $el.find('.description, .content, p').text().trim();
        const deadlineText = $el.find('.deadline, .scadenza, .date').text().trim();
        const linkElement = $el.find('a[href*="bando"], a').first();
        const externalLink = linkElement.attr('href') || baseUrl;

        if (title && externalLink) {
          const deadline = this.parseDate(deadlineText) || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          
          // Skip expired calls
          if (deadline < new Date()) {
            return;
          }

          const call: ScrapedCall = {
            title,
            description: description || `Bando/Concorso: ${title}`,
            source: 'ABABO Academy',
            sourceUrl: externalLink.startsWith('http') ? externalLink : new URL(externalLink, baseUrl).href,
            publishedAt: new Date(),
            deadline,
            callType: 'competition',
            budget: extractNumber(description),
            entity: 'ABABO',
            country: 'Italy',
            tags: ['competition', 'regional', 'veneto']
          };

          calls.push(call);
        }
      });

      return calls;
    } catch (error) {
      console.error('[CompetitionScraper] Error scraping ABABO:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape all competition sources
   */
  async scrapeAll(): Promise<ScrapedCall[]> {
    const [gaiCalls, torinoCalls, ababoCalls] = await Promise.all([
      this.scrapeGAi(),
      this.scrapeTorinoGiovani(),
      this.scrapeABABO()
    ]);

    return [...gaiCalls, ...torinoCalls, ...ababoCalls];
  }
}
