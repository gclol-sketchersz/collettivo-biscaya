import axios from 'axios';

const API_URL = 'http://localhost:3000/api/scheduled/multi-source-import';

async function runImport() {
  try {
    console.log('Starting multi-source import job...\n');
    const response = await axios.post(API_URL, {}, {
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
        'x-manus-cron-task-uid': 'local-test-task-uid'
      }
    });

    console.log('Import completed successfully!\n');
    console.log('Results:');
    console.log(`- Total calls imported: ${response.data.totalCallsImported}`);
    console.log(`- Total calls scraped: ${response.data.totalCallsScraped}`);
    console.log(`- Duplicates removed: ${response.data.totalDuplicatesRemoved}`);
    console.log(`- Duration: ${response.data.duration}ms\n`);

    console.log('Category coverage:');
    Object.entries(response.data.categoryCoverage).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    console.log('\nSources imported:');
    response.data.sourcesImported.forEach(source => {
      console.log(`  ${source.name}: ${source.callsImported} (found: ${source.callsFound})`);
    });
  } catch (error) {
    console.error('Error running import:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

runImport();
