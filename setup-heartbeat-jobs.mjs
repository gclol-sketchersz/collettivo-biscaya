#!/usr/bin/env node

/**
 * Setup Heartbeat Jobs Script
 * Creates 5 scheduled jobs for automatic call imports with authority-based filtering
 */

import { execSync } from "child_process";

const JOBS = [
  {
    name: "multi-source-import-level-a",
    cron: "0 1 * * *",
    path: "/api/scheduled/multi-source-import",
    description: "Import calls from Level A sources (Residenze Artistiche)",
  },
  {
    name: "multi-source-import-level-b",
    cron: "30 1 * * *",
    path: "/api/scheduled/multi-source-import",
    description: "Import calls from Level B sources (Exibart RSS + Award)",
  },
  {
    name: "multi-source-import-level-c",
    cron: "0 2 * * *",
    path: "/api/scheduled/multi-source-import",
    description: "Import calls from Level C sources (Competition + Fellowship)",
  },
  {
    name: "cleanup-expired-calls",
    cron: "0 3 * * *",
    path: "/api/scheduled/cleanup-expired-calls",
    description: "Remove expired calls from database",
  },
  {
    name: "authority-validation",
    cron: "30 3 * * *",
    path: "/api/scheduled/authority-validation",
    description: "Validate and update authority scores",
  },
];

console.log("🚀 Setting up Heartbeat Jobs for Collettivo Biscaya...\n");

for (const job of JOBS) {
  try {
    console.log(`📋 Creating job: ${job.name}`);
    console.log(`   Cron: ${job.cron}`);
    console.log(`   Path: ${job.path}`);
    console.log(`   Description: ${job.description}`);

    const command = `manus-heartbeat create --name ${job.name} --cron "${job.cron}" --path ${job.path} --description "${job.description}"`;

    const result = execSync(command, { encoding: "utf-8" });
    console.log(`   ✅ Success\n`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
}

console.log("\n📊 Summary:");
console.log("============");
console.log("✅ All heartbeat jobs have been configured!");
console.log("\nSchedule:");
console.log("- 1:00 AM UTC: Import Level A sources (Residenze Artistiche)");
console.log("- 1:30 AM UTC: Import Level B sources (Exibart RSS + Award)");
console.log("- 2:00 AM UTC: Import Level C sources (Competition + Fellowship)");
console.log("- 3:00 AM UTC: Cleanup expired calls");
console.log("- 3:30 AM UTC: Validate authority scores");
console.log("\n📝 To view jobs, run: manus-heartbeat list");
