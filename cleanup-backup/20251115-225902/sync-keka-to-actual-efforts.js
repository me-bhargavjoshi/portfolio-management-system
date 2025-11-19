const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'portfolio_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'portfolio_management',
  password: process.env.DB_PASSWORD || 'portfolio_pass',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function populateActualEffortsFromKeka() {
  console.log('🚀 STARTING KEKA TO ACTUAL EFFORTS SYNC');
  console.log('⏰ This will populate actual_efforts table from Keka timesheet data');
  console.log('======================================================================');

  try {
    // First, let's check current actual_efforts data
    const currentEfforts = await pool.query('SELECT COUNT(*) FROM actual_efforts');
    console.log(`📊 Current actual_efforts records: ${currentEfforts.rows[0].count}`);

    // Get time entries data from Keka
    const kekaTimeEntries = await pool.query('SELECT COUNT(*) FROM keka_task_time_entries');
    console.log(`📊 Available Keka time entries: ${kekaTimeEntries.rows[0].count}`);

    if (kekaTimeEntries.rows[0].count === 0) {
      console.log('❌ No Keka time entries found. Please run Keka sync first.');
      return;
    }

    // Create a comprehensive insert query that maps Keka data to actual_efforts
    const insertQuery = `
      INSERT INTO actual_efforts (
        company_id,
        project_id,
        employee_id, 
        effort_date,
        hours_worked,
        task_description,
        source,
        external_timesheet_id,
        raw_record_id,
        processed_at
      )
      SELECT DISTINCT
        kte.company_id,
        kp.id as project_id,  -- Use Portfolio Management project ID if exists
        ke.id as employee_id, -- Use Portfolio Management employee ID if exists
        kte.work_date,
        kte.hours_worked,
        COALESCE(
          kte.comments, 
          kpt.raw_data->>'name',
          'Keka timesheet entry'
        ) as task_description,
        'KEKA' as source,
        kte.keka_time_entry_id::text,
        kte.id,
        CURRENT_TIMESTAMP
      FROM keka_task_time_entries kte
      LEFT JOIN keka_projects keka_proj ON kte.keka_project_id = keka_proj.keka_project_id
      LEFT JOIN projects kp ON keka_proj.keka_project_id::text = kp.keka_id
      LEFT JOIN keka_employees keka_emp ON kte.keka_employee_id = keka_emp.keka_employee_id
      LEFT JOIN employees ke ON keka_emp.keka_employee_id::text = ke.keka_employee_id
      LEFT JOIN keka_project_tasks kpt ON kte.keka_task_id = kpt.keka_task_id
      WHERE kte.hours_worked > 0
      AND kte.work_date IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM actual_efforts ae 
        WHERE ae.external_timesheet_id = kte.keka_time_entry_id::text
        AND ae.source = 'KEKA'
      );
    `;

    console.log('🔄 Inserting time entries into actual_efforts...');
    const insertResult = await pool.query(insertQuery);
    console.log(`✅ Inserted ${insertResult.rowCount} new actual effort records`);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT project_id) as unique_projects,
        COUNT(DISTINCT employee_id) as unique_employees,
        SUM(hours_worked) as total_hours,
        MIN(effort_date) as earliest_date,
        MAX(effort_date) as latest_date
      FROM actual_efforts 
      WHERE source = 'KEKA'
    `;

    const summary = await pool.query(summaryQuery);
    const stats = summary.rows[0];

    console.log('\n📈 KEKA ACTUAL EFFORTS SUMMARY:');
    console.log(`  Total Entries: ${stats.total_entries}`);
    console.log(`  Unique Projects: ${stats.unique_projects}`);
    console.log(`  Unique Employees: ${stats.unique_employees}`);
    console.log(`  Total Hours: ${parseFloat(stats.total_hours || 0).toFixed(2)}`);
    console.log(`  Date Range: ${stats.earliest_date} to ${stats.latest_date}`);

    // Check mapping success rate
    const mappingQuery = `
      SELECT 
        COUNT(*) as total_keka_entries,
        COUNT(CASE WHEN ae.id IS NOT NULL THEN 1 END) as mapped_entries,
        COUNT(CASE WHEN ae.project_id IS NULL THEN 1 END) as missing_projects,
        COUNT(CASE WHEN ae.employee_id IS NULL THEN 1 END) as missing_employees
      FROM keka_task_time_entries kte
      LEFT JOIN actual_efforts ae ON kte.keka_time_entry_id::text = ae.external_timesheet_id AND ae.source = 'KEKA'
      WHERE kte.hours_worked > 0
    `;

    const mapping = await pool.query(mappingQuery);
    const mappingStats = mapping.rows[0];

    console.log('\n🎯 MAPPING SUCCESS RATE:');
    console.log(`  Total Keka Entries: ${mappingStats.total_keka_entries}`);
    console.log(`  Successfully Mapped: ${mappingStats.mapped_entries}`);
    console.log(`  Missing Project Mapping: ${mappingStats.missing_projects}`);
    console.log(`  Missing Employee Mapping: ${mappingStats.missing_employees}`);

    const successRate = ((mappingStats.mapped_entries / mappingStats.total_keka_entries) * 100).toFixed(1);
    console.log(`  Success Rate: ${successRate}%`);

    if (mappingStats.missing_projects > 0 || mappingStats.missing_employees > 0) {
      console.log('\n⚠️  WARNING: Some entries could not be mapped due to missing project/employee records');
      console.log('   Consider running ID mapping sync to improve mapping coverage');
    }

    console.log('\n✅ KEKA TO ACTUAL EFFORTS SYNC COMPLETE!');

  } catch (error) {
    console.error('❌ Fatal error in Keka to actual efforts sync:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the sync
populateActualEffortsFromKeka().catch(console.error);