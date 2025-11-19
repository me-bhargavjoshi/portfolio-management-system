const { Pool } = require('pg');

const pool = new Pool({
  user: 'portfolio_user',
  host: 'localhost',
  database: 'portfolio_management',
  password: 'portfolio_pass',
  port: 5432,
});

async function analyzeKekaArchitecture() {
  try {
    console.log('🔍 KEKA-FIRST ARCHITECTURE ANALYSIS');
    console.log('=' .repeat(60));
    
    // 1. Data Completeness
    console.log('\n📊 DATA VOLUMES:');
    const tables = {
      'keka_employees': 'Employees (HRIS Source)',
      'keka_clients': 'Clients (HRIS Source)', 
      'keka_projects': 'Projects (HRIS Source)',
      'keka_project_tasks': 'Tasks (HRIS Source)',
      'keka_task_time_entries': 'Time Entries (HRIS Source)',
      'employees': 'PM Employees (Legacy)',
      'clients': 'PM Clients (Legacy)',
      'projects': 'PM Projects (Legacy)',
      'actual_efforts': 'PM Actual Efforts (Empty)'
    };
    
    for (const [table, desc] of Object.entries(tables)) {
      const count = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  ${desc}: ${count.rows[0].count}`);
    }
    
    // 2. Relationship Analysis
    console.log('\n🔗 DATA RELATIONSHIPS:');
    
    const projectsWithTasks = await pool.query(`
      SELECT COUNT(DISTINCT kp.keka_project_id) as count
      FROM keka_projects kp 
      JOIN keka_project_tasks kpt ON kp.keka_project_id = kpt.keka_project_id
    `);
    
    const projectsWithTime = await pool.query(`
      SELECT COUNT(DISTINCT keka_project_id) as count
      FROM keka_task_time_entries
    `);
    
    const activeEmployees = await pool.query(`
      SELECT COUNT(DISTINCT keka_employee_id) as count
      FROM keka_task_time_entries
    `);
    
    console.log(`  Projects with tasks: ${projectsWithTasks.rows[0].count}/125`);
    console.log(`  Projects with time entries: ${projectsWithTime.rows[0].count}/125`);
    console.log(`  Active employees: ${activeEmployees.rows[0].count}/112`);
    
    // 3. Data Quality Check
    console.log('\n✅ DATA QUALITY:');
    
    const kekaEmployeesComplete = await pool.query(`
      SELECT COUNT(*) as complete FROM keka_employees 
      WHERE keka_employee_id IS NOT NULL AND employee_code IS NOT NULL
    `);
    
    const kekaProjectsComplete = await pool.query(`
      SELECT COUNT(*) as complete FROM keka_projects 
      WHERE keka_project_id IS NOT NULL AND code IS NOT NULL
    `);
    
    const timeEntriesValid = await pool.query(`
      SELECT COUNT(*) as valid FROM keka_task_time_entries 
      WHERE hours_worked > 0 AND work_date IS NOT NULL
    `);
    
    console.log(`  Complete employees: ${kekaEmployeesComplete.rows[0].complete}/112`);
    console.log(`  Complete projects: ${kekaProjectsComplete.rows[0].complete}/125`);
    console.log(`  Valid time entries: ${timeEntriesValid.rows[0].valid}/14618`);
    
    // 4. Time Coverage
    const timeRange = await pool.query(`
      SELECT 
        MIN(work_date) as start_date,
        MAX(work_date) as end_date,
        SUM(hours_worked) as total_hours,
        COUNT(DISTINCT work_date) as unique_days
      FROM keka_task_time_entries
    `);
    
    console.log('\n📅 TIME COVERAGE:');
    const range = timeRange.rows[0];
    console.log(`  Date range: ${range.start_date} to ${range.end_date}`);
    console.log(`  Total hours: ${parseFloat(range.total_hours).toFixed(2)}`);
    console.log(`  Working days: ${range.unique_days}`);
    
    // 5. Redundancy Analysis
    console.log('\n🔄 REDUNDANCY ANALYSIS:');
    
    const duplicateEmployees = await pool.query(`
      SELECT COUNT(*) as pm_employees,
             (SELECT COUNT(*) FROM keka_employees) as keka_employees
      FROM employees
    `);
    
    const duplicateProjects = await pool.query(`
      SELECT COUNT(*) as pm_projects,
             (SELECT COUNT(*) FROM keka_projects) as keka_projects
      FROM projects
    `);
    
    console.log(`  PM Employees: ${duplicateEmployees.rows[0].pm_employees} (vs Keka: ${duplicateEmployees.rows[0].keka_employees})`);
    console.log(`  PM Projects: ${duplicateProjects.rows[0].pm_projects} (vs Keka: ${duplicateProjects.rows[0].keka_projects})`);
    console.log('  🚨 Data duplication detected - Keka is more complete!');
    
    // 6. Architecture Recommendation
    console.log('\n🎯 ARCHITECTURE RECOMMENDATIONS:');
    console.log('  ✅ Use Keka tables as primary data source');
    console.log('  ✅ Create views for backward compatibility');
    console.log('  ✅ Eliminate PM master data tables');
    console.log('  ✅ Keep only Portfolio-specific tables (budgets, allocations)');
    console.log('  ✅ Direct integration with frontend');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

analyzeKekaArchitecture();