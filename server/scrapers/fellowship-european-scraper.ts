import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedCall } from './base-scraper';

// Helper function to extract numbers from text
function extractNumber(text: string): number | undefined {
  const match = text.match(/\d+(?:[.,]\d{2})?/);
  return match ? parseFloat(match[0].replace(',', '.')) : undefined;
}

export class FellowshipEuropeanScraper extends BaseScraper {
  /**
   * Scrape fellowship calls from UrbanGlass
   */
  async scrapeUrbanGlass(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'https://urbanglass.org/studio/detail/visiting-artist-and-designer-fellowship';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse fellowship information
      const title = $('h1, h2').first().text().trim() || '2026 Visiting Artist and Designer Fellowship';
      const description = $('main, article, .content').text().trim();
      
      // Extract deadline from description
      const deadlineMatch = description.match(/deadline|scadenza|entro|fino al|(\d{1,2})\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})/i);
      const deadline = (deadlineMatch ? this.parseDate(deadlineMatch[0]) : null) || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      
      // Skip expired calls
      if (deadline >= new Date()) {
        const call: ScrapedCall = {
          title,
          description: description.substring(0, 500) || `Visiting Artist and Designer Fellowship - Opportunity to develop new work using glass`,
          source: 'UrbanGlass',
          sourceUrl: baseUrl,
          publishedAt: new Date(),
          deadline,
          callType: 'fellowship',
          budget: extractNumber(description),
          entity: 'UrbanGlass',
          country: 'USA',
          tags: ['fellowship', 'international', 'glass', 'artist']
        };

        calls.push(call);
      }

      return calls;
    } catch (error) {
      console.error('[FellowshipEuropeanScraper] Error scraping UrbanGlass:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape fellowship calls from AFH Boston
   */
  async scrapeAFHBoston(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'https://www.afhboston.org/news/2026-fellowship';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse fellowship information
      const title = $('h1, h2').first().text().trim() || '2026 AFH Artists Fellowship';
      const description = $('main, article, .content').text().trim();
      
      // Extract deadline from description
      const deadlineMatch = description.match(/deadline|scadenza|entro|fino al|(\d{1,2})\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})/i);
      const deadline = (deadlineMatch ? this.parseDate(deadlineMatch[0]) : null) || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      
      // Skip expired calls
      if (deadline >= new Date()) {
        const call: ScrapedCall = {
          title,
          description: description.substring(0, 500) || `$9,600 stipend to support your artistic journey with professional development workshops`,
          source: 'AFH Boston',
          sourceUrl: baseUrl,
          publishedAt: new Date(),
          deadline,
          callType: 'fellowship',
          budget: 9600,
          entity: 'AFH Boston',
          country: 'USA',
          tags: ['fellowship', 'international', 'boston', 'artist']
        };

        calls.push(call);
      }

      return calls;
    } catch (error) {
      console.error('[FellowshipEuropeanScraper] Error scraping AFH Boston:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape European funding calls from Creative Europe
   */
  async scrapeCreativeEurope(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'https://culture.ec.europa.eu/funding/calls';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse European funding calls
      $('article, .call-item, .funding-item').each((_, element) => {
        const $el = $(element);
        
        const title = $el.find('h2, h3, .title').text().trim() ||
                     $el.find('a').first().text().trim();
        const description = $el.find('.description, .content, p').text().trim();
        const dateText = $el.find('.date, .deadline, .scadenza').text().trim();
        const linkElement = $el.find('a').first();
        const externalLink = linkElement.attr('href') || baseUrl;

        if (title && externalLink) {
          const deadline = this.parseDate(dateText) || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          
          // Skip expired calls
          if (deadline < new Date()) {
            return;
          }

          const call: ScrapedCall = {
            title,
            description: description || `European funding call: ${title}`,
            source: 'Creative Europe',
            sourceUrl: externalLink.startsWith('http') ? externalLink : new URL(externalLink, baseUrl).href,
            publishedAt: new Date(),
            deadline,
            callType: 'grant',
            budget: extractNumber(description),
            entity: 'European Commission',
            country: 'Europe',
            tags: ['grant', 'european', 'creative-europe', 'funding']
          };

          calls.push(call);
        }
      });

      return calls;
    } catch (error) {
      console.error('[FellowshipEuropeanScraper] Error scraping Creative Europe:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape European funding calls from EU Funding Portal
   */
  async scrapeEUFundingPortal(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'https://eufundingportal.eu/tag/culture/';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse European funding calls
      $('article, .call-item, .funding-item, .post').each((_, element) => {
        const $el = $(element);
        
        const title = $el.find('h2, h3, .title').text().trim() ||
                     $el.find('a').first().text().trim();
        const description = $el.find('.description, .content, p, .excerpt').text().trim();
        const dateText = $el.find('.date, .deadline, .scadenza').text().trim();
        const linkElement = $el.find('a').first();
        const externalLink = linkElement.attr('href') || baseUrl;

        if (title && externalLink) {
          const deadline = this.parseDate(dateText) || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
          
          // Skip expired calls
          if (deadline < new Date()) {
            return;
          }

          const call: ScrapedCall = {
            title,
            description: description || `EU funding call: ${title}`,
            source: 'EU Funding Portal',
            sourceUrl: externalLink.startsWith('http') ? externalLink : new URL(externalLink, baseUrl).href,
            publishedAt: new Date(),
            deadline,
            callType: 'grant',
            budget: extractNumber(description),
            entity: 'European Union',
            country: 'Europe',
            tags: ['grant', 'european', 'eu-funding', 'culture']
          };

          calls.push(call);
        }
      });

      return calls;
    } catch (error) {
      console.error('[FellowshipEuropeanScraper] Error scraping EU Funding Portal:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape all fellowship and European sources
   */
  async scrapeAll(): Promise<ScrapedCall[]> {
    const [urbanGlassCalls, afhCalls, creativeCalls, euCalls] = await Promise.all([
      this.scrapeUrbanGlass(),
      this.scrapeAFHBoston(),
      this.scrapeCreativeEurope(),
      this.scrapeEUFundingPortal()
    ]);

    return [...urbanGlassCalls, ...afhCalls, ...creativeCalls, ...euCalls];
  }
}
