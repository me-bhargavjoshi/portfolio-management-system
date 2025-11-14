const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function removeProjectManagersColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Removing project_managers column from projects table...');
    
    // Check if column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'project_managers'
    `);
    
    if (columnCheck.rows.length > 0) {
      // Remove the column
      await client.query(`
        ALTER TABLE projects 
        DROP COLUMN project_managers
      `);
      console.log('✅ Removed project_managers column');
    } else {
      console.log('ℹ️  project_managers column does not exist');
    }
    
    console.log('Column removal completed successfully!');
    
  } catch (error) {
    console.error('❌ Error removing column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

removeProjectManagersColumn().catch(console.error);
