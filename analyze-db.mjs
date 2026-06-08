import { getDb } from './server/db.ts';
import { callsForEntries } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function analyzeDatabase() {
  const db = await getDb();
  
  // Get all active calls
  const calls = await db.select().from(callsForEntries);
  
  console.log(`Total calls: ${calls.length}\n`);
  
  // Group by category and geographic level
  const grouped = {};
  calls.forEach(call => {
    const key = `${call.callType}|${call.geographicLevel}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(call);
  });
  
  // Display summary
  console.log('Distribution by category and geographic level:');
  console.log('Category             | GeoLevel   | Count');
  console.log('---------------------+------------+------');
  Object.entries(grouped).forEach(([key, items]) => {
    const [callType, geoLevel] = key.split('|');
    console.log(`${callType.padEnd(20)} | ${(geoLevel || 'null').padEnd(10)} | ${items.length}`);
  });
  
  console.log('\n\nSample calls by category:');
  const byCategory = {};
  calls.forEach(call => {
    if (!byCategory[call.callType]) byCategory[call.callType] = [];
    byCategory[call.callType].push(call);
  });
  
  Object.entries(byCategory).forEach(([category, items]) => {
    console.log(`\n${category} (${items.length} total):`);
    items.slice(0, 3).forEach(call => {
      console.log(`  - ${call.title.substring(0, 60)}`);
      console.log(`    Entity: ${call.entity}, Level: ${call.geographicLevel}`);
    });
  });
}

analyzeDatabase().catch(console.error);
