const { KekaProjectsSyncService } = require('./dist/integrations/keka-projects-sync.js');

async function runSync() {
  try {
    console.log('🔄 Starting project sync...');
    const syncService = new KekaProjectsSyncService();
    const result = await syncService.syncProjects('123e4567-e89b-12d3-a456-426614174000');
    console.log('Sync result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Sync error:', error);
  }
}

runSync();
