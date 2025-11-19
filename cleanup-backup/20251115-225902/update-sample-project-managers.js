const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function updateSampleProjectManagers() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating sample project managers...');
    
    // Update first 5 active projects with sample project manager names
    const result = await client.query(`
      UPDATE projects 
      SET project_managers = CASE 
        WHEN name LIKE '%NIF%' THEN 'Jay Patel, Ravi Sharma'
        WHEN name LIKE '%PMO%' THEN 'Anita Singh'
        WHEN name LIKE '%HR%' THEN 'Rajesh Kumar, Priya Patel'
        WHEN name LIKE '%Evidi%' THEN 'Suresh Reddy'
        WHEN name LIKE '%AITC%' THEN 'Amit Verma, Neha Gupta'
        ELSE 'John Doe'
      END
      WHERE is_active = true AND keka_id IS NOT NULL
      RETURNING name, project_managers;
    `);
    
    console.log('✅ Updated project managers:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.project_managers}`);
    });
    
    console.log(`\n✅ Successfully updated ${result.rows.length} projects!`);
    
  } catch (error) {
    console.error('❌ Error updating project managers:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSampleProjectManagers().catch(console.error);
