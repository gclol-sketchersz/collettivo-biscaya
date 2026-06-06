import axios from 'axios';
import * as cheerio from 'cheerio';
import { BaseScraper, ScrapedCall } from './base-scraper';

// Helper function to extract numbers from text
function extractNumber(text: string): number | undefined {
  const match = text.match(/\d+(?:[.,]\d{2})?/);
  return match ? parseFloat(match[0].replace(',', '.')) : undefined;
}

export class AwardScraper extends BaseScraper {
  /**
   * Scrape award calls from Fondazione Sozzani
   */
  async scrapeSozzani(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'https://fondazionesozzani.org/it/sozzani-award-ita/';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse award information
      const title = $('h1, h2').first().text().trim() || 'Sozzani Award';
      const description = $('main, article, .content').text().trim();
      
      // Extract deadline from description
      const deadlineMatch = description.match(/scadenza|deadline|entro|fino al|until|by|(\d{1,2})\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})/i);
      const deadline = (deadlineMatch ? this.parseDate(deadlineMatch[0]) : null) || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      
      // Skip expired calls
      if (deadline >= new Date()) {
        const call: ScrapedCall = {
          title: `${title} - Sozzani Award`,
          description: description.substring(0, 500) || `Premia eccellenza, ricerca e innovazione creativa con borse di studio e fondi di supporto`,
          source: 'Fondazione Sozzani',
          sourceUrl: baseUrl,
          publishedAt: new Date(),
          deadline,
          callType: 'award',
          budget: extractNumber(description),
          entity: 'Fondazione Sozzani',
          country: 'Italy',
          tags: ['award', 'national', 'italy', 'excellence']
        };

        calls.push(call);
      }

      return calls;
    } catch (error) {
      console.error('[AwardScraper] Error scraping Sozzani:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape award calls from Fondazione Italia
   */
  async scrapeFondazioneItalia(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'http://fondazioneitalia.org/';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse award information
      const title = $('h1, h2').first().text().trim() || 'Premio Italia nel Mondo';
      const description = $('main, article, .content').text().trim();
      
      // Extract deadline from description
      const deadlineMatch = description.match(/scadenza|deadline|entro|fino al|until|by|(\d{1,2})\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|january|february|march|april|may|june|july|august|september|october|november|december)\s*(\d{4})/i);
      const deadline = (deadlineMatch ? this.parseDate(deadlineMatch[0]) : null) || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
      
      // Skip expired calls
      if (deadline >= new Date()) {
        const call: ScrapedCall = {
          title: `${title} - Fondazione Italia`,
          description: description.substring(0, 500) || `Riconoscimento alle Arti e Scienza Italiana nel Mondo`,
          source: 'Fondazione Italia',
          sourceUrl: baseUrl,
          publishedAt: new Date(),
          deadline,
          callType: 'award',
          budget: extractNumber(description),
          entity: 'Fondazione Italia',
          country: 'Italy',
          tags: ['award', 'international', 'italy', 'arts']
        };

        calls.push(call);
      }

      return calls;
    } catch (error) {
      console.error('[AwardScraper] Error scraping Fondazione Italia:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape award calls from IIC (Istituto Italiano di Cultura)
   */
  async scrapeIIC(): Promise<ScrapedCall[]> {
    const calls: ScrapedCall[] = [];
    const baseUrl = 'https://iicnewyork.esteri.it/it/gli_eventi/archivio-eventi/';

    try {
      const response = await axios.get(baseUrl, { timeout: 10000 });
      const $ = cheerio.load(response.data);

      // Parse award items
      $('article, .event-item, .award-item').each((_, element) => {
        const $el = $(element);
        
        const title = $el.find('h2, h3, .title').text().trim() ||
                     $el.find('a').first().text().trim();
        const description = $el.find('.description, .content, p').text().trim();
        const dateText = $el.find('.date, .published-date, .data').text().trim();
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
            description: description || `Premio/Award: ${title}`,
            source: 'Istituto Italiano di Cultura',
            sourceUrl: externalLink.startsWith('http') ? externalLink : new URL(externalLink, baseUrl).href,
            publishedAt: new Date(),
            deadline,
            callType: 'award',
            budget: extractNumber(description),
            entity: 'IIC',
            country: 'Italy',
            tags: ['award', 'international', 'italy']
          };

          calls.push(call);
        }
      });

      return calls;
    } catch (error) {
      console.error('[AwardScraper] Error scraping IIC:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Scrape all award sources
   */
  async scrapeAll(): Promise<ScrapedCall[]> {
    const [sozzaniCalls, fondazioneCalls, iicCalls] = await Promise.all([
      this.scrapeSozzani(),
      this.scrapeFondazioneItalia(),
      this.scrapeIIC()
    ]);

    return [...sozzaniCalls, ...fondazioneCalls, ...iicCalls];
  }
}
