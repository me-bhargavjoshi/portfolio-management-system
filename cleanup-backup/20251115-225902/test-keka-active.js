const { KekaEmployeesSyncService } = require('./dist/integrations/keka-employees-sync.js');

async function testKekaSync() {
  try {
    console.log('🔄 Testing Keka employee sync with new department logic...');
    const syncService = new KekaEmployeesSyncService();
    const result = await syncService.syncEmployees('123e4567-e89b-12d3-a456-426614174000');
    
    console.log('Sync result:', {
      success: result.success,
      synced: result.synced,
      failed: result.failed,
      message: result.message
    });
    
    if (result.errors && result.errors.length > 0) {
      console.log('Errors:', result.errors.slice(0, 3)); // Show first 3 errors
    }
    
  } catch (error) {
    console.error('❌ Sync test error:', error.message);
  }
}

// Build first then test
console.log('🔨 Building project...');
const { exec } = require('child_process');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('Build error:', error.message);
    return;
  }
  if (stderr) {
    console.error('Build stderr:', stderr);
  }
  console.log('✅ Build complete, testing sync...');
  testKekaSync();
});
