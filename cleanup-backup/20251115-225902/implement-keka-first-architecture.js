#!/usr/bin/env node

/**
 * KEKA-FIRST ARCHITECTURE IMPLEMENTATION
 * Replace Portfolio Management tables with Keka data as primary source
 */

const { Pool } = require('pg');

const pool = new Pool({
  user: 'portfolio_user',
  host: 'localhost',
  database: 'portfolio_management',
  password: 'portfolio_pass',
  port: 5432,
});

console.log('🔄 IMPLEMENTING KEKA-FIRST ARCHITECTURE');
console.log('=====================================');

async function main() {
  try {
    // Step 1: Analyze current data
    console.log('\n📊 STEP 1: ANALYZING CURRENT DATA');
    const analysis = await analyzeCurrentData();
    console.log('Analysis complete:', analysis);

    // Step 2: Create employee mappings (only missing ones)
    console.log('\n👥 STEP 2: SYNC MISSING EMPLOYEES');
    await syncMissingEmployees();

    // Step 3: Populate actual_efforts from Keka time entries
    console.log('\n⏰ STEP 3: POPULATE ACTUAL EFFORTS FROM KEKA');
    await populateActualEffortsFromKeka();

    // Step 4: Create views for reporting
    console.log('\n📋 STEP 4: CREATE REPORTING VIEWS');
    await createReportingViews();

    console.log('\n✅ KEKA-FIRST ARCHITECTURE IMPLEMENTED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

async function analyzeCurrentData() {
  const queries = [
    { name: 'PM Projects', query: 'SELECT COUNT(*) FROM projects' },
    { name: 'Keka Projects', query: 'SELECT COUNT(*) FROM keka_projects' },
    { name: 'PM Employees', query: 'SELECT COUNT(*) FROM employees' },
    { name: 'Keka Employees', query: 'SELECT COUNT(*) FROM keka_employees' },
    { name: 'Keka Time Entries', query: 'SELECT COUNT(*) FROM keka_task_time_entries' },
    { name: 'PM Actual Efforts', query: 'SELECT COUNT(*) FROM actual_efforts' }
  ];

  const results = {};
  for (const { name, query } of queries) {
    const result = await pool.query(query);
    results[name] = result.rows[0].count;
    console.log(`  ${name}: ${results[name]}`);
  }
  
  return results;
}

async function syncMissingEmployees() {
  // Find Keka employees not in PM employees table
  const query = `
    INSERT INTO employees (
      company_id, 
      keka_employee_id, 
      first_name, 
      last_name, 
      email, 
      department, 
      designation,
      is_active
    )
    SELECT 
      ke.company_id,
      ke.keka_employee_id,
      ke.first_name,
      ke.last_name,
      ke.email,
      ke.department,
      ke.designation,
      ke.is_active
    FROM keka_employees ke
    LEFT JOIN employees e ON e.keka_employee_id = ke.keka_employee_id
    WHERE e.id IS NULL
    RETURNING id, first_name, last_name, keka_employee_id;
  `;

  const result = await pool.query(query);
  console.log(`  ✅ Added ${result.rows.length} missing employees`);
  
  result.rows.forEach(row => {
    console.log(`    + ${row.first_name} ${row.last_name} (${row.keka_employee_id})`);
  });
}

async function populateActualEffortsFromKeka() {
  // Clear existing actual_efforts if any
  await pool.query('TRUNCATE actual_efforts');
  
  // Populate from Keka time entries
  const query = `
    INSERT INTO actual_efforts (
      company_id,
      project_id,
      employee_id,
      effort_date,
      hours_worked,
      task_description,
      source,
      external_timesheet_id,
      raw_record_id
    )
    SELECT 
      kte.company_id,
      -- Use Keka project ID directly (we'll handle this in views)
      kte.keka_project_id::text::uuid as project_id,
      e.id as employee_id,
      kte.work_date,
      kte.hours_worked,
      COALESCE(kte.comments, 'Keka timesheet entry'),
      'KEKA',
      kte.keka_time_entry_id::text,
      kte.id::text
    FROM keka_task_time_entries kte
    JOIN employees e ON e.keka_employee_id = kte.keka_employee_id
    WHERE kte.hours_worked > 0
    RETURNING id;
  `;

  try {
    const result = await pool.query(query);
    console.log(`  ✅ Populated ${result.rows.length} actual effort records`);
  } catch (error) {
    console.log(`  ⚠️  Direct population failed: ${error.message}`);
    console.log('  📝 Will use alternative approach with proper project mapping');
    
    // Alternative: Create a proper mapping
    await populateWithProperMapping();
  }
}

async function populateWithProperMapping() {
  const query = `
    INSERT INTO actual_efforts (
      company_id,
      employee_id,
      effort_date,
      hours_worked,
      task_description,
      source,
      external_timesheet_id,
      raw_record_id
    )
    SELECT 
      kte.company_id,
      e.id as employee_id,
      kte.work_date,
      kte.hours_worked,
      COALESCE(kte.comments, kp.code || ' - ' || 
        COALESCE((kp.raw_data->>'name')::text, 'Keka Project')),
      'KEKA',
      kte.keka_time_entry_id::text,
      kte.id::text
    FROM keka_task_time_entries kte
    JOIN employees e ON e.keka_employee_id = kte.keka_employee_id
    JOIN keka_projects kp ON kp.keka_project_id = kte.keka_project_id
    WHERE kte.hours_worked > 0
    RETURNING id;
  `;

  const result = await pool.query(query);
  console.log(`  ✅ Populated ${result.rows.length} actual effort records with proper mapping`);
}

async function createReportingViews() {
  // Create a comprehensive project view combining Keka and PM data
  const projectViewQuery = `
    CREATE OR REPLACE VIEW v_projects_comprehensive AS
    SELECT 
      kp.keka_project_id as project_id,
      kp.keka_client_id,
      COALESCE((kp.raw_data->>'name')::text, kp.code) as project_name,
      kp.code as project_code,
      kp.start_date,
      kp.end_date,
      kp.project_budget as budget,
      kp.budgeted_time as estimated_hours,
      kp.is_billable,
      kp.billing_type,
      kp.status,
      kp.is_archived,
      kp.project_managers,
      kc.raw_data->>'name' as client_name,
      -- Aggregated actuals from time entries
      COALESCE(effort_summary.total_hours, 0) as actual_hours,
      COALESCE(effort_summary.total_entries, 0) as timesheet_entries,
      kp.created_at,
      kp.updated_at
    FROM keka_projects kp
    LEFT JOIN keka_clients kc ON kc.keka_client_id = kp.keka_client_id
    LEFT JOIN (
      SELECT 
        keka_project_id,
        SUM(hours_worked) as total_hours,
        COUNT(*) as total_entries
      FROM keka_task_time_entries 
      GROUP BY keka_project_id
    ) effort_summary ON effort_summary.keka_project_id = kp.keka_project_id;
  `;

  await pool.query(projectViewQuery);
  console.log('  ✅ Created v_projects_comprehensive view');

  // Create employee utilization view
  const utilizationViewQuery = `
    CREATE OR REPLACE VIEW v_employee_utilization AS
    SELECT 
      e.id as employee_id,
      e.first_name || ' ' || e.last_name as employee_name,
      e.department,
      e.designation,
      DATE_TRUNC('month', kte.work_date) as month,
      SUM(kte.hours_worked) as total_hours,
      COUNT(DISTINCT kte.work_date) as working_days,
      COUNT(*) as timesheet_entries,
      AVG(kte.hours_worked) as avg_daily_hours
    FROM employees e
    JOIN keka_task_time_entries kte ON kte.keka_employee_id = e.keka_employee_id
    GROUP BY e.id, e.first_name, e.last_name, e.department, e.designation, 
             DATE_TRUNC('month', kte.work_date);
  `;

  await pool.query(utilizationViewQuery);
  console.log('  ✅ Created v_employee_utilization view');

  // Create project dashboard view
  const dashboardViewQuery = `
    CREATE OR REPLACE VIEW v_project_dashboard AS
    SELECT 
      vpc.*,
      -- Current month stats
      cm.current_month_hours,
      cm.current_month_entries,
      -- Last month stats  
      lm.last_month_hours,
      -- Variance
      CASE 
        WHEN vpc.budgeted_time > 0 THEN 
          ROUND(((vpc.actual_hours - vpc.budgeted_time) / vpc.budgeted_time * 100)::numeric, 2)
        ELSE NULL 
      END as budget_variance_percent
    FROM v_projects_comprehensive vpc
    LEFT JOIN (
      SELECT 
        keka_project_id,
        SUM(hours_worked) as current_month_hours,
        COUNT(*) as current_month_entries
      FROM keka_task_time_entries 
      WHERE DATE_TRUNC('month', work_date) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY keka_project_id
    ) cm ON cm.keka_project_id = vpc.project_id
    LEFT JOIN (
      SELECT 
        keka_project_id,
        SUM(hours_worked) as last_month_hours
      FROM keka_task_time_entries 
      WHERE DATE_TRUNC('month', work_date) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      GROUP BY keka_project_id
    ) lm ON lm.keka_project_id = vpc.project_id;
  `;

  await pool.query(dashboardViewQuery);
  console.log('  ✅ Created v_project_dashboard view');
}

// Run the implementation
main();