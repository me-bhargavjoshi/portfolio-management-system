/**
 * Keka Timesheet Data Sync Script - Simplified Version
 * Fetches timesheet data from Keka API and stores it in the existing database structure
 */

const axios = require('axios');
const pg = require('pg');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_pass',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Keka OAuth2 configuration
const kekaConfig = {
  clientId: 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: 'L0lrngtVKLGBMimNzYNk',
  apiKey: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  tokenUrl: 'https://login.keka.com/connect/token'
};

// Default company ID for Dynamic Elements
const COMPANY_ID = '123e4567-e89b-12d3-a456-426614174000';

async function initDatabase() {
  const pool = new pg.Pool(dbConfig);
  return pool;
}

async function getKekaToken() {
  try {
    console.log('🔑 Getting fresh Keka token...');
    
    const response = await axios({
      method: 'POST',
      url: kekaConfig.tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: new URLSearchParams({
        'grant_type': 'kekaapi',
        'scope': 'kekaapi',
        'client_id': kekaConfig.clientId,
        'client_secret': kekaConfig.clientSecret,
        'api_key': kekaConfig.apiKey
      })
    });
    
    console.log('✅ Token retrieved successfully');
    return response.data.access_token;
    
  } catch (error) {
    console.error('❌ Failed to get token:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data);
    throw error;
  }
}

async function fetchKekaTimesheetsInBatches(token, startDate = '2025-01-01', endDate = '2025-11-15') {
  try {
    console.log(`📅 Fetching timesheets from ${startDate} to ${endDate} in monthly batches...`);
    
    let allTimesheets = [];
    
    // Create date batches (monthly intervals to avoid overwhelming the API)
    const batches = createDateBatches(startDate, endDate);
    
    console.log(`📊 Created ${batches.length} monthly batches to process`);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n� Processing batch ${i + 1}/${batches.length}: ${batch.from} to ${batch.to}`);
      
      try {
        const batchTimesheets = await fetchTimesheetsBatch(token, batch.from, batch.to);
        allTimesheets = allTimesheets.concat(batchTimesheets);
        
        console.log(`✅ Batch ${i + 1} completed: ${batchTimesheets.length} records`);
        console.log(`📊 Total records so far: ${allTimesheets.length}`);
        
        // Delay between batches to be respectful to the API
        if (i < batches.length - 1) {
          console.log('⏳ Waiting 2 seconds before next batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`❌ Error in batch ${i + 1}:`, error.message);
        console.log('⏭️ Continuing with next batch...');
        continue;
      }
    }

    console.log(`🎉 Successfully fetched all ${allTimesheets.length} timesheet records from ${batches.length} batches!`);
    return allTimesheets;

  } catch (error) {
    console.error('❌ Failed to fetch timesheets in batches:', error.message);
    throw error;
  }
}

function createDateBatches(startDate, endDate) {
  const batches = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentStart = new Date(start);
  
  while (currentStart < end) {
    // Create monthly batches
    const currentEnd = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Don't go beyond the end date
    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }
    
    batches.push({
      from: currentStart.toISOString(),
      to: currentEnd.toISOString()
    });
    
    // Move to next month
    currentStart = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 1);
  }
  
  return batches;
}

async function fetchTimesheetsBatch(token, fromDate, toDate) {
  try {
    let allTimesheets = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      console.log(`  📄 Fetching page ${currentPage} of ${totalPages}...`);
      
      const params = {
        from: fromDate,
        to: toDate,
        pageNumber: currentPage,
        pageSize: 100
      };
      
      const response = await axios({
        method: 'GET',
        url: 'https://dynamicelements.keka.com/api/v1/psa/timeentries',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${token}`
        },
        params: params
      });

      if (response.data.succeeded) {
        allTimesheets = allTimesheets.concat(response.data.data);
        totalPages = response.data.totalPages;
        currentPage++;
        
        console.log(`  ✅ Fetched ${response.data.data.length} records from page ${currentPage - 1}`);
        console.log(`  📊 Batch total so far: ${allTimesheets.length} of ${response.data.totalRecords}`);
      } else {
        throw new Error(`API returned error: ${response.data.message}`);
      }

      // Small delay between pages
      await new Promise(resolve => setTimeout(resolve, 100));

    } while (currentPage <= totalPages);

    return allTimesheets;

  } catch (error) {
    console.error('❌ Failed to fetch timesheet batch:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
}

async function createSimpleTimesheetTable() {
  const pool = await initDatabase();
  const client = await pool.connect();

  try {
    console.log('📊 Creating simple Keka timesheet table...');
    
    // Create a new simple table for Keka timesheet data
    await client.query(`
      CREATE TABLE IF NOT EXISTS keka_timesheets (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL,
        
        -- Keka identifiers
        keka_timesheet_id VARCHAR(255) NOT NULL UNIQUE,
        keka_employee_id VARCHAR(255) NOT NULL,
        keka_project_id VARCHAR(255) NOT NULL,
        keka_task_id VARCHAR(255) NOT NULL,
        
        -- Time data
        work_date DATE NOT NULL,
        total_minutes INTEGER NOT NULL,
        hours_worked DECIMAL(6,2) GENERATED ALWAYS AS (total_minutes / 60.0) STORED,
        start_time TIME,
        end_time TIME,
        
        -- Work details  
        comments TEXT,
        is_billable BOOLEAN NOT NULL DEFAULT false,
        keka_status INTEGER NOT NULL DEFAULT 0,
        
        -- Raw data for reference
        raw_json JSONB NOT NULL,
        
        -- Metadata
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheets_company ON keka_timesheets(company_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheets_employee ON keka_timesheets(keka_employee_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheets_date ON keka_timesheets(work_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheets_project ON keka_timesheets(keka_project_id);`);

    console.log('✅ Simple Keka timesheet table created successfully');

  } finally {
    client.release();
  }
}

async function storeTimesheetsInDatabase(timesheets) {
  const pool = await initDatabase();
  const client = await pool.connect();

  try {
    console.log(`💾 Storing ${timesheets.length} timesheet records in database...`);
    
    let storedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const timesheet of timesheets) {
      try {
        // Insert into the simple keka_timesheets table
        const insertQuery = `
          INSERT INTO keka_timesheets (
            company_id,
            keka_timesheet_id,
            keka_employee_id,
            keka_project_id,
            keka_task_id,
            work_date,
            total_minutes,
            start_time,
            end_time,
            comments,
            is_billable,
            keka_status,
            raw_json
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (keka_timesheet_id) 
          DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP,
            raw_json = EXCLUDED.raw_json,
            total_minutes = EXCLUDED.total_minutes,
            comments = EXCLUDED.comments,
            is_billable = EXCLUDED.is_billable,
            keka_status = EXCLUDED.keka_status
          RETURNING (xmax = 0) AS inserted;
        `;

        const result = await client.query(insertQuery, [
          COMPANY_ID,
          timesheet.id,
          timesheet.employeeId,
          timesheet.projectId,
          timesheet.taskId,
          timesheet.date,
          timesheet.totalMinutes,
          timesheet.startTime,
          timesheet.endTime,
          timesheet.comments,
          timesheet.isBillable,
          timesheet.status,
          JSON.stringify(timesheet)
        ]);

        const wasInserted = result.rows[0].inserted;
        if (wasInserted) {
          storedCount++;
        } else {
          duplicateCount++;
        }

        // Progress logging
        if ((storedCount + duplicateCount + errorCount) % 100 === 0) {
          console.log(`📊 Progress: ${storedCount + duplicateCount + errorCount}/${timesheets.length} processed`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Error storing timesheet ${timesheet.id}:`, error.message);
      }
    }

    console.log('🎉 Storage complete!');
    console.log(`📊 Summary:`);
    console.log(`  ✅ Stored: ${storedCount} new records`);
    console.log(`  🔄 Updated: ${duplicateCount} existing records`);
    console.log(`  ❌ Errors: ${errorCount} records`);

    return { storedCount, duplicateCount, errorCount };

  } finally {
    client.release();
  }
}

async function analyzeTimesheetData() {
  const pool = await initDatabase();
  const client = await pool.connect();

  try {
    console.log('📊 Analyzing stored timesheet data...');
    
    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT keka_employee_id) as unique_employees,
        COUNT(DISTINCT keka_project_id) as unique_projects,
        COUNT(DISTINCT keka_task_id) as unique_tasks,
        MIN(work_date) as earliest_date,
        MAX(work_date) as latest_date,
        SUM(total_minutes) as total_minutes,
        ROUND(SUM(total_minutes) / 60.0, 2) as total_hours,
        COUNT(CASE WHEN is_billable THEN 1 END) as billable_entries,
        COUNT(CASE WHEN NOT is_billable THEN 1 END) as non_billable_entries
      FROM keka_timesheets;
    `;
    
    const summaryResult = await client.query(summaryQuery);
    const summary = summaryResult.rows[0];
    
    console.log('\n📈 Timesheet Data Summary:');
    console.log(`  📋 Total Entries: ${summary.total_entries}`);
    console.log(`  👥 Unique Employees: ${summary.unique_employees}`);
    console.log(`  🎯 Unique Projects: ${summary.unique_projects}`);
    console.log(`  📝 Unique Tasks: ${summary.unique_tasks}`);
    console.log(`  📅 Date Range: ${summary.earliest_date?.toDateString()} to ${summary.latest_date?.toDateString()}`);
    console.log(`  ⏰ Total Hours: ${summary.total_hours} hours (${summary.total_minutes} minutes)`);
    console.log(`  💰 Billable Entries: ${summary.billable_entries}`);
    console.log(`  🆓 Non-billable Entries: ${summary.non_billable_entries}`);
    
    // Get top projects by hours
    const topProjectsQuery = `
      SELECT 
        keka_project_id,
        COUNT(*) as entry_count,
        SUM(total_minutes) as total_minutes,
        ROUND(SUM(total_minutes) / 60.0, 2) as total_hours
      FROM keka_timesheets
      GROUP BY keka_project_id
      ORDER BY total_minutes DESC
      LIMIT 10;
    `;
    
    const topProjectsResult = await client.query(topProjectsQuery);
    
    console.log('\n🏆 Top 10 Projects by Hours:');
    topProjectsResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. Project ${row.keka_project_id}: ${row.total_hours} hours (${row.entry_count} entries)`);
    });
    
    // Get employee activity
    const employeeActivityQuery = `
      SELECT 
        keka_employee_id,
        COUNT(*) as entry_count,
        SUM(total_minutes) as total_minutes,
        ROUND(SUM(total_minutes) / 60.0, 2) as total_hours
      FROM keka_timesheets
      GROUP BY keka_employee_id
      ORDER BY total_minutes DESC
      LIMIT 10;
    `;
    
    const employeeActivityResult = await client.query(employeeActivityQuery);
    
    console.log('\n👨‍💼 Top 10 Employees by Hours:');
    employeeActivityResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. Employee ${row.keka_employee_id.substring(0, 8)}...: ${row.total_hours} hours (${row.entry_count} entries)`);
    });

  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Starting Keka Timesheet Sync...');
    console.log('📅 Fetching timesheet data from January 1st, 2025 to November 15th, 2025');
    console.log('🔄 Using monthly batches with from/to timestamp parameters');
    
    // Step 1: Create the simple table
    await createSimpleTimesheetTable();
    
    // Step 2: Get authentication token
    const token = await getKekaToken();
    
    // Step 3: Fetch timesheet data from January 1st, 2025 in batches
    const timesheets = await fetchKekaTimesheetsInBatches(token, '2025-01-01', '2025-11-15');
    
    // Step 4: Store data in database
    const storageResult = await storeTimesheetsInDatabase(timesheets);
    
    // Step 5: Analyze the data
    await analyzeTimesheetData();
    
    console.log('\n🎉 Keka Timesheet Sync completed successfully!');
    console.log('📋 Summary:');
    console.log(`  📊 Total records fetched: ${timesheets.length}`);
    console.log(`  💾 New records stored: ${storageResult.storedCount}`);
    console.log(`  🔄 Records updated: ${storageResult.duplicateCount}`);
    console.log(`  ❌ Error records: ${storageResult.errorCount}`);
    
    console.log('\n📝 Data is now available in the keka_timesheets table');
    console.log('📊 You can query this data for your portfolio management analytics');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the sync
if (require.main === module) {
  main();
}

module.exports = {
  getKekaToken,
  fetchKekaTimesheetsInBatches,
  fetchTimesheetsBatch,
  createDateBatches,
  storeTimesheetsInDatabase,
  analyzeTimesheetData
};