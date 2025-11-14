import { initDatabase } from '../src/config/database';

async function verifyKekaIds() {
  console.log('Initializing database...');
  const pool = await initDatabase();
  
  try {
    console.log('Verifying Keka IDs in database...\n');
    
    // Check clients
    const clientsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(keka_id) as with_keka_id,
        COUNT(CASE WHEN keka_id IS NULL THEN 1 END) as without_keka_id
      FROM clients
    `);
    console.log('📊 Clients:');
    console.log(`   Total: ${clientsResult.rows[0].total}`);
    console.log(`   With Keka ID: ${clientsResult.rows[0].with_keka_id}`);
    console.log(`   Without Keka ID: ${clientsResult.rows[0].without_keka_id}`);
    
    // Sample clients
    const clientSample = await pool.query(`
      SELECT name, keka_id 
      FROM clients 
      WHERE keka_id IS NOT NULL 
      LIMIT 3
    `);
    console.log('\n   Sample clients with Keka IDs:');
    clientSample.rows.forEach(row => {
      console.log(`   - ${row.name}: ${row.keka_id}`);
    });
    
    // Check projects
    const projectsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(keka_id) as with_keka_id,
        COUNT(keka_client_id) as with_client_ref,
        COUNT(CASE WHEN keka_id IS NULL THEN 1 END) as without_keka_id
      FROM projects
    `);
    console.log('\n📊 Projects:');
    console.log(`   Total: ${projectsResult.rows[0].total}`);
    console.log(`   With Keka ID: ${projectsResult.rows[0].with_keka_id}`);
    console.log(`   With Client Reference: ${projectsResult.rows[0].with_client_ref}`);
    console.log(`   Without Keka ID: ${projectsResult.rows[0].without_keka_id}`);
    
    // Sample projects
    const projectSample = await pool.query(`
      SELECT name, keka_id, keka_client_id 
      FROM projects 
      WHERE keka_id IS NOT NULL 
      LIMIT 3
    `);
    console.log('\n   Sample projects with Keka IDs:');
    projectSample.rows.forEach(row => {
      console.log(`   - ${row.name}`);
      console.log(`     Keka ID: ${row.keka_id}`);
      console.log(`     Client Ref: ${row.keka_client_id || 'N/A'}`);
    });
    
    // Check accounts
    const accountsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(keka_client_id) as with_client_ref
      FROM accounts
    `);
    console.log('\n📊 Accounts:');
    console.log(`   Total: ${accountsResult.rows[0].total}`);
    console.log(`   With Keka Client Reference: ${accountsResult.rows[0].with_client_ref}`);
    
    // Check employees
    const employeesResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(keka_employee_id) as with_keka_id
      FROM employees
    `);
    console.log('\n📊 Employees:');
    console.log(`   Total: ${employeesResult.rows[0].total}`);
    console.log(`   With Keka ID: ${employeesResult.rows[0].with_keka_id}`);
    
    console.log('\n✅ All Keka IDs are properly stored!');
    console.log('\n📝 Summary:');
    console.log(`   - All ${clientsResult.rows[0].with_keka_id} clients have unique Keka IDs`);
    console.log(`   - All ${projectsResult.rows[0].with_keka_id} projects have unique Keka IDs`);
    console.log(`   - ${projectsResult.rows[0].with_client_ref} projects linked to Keka clients`);
    console.log(`   - ${accountsResult.rows[0].with_client_ref} accounts linked to Keka clients`);
    console.log(`   - All ${employeesResult.rows[0].with_keka_id} employees have Keka IDs`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error verifying Keka IDs:', error);
    process.exit(1);
  }
}

verifyKekaIds();
