const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function checkBillingData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking current projects billing data...');
    
    // Get sample projects with billing info
    const result = await client.query(`
      SELECT name, billing_type, is_billable, keka_id
      FROM projects 
      WHERE is_active = true 
      ORDER BY name
      LIMIT 10
    `);
    
    console.log('\n📊 Sample projects with billing data:');
    result.rows.forEach(project => {
      const billable = project.is_billable === null ? 'null' : (project.is_billable ? 'Yes' : 'No');
      console.log(`  - ${project.name}`);
      console.log(`    Billing Type: ${project.billing_type || '-'}`);
      console.log(`    Billable: ${billable}`);
      console.log(`    Keka ID: ${project.keka_id || 'none'}`);
      console.log('');
    });
    
    // Get billing statistics
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(billing_type) as projects_with_billing_type,
        COUNT(CASE WHEN is_billable = true THEN 1 END) as billable_projects,
        COUNT(CASE WHEN is_billable = false THEN 1 END) as non_billable_projects
      FROM projects 
      WHERE is_active = true
    `);
    
    const stats = statsResult.rows[0];
    console.log('💰 Billing statistics:');
    console.log(`  - Total active projects: ${stats.total_projects}`);
    console.log(`  - Projects with billing type: ${stats.projects_with_billing_type}`);
    console.log(`  - Billable projects: ${stats.billable_projects}`);
    console.log(`  - Non-billable projects: ${stats.non_billable_projects}`);
    
  } catch (error) {
    console.error('❌ Error checking billing data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkBillingData().catch(console.error);
