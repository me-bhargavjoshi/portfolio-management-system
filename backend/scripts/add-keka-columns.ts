import { initDatabase } from '../src/config/database';

async function addKekaColumns() {
  console.log('Initializing database...');
  const pool = await initDatabase();
  
  try {
    console.log('Adding keka_id columns to tables...');
    
    // Add keka_id to clients table
    console.log('1. Adding keka_id to clients table...');
    await pool.query(`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS keka_id VARCHAR(100) UNIQUE;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_keka_id ON clients(keka_id);
    `);
    console.log('   ✅ Added keka_id to clients');
    
    // Add keka_id to projects table
    console.log('2. Adding keka_id to projects table...');
    await pool.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS keka_id VARCHAR(100) UNIQUE;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_keka_id ON projects(keka_id);
    `);
    console.log('   ✅ Added keka_id to projects');
    
    // Add keka_client_id to accounts table for mapping
    console.log('3. Adding keka_client_id to accounts table...');
    await pool.query(`
      ALTER TABLE accounts 
      ADD COLUMN IF NOT EXISTS keka_client_id VARCHAR(100);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_accounts_keka_client_id ON accounts(keka_client_id);
    `);
    console.log('   ✅ Added keka_client_id to accounts');
    
    // Add keka_client_id to projects for better mapping
    console.log('4. Adding keka_client_id to projects table...');
    await pool.query(`
      ALTER TABLE projects 
      ADD COLUMN IF NOT EXISTS keka_client_id VARCHAR(100);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_keka_client_id ON projects(keka_client_id);
    `);
    console.log('   ✅ Added keka_client_id to projects');
    
    console.log('\n✅ All Keka columns added successfully!');
    console.log('\nSchema updates:');
    console.log('- clients.keka_id (UNIQUE) - Keka client ID');
    console.log('- projects.keka_id (UNIQUE) - Keka project ID');
    console.log('- projects.keka_client_id - Reference to Keka client');
    console.log('- accounts.keka_client_id - Reference to Keka client');
    
    // Verify columns exist
    console.log('\nVerifying columns...');
    const clientsCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'clients' AND column_name = 'keka_id'
    `);
    const projectsCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name IN ('keka_id', 'keka_client_id')
    `);
    const accountsCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'keka_client_id'
    `);
    
    console.log(`\nclients.keka_id: ${clientsCheck.rows.length > 0 ? '✅' : '❌'}`);
    console.log(`projects.keka_id: ${projectsCheck.rows.some(r => r.column_name === 'keka_id') ? '✅' : '❌'}`);
    console.log(`projects.keka_client_id: ${projectsCheck.rows.some(r => r.column_name === 'keka_client_id') ? '✅' : '❌'}`);
    console.log(`accounts.keka_client_id: ${accountsCheck.rows.length > 0 ? '✅' : '❌'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding Keka columns:', error);
    process.exit(1);
  }
}

addKekaColumns();
