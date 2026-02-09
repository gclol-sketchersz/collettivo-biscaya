import { parseStringPromise } from 'xml2js';
import { createRssFeed, getRssFeeds } from './db';
import { callsForEntries } from '../drizzle/schema';
import { getDb } from './db';
import { and, eq } from 'drizzle-orm';

/**
 * RSS Service for importing cultural calls from various feeds
 */

export interface RssFeedConfig {
  name: string;
  feedUrl: string;
  source: string;
  parser: (item: any) => {
    title: string;
    entity: string;
    country: string;
    geographicLevel: 'regional' | 'national' | 'european';
    callType: string;
    deadline: Date;
    requirements: string;
    benefits: string;
    externalLink: string;
    qualitativeNotes: string;
  };
}

/**
 * Exibart RSS Feed Parser
 */
export const exibart: RssFeedConfig = {
  name: 'Exibart - Bandi e Concorsi',
  feedUrl: 'https://www.exibart.com/bandi-e-concorsi/feed/',
  source: 'exibart',
  parser: (item: any) => {
    const title = item.title?.[0] || 'Untitled';
    const description = item.description?.[0] || '';
    const link = item.link?.[0] || '';
    const pubDate = item.pubDate?.[0] ? new Date(item.pubDate[0]) : new Date();
    
    // Extract deadline from description (simplified)
    const deadlineMatch = description.match(/scadenza[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    const deadline = deadlineMatch ? new Date(deadlineMatch[1]) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    return {
      title,
      entity: 'Exibart',
      country: 'Italia',
      geographicLevel: 'national',
      callType: 'competition',
      deadline,
      requirements: description.substring(0, 500),
      benefits: 'Vedi link esterno',
      externalLink: link,
      qualitativeNotes: `Importato da Exibart il ${pubDate.toLocaleDateString('it-IT')}`,
    };
  },
};

/**
 * On the Move RSS Feed Parser
 */
export const onTheMove: RssFeedConfig = {
  name: 'On the Move - Residencies & Opportunities',
  feedUrl: 'https://on-the-move.org/news?category=31&format=rss',
  source: 'on-the-move',
  parser: (item: any) => {
    const title = item.title?.[0] || 'Untitled';
    const description = item.description?.[0] || '';
    const link = item.link?.[0] || '';
    const pubDate = item.pubDate?.[0] ? new Date(item.pubDate[0]) : new Date();
    
    // Extract deadline from description (simplified)
    const deadlineMatch = description.match(/deadline[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);
    const deadline = deadlineMatch ? new Date(deadlineMatch[1]) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    
    return {
      title,
      entity: 'On the Move',
      country: 'International',
      geographicLevel: 'european',
      callType: 'residency',
      deadline,
      requirements: description.substring(0, 500),
      benefits: 'Vedi link esterno',
      externalLink: link,
      qualitativeNotes: `Importato da On the Move il ${pubDate.toLocaleDateString('it-IT')}`,
    };
  },
};

/**
 * Fetch and parse RSS feed
 */
export async function fetchRssFeed(feedUrl: string): Promise<any[]> {
  try {
    const response = await fetch(feedUrl);
    const xml = await response.text();
    const parsed = await parseStringPromise(xml);
    
    const items = parsed.rss?.channel?.[0]?.item || [];
    return Array.isArray(items) ? items : [items];
  } catch (error) {
    console.error(`[RSS] Error fetching feed ${feedUrl}:`, error);
    return [];
  }
}

/**
 * Import calls from RSS feed
 */
export async function importFromRssFeed(feedConfig: RssFeedConfig) {
  try {
    const items = await fetchRssFeed(feedConfig.feedUrl);
    const db = await getDb();
    
    if (!db) {
      console.error('[RSS] Database not available');
      return { imported: 0, skipped: 0 };
    }
    
    let imported = 0;
    let skipped = 0;
    
    for (const item of items) {
      try {
        const parsedCall = feedConfig.parser(item);
        
        // Check if call already exists (by title and entity)
        const existing = await db
          .select()
          .from(callsForEntries)
          .where(
            and(
              eq(callsForEntries.title, parsedCall.title),
              eq(callsForEntries.entity, parsedCall.entity)
            )
          )
          .limit(1);
        
        if (existing.length === 0) {
          await db.insert(callsForEntries).values({
            title: parsedCall.title,
            entity: parsedCall.entity,
            country: parsedCall.country,
            geographicLevel: parsedCall.geographicLevel,
            callType: parsedCall.callType as any,
            deadline: parsedCall.deadline,
            requirements: parsedCall.requirements,
            benefits: parsedCall.benefits,
            externalLink: parsedCall.externalLink,
            qualitativeNotes: parsedCall.qualitativeNotes,
            isActive: 1,
          });
          imported++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error('[RSS] Error parsing item:', error);
        skipped++;
      }
    }
    
    console.log(`[RSS] ${feedConfig.name}: imported ${imported}, skipped ${skipped}`);
    return { imported, skipped };
  } catch (error) {
    console.error(`[RSS] Error importing from ${feedConfig.name}:`, error);
    return { imported: 0, skipped: 0 };
  }
}

/**
 * Run RSS import job
 */
export async function runRssImportJob() {
  console.log('[RSS] Starting RSS import job...');
  
  const feeds = [exibart, onTheMove];
  const results = [];
  
  for (const feed of feeds) {
    const result = await importFromRssFeed(feed);
    results.push({ feed: feed.name, ...result });
  }
  
  console.log('[RSS] RSS import job completed:', results);
  return results;
}
