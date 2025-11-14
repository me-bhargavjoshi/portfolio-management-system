const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function cleanupDuplicates() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('\n=== CLEANING UP DUPLICATES ===\n');
    
    // 1. Delete old clients that don't have keka_id (keep only Keka-synced ones)
    console.log('Step 1: Finding clients without keka_id...');
    const clientsWithoutKeka = await client.query(`
      SELECT id, name FROM clients WHERE keka_id IS NULL
    `);
    console.log(`Found ${clientsWithoutKeka.rows.length} clients without keka_id`);
    
    if (clientsWithoutKeka.rows.length > 0) {
      // Delete their accounts first (foreign key)
      const deleteAccounts = await client.query(`
        DELETE FROM accounts 
        WHERE client_id IN (SELECT id FROM clients WHERE keka_id IS NULL)
      `);
      console.log(`  Deleted ${deleteAccounts.rowCount} accounts linked to non-Keka clients`);
      
      // Now delete the clients
      const deleteClients = await client.query(`
        DELETE FROM clients WHERE keka_id IS NULL
      `);
      console.log(`  Deleted ${deleteClients.rowCount} clients without keka_id`);
    }
    
    // 2. Delete old projects that don't have keka_id (keep only Keka-synced ones)
    console.log('\nStep 2: Finding projects without keka_id...');
    const projectsWithoutKeka = await client.query(`
      SELECT id, name FROM projects WHERE keka_id IS NULL
    `);
    console.log(`Found ${projectsWithoutKeka.rows.length} projects without keka_id`);
    
    if (projectsWithoutKeka.rows.length > 0) {
      const deleteProjects = await client.query(`
        DELETE FROM projects WHERE keka_id IS NULL
      `);
      console.log(`  Deleted ${deleteProjects.rowCount} projects without keka_id`);
    }
    
    // 3. Check for any remaining duplicates
    console.log('\nStep 3: Checking for remaining duplicates...');
    
    const dupClients = await client.query(`
      SELECT keka_id, COUNT(*) as count 
      FROM clients 
      WHERE keka_id IS NOT NULL 
      GROUP BY keka_id 
      HAVING COUNT(*) > 1
    `);
    
    const dupProjects = await client.query(`
      SELECT keka_id, COUNT(*) as count 
      FROM projects 
      WHERE keka_id IS NOT NULL 
      GROUP BY keka_id 
      HAVING COUNT(*) > 1
    `);
    
    if (dupClients.rows.length > 0) {
      console.log(`  ⚠️  Warning: ${dupClients.rows.length} duplicate client keka_ids remain`);
    } else {
      console.log('  ✅ No duplicate client keka_ids');
    }
    
    if (dupProjects.rows.length > 0) {
      console.log(`  ⚠️  Warning: ${dupProjects.rows.length} duplicate project keka_ids remain`);
    } else {
      console.log('  ✅ No duplicate project keka_ids');
    }
    
    // 4. Final counts
    const finalClientCount = await client.query('SELECT COUNT(*) FROM clients');
    const finalProjectCount = await client.query('SELECT COUNT(*) FROM projects');
    
    console.log('\n=== FINAL COUNTS ===');
    console.log(`Clients: ${finalClientCount.rows[0].count}`);
    console.log(`Projects: ${finalProjectCount.rows[0].count}`);
    
    await client.query('COMMIT');
    console.log('\n✅ Cleanup completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupDuplicates().catch(console.error);
