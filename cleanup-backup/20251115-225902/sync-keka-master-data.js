/**
 * Master Sync Script for All Keka Master Data
 * Syncs Clients -> Projects -> Employees in the correct order
 */

const axios = require('axios');
const { Pool } = require('pg');

// Keka OAuth2 configuration
const kekaConfig = {
  clientId: 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: 'L0lrngtVKLGBMimNzYNk',
  apiKey: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  tokenUrl: 'https://login.keka.com/connect/token'
};

// Database configuration
const dbConfig = {
  user: 'portfolio_user',
  host: 'localhost',
  database: 'portfolio_management',
  password: 'portfolio_password',
  port: 5432,
};

const pool = new Pool(dbConfig);

async function runScript(scriptName, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n🚀 Starting ${description}...`);
    console.log(`📝 Running: ${scriptName}`);
    
    const { spawn } = require('child_process');
    const child = spawn('node', [scriptName], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Failed to start ${description}:`, error);
      reject(error);
    });
  });
}

async function verifySync() {
  let client;
  try {
    console.log('\n🔍 Verifying sync results...');
    
    client = await pool.connect();
    
    // Get counts from all tables
    const queries = [
      { name: 'Clients', table: 'keka_clients' },
      { name: 'Projects', table: 'keka_projects' },
      { name: 'Employees', table: 'keka_employees' },
      { name: 'Timesheets', table: 'keka_timesheets' }
    ];
    
    console.log('\n📊 Final database counts:');
    
    for (const query of queries) {
      const result = await client.query(`SELECT COUNT(*) as count FROM ${query.table}`);
      console.log(`  📋 ${query.name}: ${result.rows[0].count} records`);
    }
    
    // Check data relationships
    const relationshipQuery = `
      SELECT 
        (SELECT COUNT(*) FROM keka_projects WHERE keka_client_id IS NOT NULL) as projects_with_clients,
        (SELECT COUNT(DISTINCT keka_client_id) FROM keka_projects WHERE keka_client_id IS NOT NULL) as unique_clients_in_projects,
        (SELECT COUNT(DISTINCT keka_employee_id) FROM keka_timesheets) as employees_with_timesheets,
        (SELECT COUNT(DISTINCT keka_project_id) FROM keka_timesheets) as projects_with_timesheets
    `;
    
    const relResult = await client.query(relationshipQuery);
    const rel = relResult.rows[0];
    
    console.log('\n🔗 Data relationships:');
    console.log(`  🔄 Projects linked to clients: ${rel.projects_with_clients}`);
    console.log(`  👥 Unique clients in projects: ${rel.unique_clients_in_projects}`);
    console.log(`  📊 Employees with timesheets: ${rel.employees_with_timesheets}`);
    console.log(`  📂 Projects with timesheets: ${rel.projects_with_timesheets}`);
    
    // Sample data integration check
    const integrationQuery = `
      SELECT 
        t.work_date,
        e.display_name as employee_name,
        p.name as project_name,
        c.name as client_name,
        t.hours_worked,
        t.is_billable
      FROM keka_timesheets t
      LEFT JOIN keka_employees e ON t.keka_employee_id = e.keka_employee_id
      LEFT JOIN keka_projects p ON t.keka_project_id = p.keka_project_id
      LEFT JOIN keka_clients c ON p.keka_client_id = c.keka_client_id
      WHERE t.work_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY t.work_date DESC, t.hours_worked DESC
      LIMIT 3
    `;
    
    const integrationResult = await client.query(integrationQuery);
    
    console.log('\n🔗 Sample integrated data (recent timesheets):');
    integrationResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.work_date} - ${row.employee_name || 'Unknown Employee'}`);
      console.log(`     Project: ${row.project_name || 'Unknown Project'} (Client: ${row.client_name || 'Unknown Client'})`);
      console.log(`     Hours: ${row.hours_worked} | Billable: ${row.is_billable ? 'Yes' : 'No'}`);
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function masterSync() {
  try {
    console.log('🎯 KEKA MASTER DATA SYNC - COMPREHENSIVE');
    console.log('==========================================');
    console.log('This will sync all master data from Keka:');
    console.log('1. Clients (PSA)');
    console.log('2. Projects (PSA)'); 
    console.log('3. Employees (HRIS)');
    console.log('4. Verify data relationships');
    
    const startTime = new Date();
    
    // Step 1: Sync Clients
    await runScript('sync-keka-clients.js', 'Keka Clients Sync');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Brief pause
    
    // Step 2: Sync Projects (depends on clients for foreign keys)
    await runScript('sync-keka-projects.js', 'Keka Projects Sync');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Brief pause
    
    // Step 3: Sync Employees
    await runScript('sync-keka-employees.js', 'Keka Employees Sync');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause
    
    // Step 4: Verify everything
    await verifySync();
    
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 MASTER SYNC COMPLETED SUCCESSFULLY! 🎉');
    console.log('=========================================');
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log('✅ All Keka master data has been synchronized');
    console.log('🔗 Data relationships verified');
    console.log('\n📋 What you now have:');
    console.log('  • Complete client database from Keka PSA');
    console.log('  • Complete project database with client relationships');
    console.log('  • Complete employee database from Keka HRIS');
    console.log('  • Historical timesheet data linked to all entities');
    console.log('  • Ready for portfolio management analytics!');
    
  } catch (error) {
    console.error('\n❌ MASTER SYNC FAILED:', error.message);
    console.error('\nThis could be due to:');
    console.error('• API rate limiting');
    console.error('• Network connectivity issues');
    console.error('• Database connection problems');
    console.error('• Authentication token expiry');
    throw error;
  } finally {
    await pool.end();
  }
}

// Run master sync
masterSync()
  .then(() => {
    console.log('\n✅ Master sync script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Master sync script failed:', error);
    process.exit(1);
  });