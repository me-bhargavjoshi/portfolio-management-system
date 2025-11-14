const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function testProjectSync() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking current projects table structure...');
    
    // Check if project_managers column exists
    const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'project_managers'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ project_managers column exists:', columnCheck.rows[0]);
    } else {
      console.log('❌ project_managers column does not exist');
      return;
    }
    
    // Check current project data
    const projectData = await client.query(`
      SELECT name, project_managers, keka_id 
      FROM projects 
      WHERE is_active = true 
      LIMIT 5
    `);
    
    console.log('\n📊 Current project data:');
    projectData.rows.forEach(project => {
      console.log(`  - ${project.name}: "${project.project_managers}" (keka_id: ${project.keka_id})`);
    });
    
    console.log('\n✅ Project managers field check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testProjectSync().catch(console.error);
