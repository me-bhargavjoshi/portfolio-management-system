import { initDatabase } from '../src/config/database';

async function clearKekaData() {
  console.log('Initializing database...');
  const pool = await initDatabase();
  
  try {
    console.log('Clearing existing Keka-synced data...');
    
    // Clear projects (has foreign key to accounts)
    const projectsResult = await pool.query('DELETE FROM projects WHERE keka_id IS NOT NULL OR company_id IS NOT NULL');
    console.log(`  ✅ Cleared ${projectsResult.rowCount} projects`);
    
    // Clear accounts
    const accountsResult = await pool.query('DELETE FROM accounts WHERE company_id IS NOT NULL');
    console.log(`  ✅ Cleared ${accountsResult.rowCount} accounts`);
    
    // Clear clients (but keep manually created ones without keka_id)
    const clientsResult = await pool.query('DELETE FROM clients WHERE keka_id IS NOT NULL OR name LIKE \'%Test%\' OR name LIKE \'%Default%\'');
    console.log(`  ✅ Cleared ${clientsResult.rowCount} clients`);
    
    console.log('\n✅ Database cleared and ready for fresh sync!');
    console.log('\nNext steps:');
    console.log('1. Restart backend');
    console.log('2. Run sync for clients: POST /api/keka/sync/clients');
    console.log('3. Run sync for projects: POST /api/keka/sync/projects');
    console.log('4. All data will have proper Keka IDs for unique identification');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    process.exit(1);
  }
}

clearKekaData();
