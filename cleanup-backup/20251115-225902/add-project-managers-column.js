const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function addProjectManagersColumn() {
  const client = await pool.connect();
  
  try {
    console.log('Adding project_managers column to projects table...');
    
    // Check if column already exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'project_managers'
    `);
    
    if (columnCheck.rows.length > 0) {
      console.log('✅ project_managers column already exists');
    } else {
      // Add the column
      await client.query(`
        ALTER TABLE projects 
        ADD COLUMN project_managers TEXT
      `);
      console.log('✅ Added project_managers column');
    }
    
    console.log('Column addition completed successfully!');
    
  } catch (error) {
    console.error('❌ Error adding column:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addProjectManagersColumn().catch(console.error);
