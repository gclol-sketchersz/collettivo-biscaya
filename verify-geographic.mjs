import { getDb } from "./server/db.ts";
import { callsForEntries } from "./drizzle/schema.ts";
import { sql } from "drizzle-orm";

const db = await getDb();

const results = await db
  .select({
    callType: callsForEntries.callType,
    geographicLevel: callsForEntries.geographicLevel,
    count: sql`COUNT(*) as count`,
    titles: sql`GROUP_CONCAT(title SEPARATOR ' | ') as titles`,
  })
  .from(callsForEntries)
  .where(sql`status = 'active'`)
  .groupBy(callsForEntries.callType, callsForEntries.geographicLevel)
  .orderBy(callsForEntries.callType, callsForEntries.geographicLevel);

console.log("\n📊 Geographic Level Distribution:");
console.log("==================================\n");

for (const row of results) {
  console.log(`${row.callType} (${row.geographicLevel}): ${row.count} bandi`);
}

console.log("\n");
