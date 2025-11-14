const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function findDuplicates() {
  console.log('\n=== CHECKING FOR DUPLICATES ===\n');
  
  // Check for duplicate clients by keka_id
  const duplicateClients = await pool.query(`
    SELECT keka_id, COUNT(*) as count, array_agg(id) as ids, array_agg(name) as names
    FROM clients 
    WHERE keka_id IS NOT NULL
    GROUP BY keka_id 
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `);
  
  console.log('=== DUPLICATE CLIENTS (by keka_id) ===');
  if (duplicateClients.rows.length > 0) {
    console.log(`Found ${duplicateClients.rows.length} duplicate client keka_ids:`);
    duplicateClients.rows.forEach(row => {
      console.log(`  keka_id: ${row.keka_id}`);
      console.log(`    Count: ${row.count}`);
      console.log(`    IDs: ${row.ids.join(', ')}`);
      console.log(`    Names: ${row.names.join(' | ')}`);
    });
  } else {
    console.log('  ✅ No duplicate clients by keka_id');
  }
  
  // Check for duplicate clients by name
  const duplicateClientNames = await pool.query(`
    SELECT name, COUNT(*) as count, array_agg(id) as ids, array_agg(keka_id) as keka_ids
    FROM clients 
    GROUP BY name 
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 10
  `);
  
  console.log('\n=== DUPLICATE CLIENTS (by name) ===');
  if (duplicateClientNames.rows.length > 0) {
    console.log(`Found ${duplicateClientNames.rows.length} duplicate client names:`);
    duplicateClientNames.rows.forEach(row => {
      console.log(`  Name: ${row.name}`);
      console.log(`    Count: ${row.count}`);
      console.log(`    Keka IDs: ${row.keka_ids.join(', ')}`);
    });
  } else {
    console.log('  ✅ No duplicate clients by name');
  }
  
  // Check for duplicate projects by keka_id
  const duplicateProjects = await pool.query(`
    SELECT keka_id, COUNT(*) as count, array_agg(id) as ids, array_agg(name) as names
    FROM projects 
    WHERE keka_id IS NOT NULL
    GROUP BY keka_id 
    HAVING COUNT(*) > 1
    ORDER BY count DESC
  `);
  
  console.log('\n=== DUPLICATE PROJECTS (by keka_id) ===');
  if (duplicateProjects.rows.length > 0) {
    console.log(`Found ${duplicateProjects.rows.length} duplicate project keka_ids:`);
    duplicateProjects.rows.forEach(row => {
      console.log(`  keka_id: ${row.keka_id}`);
      console.log(`    Count: ${row.count}`);
      console.log(`    IDs: ${row.ids.join(', ')}`);
      console.log(`    Names: ${row.names.join(' | ')}`);
    });
  } else {
    console.log('  ✅ No duplicate projects by keka_id');
  }
  
  // Check for duplicate projects by name
  const duplicateProjectNames = await pool.query(`
    SELECT name, COUNT(*) as count, array_agg(id) as ids, array_agg(keka_id) as keka_ids
    FROM projects 
    GROUP BY name 
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 10
  `);
  
  console.log('\n=== DUPLICATE PROJECTS (by name) ===');
  if (duplicateProjectNames.rows.length > 0) {
    console.log(`Found ${duplicateProjectNames.rows.length} duplicate project names:`);
    duplicateProjectNames.rows.forEach(row => {
      console.log(`  Name: ${row.name}`);
      console.log(`    Count: ${row.count}`);
      console.log(`    Keka IDs: ${row.keka_ids.join(', ')}`);
    });
  } else {
    console.log('  ✅ No duplicate projects by name');
  }
  
  // Check total counts
  const clientCount = await pool.query('SELECT COUNT(*) FROM clients WHERE keka_id IS NOT NULL');
  const projectCount = await pool.query('SELECT COUNT(*) FROM projects WHERE keka_id IS NOT NULL');
  
  console.log('\n=== TOTAL COUNTS ===');
  console.log(`Clients with keka_id: ${clientCount.rows[0].count}`);
  console.log(`Projects with keka_id: ${projectCount.rows[0].count}`);
  
  await pool.end();
}

findDuplicates().catch(console.error);
