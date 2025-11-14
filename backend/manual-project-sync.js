// Import required modules
const express = require('express');
const { KekaProjectsSyncService } = require('./dist/integrations/keka-projects-sync.js');

async function manualProjectSync() {
  try {
    console.log('🔄 Starting manual project sync with billing data...');
    
    const syncService = new KekaProjectsSyncService();
    const result = await syncService.syncProjects('123e4567-e89b-12d3-a456-426614174000');
    
    console.log('\n✅ Sync completed!');
    console.log('Result:', {
      success: result.success,
      synced: result.synced,
      failed: result.failed,
      message: result.message
    });
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.slice(0, 3).forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    // Check billing data after sync
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
    
    console.log('\n💰 Projects with billing data after sync:');
    if (billingCheck.rows.length > 0) {
      billingCheck.rows.forEach(project => {
        console.log(`  ✅ ${project.name}: ${project.billing_type} (billable: ${project.is_billable})`);
      });
    } else {
      console.log('  ❌ No projects with billing data found');
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ Manual sync error:', error);
  }
}

// Build first, then run sync
const { exec } = require('child_process');
console.log('🔨 Building project...');
exec('npm run build', (error, stdout, stderr) => {
  if (error) {
    console.error('Build error:', error.message);
    return;
  }
  console.log('✅ Build complete, running sync...');
  manualProjectSync();
});
