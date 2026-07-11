import { getDb } from "./server/db.ts";
import { callsForEntries } from "./drizzle/schema.ts";
import { sql } from "drizzle-orm";

const db = await getDb();

const [result] = await db
  .select({
    total: sql`COUNT(*) as total`,
    active: sql`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active`,
  })
  .from(callsForEntries);

console.log(`Total bandi: ${result.total}`);
console.log(`Active bandi: ${result.active}`);

process.exit(0);
