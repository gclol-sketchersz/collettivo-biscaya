import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "collettivo_biscaya",
});

const [rows] = await connection.execute(`
  SELECT 
    callType, 
    geographicLevel, 
    COUNT(*) as count
  FROM callsForEntries 
  WHERE status = 'active'
  GROUP BY callType, geographicLevel
  ORDER BY callType, geographicLevel
`);

console.log("\n📊 Geographic Level Distribution:");
console.log("==================================\n");

for (const row of rows) {
  console.log(`${row.callType} (${row.geographicLevel}): ${row.count} bandi`);
}

await connection.end();
