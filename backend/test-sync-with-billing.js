// Test the sync service with updated billing logic
const { KekaProjectsSyncService } = require('./dist/integrations/keka-projects-sync.js');

async function testSyncWithBilling() {
  try {
    console.log('🔄 Testing sync service with billing data extraction...');
    
    // Build first to ensure latest code
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          console.error('Build error:', error.message);
          reject(error);
        } else {
          console.log('✅ Build completed successfully');
          resolve();
        }
      });
    });
    
    // Run sync
    const syncService = new KekaProjectsSyncService();
    const result = await syncService.syncProjects('123e4567-e89b-12d3-a456-426614174000');
    
    console.log('\n📊 Sync Results:');
    console.log(`  - Success: ${result.success}`);
    console.log(`  - Synced: ${result.synced} projects`);
    console.log(`  - Failed: ${result.failed} projects`);
    console.log(`  - Message: ${result.message}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Sync Errors:');
      result.errors.slice(0, 5).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // Verify billing data was synced
    const { Pool } = require('pg');
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'portfolio_management',
      user: 'portfolio_user',
      password: 'portfolio_password'
    });
    
    const client = await pool.connect();
    
    // Check for newly synced billing data
    const billingCheck = await client.query(`
      SELECT name, billing_type, is_billable, updated_at
      FROM projects 
      WHERE is_active = true 
      AND (billing_type IS NOT NULL AND billing_type != 'Fixed-price')
      ORDER BY updated_at DESC
      LIMIT 5
    `);
    
    console.log('\n💰 Recent billing data from Keka sync:');
    if (billingCheck.rows.length > 0) {
      billingCheck.rows.forEach(project => {
        console.log(`  ✅ ${project.name}`);
        console.log(`     Type: ${project.billing_type}`);
        console.log(`     Billable: ${project.is_billable ? 'Yes' : 'No'}`);
        console.log(`     Updated: ${project.updated_at.toISOString().split('T')[0]}`);
        console.log('');
      });
    } else {
      console.log('  ⚠️  No recent billing updates found - sync may not have run or no billing data from Keka');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Sync test failed:', error.message);
  }
}

testSyncWithBilling();
