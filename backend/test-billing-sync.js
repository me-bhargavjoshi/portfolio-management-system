const { KekaProjectsSyncService } = require('./dist/integrations/keka-projects-sync.js');

async function testBillingSync() {
  try {
    console.log('🔄 Testing project sync with billing data...');
    
    // Build first
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    
    console.log('✅ Build complete, running sync...');
    
    const syncService = new KekaProjectsSyncService();
    const result = await syncService.syncProjects('123e4567-e89b-12d3-a456-426614174000');
    
    console.log('Sync result:', {
      success: result.success,
      synced: result.synced,
      failed: result.failed,
      message: result.message
    });
    
    // Check if billing data was populated
    const { Pool } = require('pg');
    const pool = new Pool({
      host: 'localhost',
      port: 5432,
      database: 'portfolio_management',
      user: 'portfolio_user',
      password: 'portfolio_password'
    });
    
    const client = await pool.connect();
    const billingCheck = await client.query(`
      SELECT name, billing_type, is_billable 
      FROM projects 
      WHERE is_active = true 
      AND (billing_type IS NOT NULL OR is_billable IS NOT NULL)
      LIMIT 5
    `);
    
    console.log('\n💰 Projects with billing data:');
    billingCheck.rows.forEach(project => {
      console.log(`  - ${project.name}: ${project.billing_type || 'null'} (billable: ${project.is_billable})`);
    });
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Billing sync test error:', error.message);
  }
}

testBillingSync();
