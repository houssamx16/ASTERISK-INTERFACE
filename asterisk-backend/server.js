require('dotenv').config();

const app = require('./src/app');
const { initDatabase } = require('./src/config/database');
const { syncCdrRecords } = require('./src/services/cdrSyncService');

const PORT = process.env.PORT || 5000;

console.log('Initializing SQLite database...');
initDatabase();
console.log('SQLite database schema verified.');

function runCdrSync() {
  try {
    const result = syncCdrRecords();

    if (result.imported > 0) {
      console.log(
        `[CDR Sync] Imported: ${result.imported}, Skipped: ${result.skipped}`
      );
    }
  } catch (error) {
    console.error('[CDR Sync] Error:', error.message);
  }
}

// Initial synchronization
runCdrSync();

// Synchronize new records every 5 seconds
const cdrSyncTimer = setInterval(runCdrSync, 5000);

// Keep the timer from preventing graceful process exit
cdrSyncTimer.unref();

app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`Asterisk Appliance Backend running on port ${PORT}`);
  console.log(`Base URL: http://localhost:${PORT}/api/v1`);
  console.log('========================================================');
});
