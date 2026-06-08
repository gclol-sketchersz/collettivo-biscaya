import axios from 'axios';

const API_URL = 'http://localhost:3000/api/scheduled/cleanup-expired-calls';

async function runCleanup() {
  try {
    console.log('Starting cleanup job...\n');
    const response = await axios.post(API_URL, {}, {
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'x-manus-cron-task-uid': 'local-test-task-uid'
      }
    });

    console.log('Cleanup completed successfully!\n');
    console.log('Results:');
    console.log(`- Total calls checked: ${response.data.totalCallsChecked}`);
    console.log(`- Calls removed (expired): ${response.data.callsRemovedExpired}`);
    console.log(`- Calls removed (invalid): ${response.data.callsRemovedInvalid}`);
    console.log(`- Duration: ${response.data.duration}ms\n`);

    console.log('Remaining calls by category:');
    Object.entries(response.data.remainingByCategory || {}).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

    console.log('\nRemaining calls by geographic level:');
    Object.entries(response.data.remainingByGeographicLevel || {}).forEach(([level, count]) => {
      console.log(`  ${level}: ${count}`);
    });
  } catch (error) {
    console.error('Error running cleanup:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }
}

runCleanup();
