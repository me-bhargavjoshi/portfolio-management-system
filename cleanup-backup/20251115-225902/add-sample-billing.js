const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function addSampleBilling() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding sample billing data to test UI...');
    
    // Update first few projects with sample billing data
    const result = await client.query(`
      UPDATE projects 
      SET 
        billing_type = CASE 
          WHEN name LIKE '%NIF%' THEN 'Time & Material'
          WHEN name LIKE '%PMO%' THEN 'Fixed-price'
          WHEN name LIKE '%HR%' THEN 'Non-billable'
          WHEN name LIKE '%Evidi%' THEN 'Retainer'
          WHEN name LIKE '%AITC%' THEN 'Time & Material'
          ELSE 'Fixed-price'
        END,
        is_billable = CASE 
          WHEN name LIKE '%HR%' THEN false
          WHEN name LIKE '%Admin%' THEN false
          ELSE true
        END
      WHERE is_active = true AND keka_id IS NOT NULL
      RETURNING name, billing_type, is_billable;
    `);
    
    console.log('✅ Updated projects with billing data:');
    result.rows.slice(0, 10).forEach(project => {
      console.log(`  - ${project.name}: ${project.billing_type} (billable: ${project.is_billable ? 'Yes' : 'No'})`);
    });
    
    console.log(`\n✅ Successfully updated ${result.rows.length} projects with billing data!`);
    
  } catch (error) {
    console.error('❌ Error adding sample billing:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

addSampleBilling().catch(console.error);
