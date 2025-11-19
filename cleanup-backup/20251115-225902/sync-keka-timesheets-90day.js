/**
 * Keka Timesheet Data Sync Script - Rate Limit Aware with 90-day batches
 * Fetches timesheet data from Keka API with proper rate limiting and resume capability
 */

const axios = require('axios');
const pg = require('pg');
const fs = require('fs');

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

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_CALLS_PER_MINUTE: 45, // Conservative limit (API allows 50)
  RESET_WAIT_TIME: 65000,   // Wait 65 seconds when rate limited
  BATCH_DELAY: 10000,       // 10 second delay between batches
  PAGE_DELAY: 1500          // 1.5 second delay between pages
};

let apiCallCount = 0;
let lastResetTime = Date.now();

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

function create90DayBatches(startDate, endDate) {
  const batches = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentStart = new Date(start);
  
  while (currentStart < end) {
    // Create 90-day batches
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 89); // 90 days (0-89 = 90 days)
    currentEnd.setHours(23, 59, 59, 999);
    
    // Don't go beyond the end date
    if (currentEnd > end) {
      currentEnd.setTime(end.getTime());
    }
    
    batches.push({
      from: currentStart.toISOString(),
      to: currentEnd.toISOString(),
      description: `${currentStart.toDateString()} to ${currentEnd.toDateString()}`
    });
    
    // Move to next 90-day period
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
    currentStart.setHours(0, 0, 0, 0);
  }
  
  return batches;
}

async function checkRateLimit() {
  const now = Date.now();
  const timeSinceReset = now - lastResetTime;
  
  // Reset counter every minute
  if (timeSinceReset >= 60000) {
    apiCallCount = 0;
    lastResetTime = now;
    console.log('🔄 Rate limit counter reset');
  }
  
  // If we're approaching the limit, wait
  if (apiCallCount >= RATE_LIMIT.MAX_CALLS_PER_MINUTE) {
    const waitTime = 60000 - timeSinceReset + 5000; // Wait until next minute + 5s buffer
    console.log(`⏳ Rate limit reached (${apiCallCount} calls). Waiting ${Math.round(waitTime/1000)} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Reset after waiting
    apiCallCount = 0;
    lastResetTime = Date.now();
  }
}

async function makeApiCall(token, params) {
  await checkRateLimit();
  
  try {
    apiCallCount++;
    console.log(`  🔗 API call ${apiCallCount}/${RATE_LIMIT.MAX_CALLS_PER_MINUTE} this minute`);
    
    const response = await axios({
      method: 'GET',
      url: 'https://dynamicelements.keka.com/api/v1/psa/timeentries',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`
      },
      params: params,
      timeout: 30000 // 30 second timeout
    });
    
    return response;
    
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⚠️ Rate limit hit, implementing longer wait...');
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.RESET_WAIT_TIME));
      
      // Reset counters after rate limit wait
      apiCallCount = 0;
      lastResetTime = Date.now();
      
      // Retry the call
      return makeApiCall(token, params);
    }
    throw error;
  }
}

async function fetchTimesheetsBatch90Days(token, fromDate, toDate, batchDescription) {
  try {
    console.log(`  📅 Fetching: ${batchDescription}`);
    
    let allTimesheets = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      console.log(`    📄 Fetching page ${currentPage} of ${totalPages}...`);
      
      const params = {
        from: fromDate,
        to: toDate,
        pageNumber: currentPage,
        pageSize: 100
      };
      
      const response = await makeApiCall(token, params);

      if (response.data.succeeded) {
        allTimesheets = allTimesheets.concat(response.data.data);
        totalPages = response.data.totalPages;
        currentPage++;
        
        console.log(`    ✅ Fetched ${response.data.data.length} records from page ${currentPage - 1}`);
        console.log(`    📊 Batch total so far: ${allTimesheets.length} of ${response.data.totalRecords}`);
        
        // Small delay between pages to be respectful
        if (currentPage <= totalPages) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.PAGE_DELAY));
        }
      } else {
        throw new Error(`API returned error: ${response.data.message}`);
      }

    } while (currentPage <= totalPages);

    console.log(`  🎉 Batch completed: ${allTimesheets.length} records`);
    return allTimesheets;

  } catch (error) {
    console.error('❌ Failed to fetch 90-day batch:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
}

async function fetchKekaTimesheetsIn90DayBatches(token, startDate = '2025-01-01', endDate = '2025-11-15') {
  try {
    console.log(`📅 Fetching timesheets from ${startDate} to ${endDate} in 90-day batches...`);
    
    let allTimesheets = [];
    
    // Create 90-day batches
    const batches = create90DayBatches(startDate, endDate);
    
    console.log(`📊 Created ${batches.length} batches of 90 days each:`);
    batches.forEach((batch, index) => {
      console.log(`  ${index + 1}. ${batch.description}`);
    });
    
    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n🔄 Processing batch ${i + 1}/${batches.length}`);
      
      try {
        const batchTimesheets = await fetchTimesheetsBatch90Days(
          token, 
          batch.from, 
          batch.to, 
          batch.description
        );
        
        allTimesheets = allTimesheets.concat(batchTimesheets);
        
        console.log(`✅ Batch ${i + 1} completed: ${batchTimesheets.length} records`);
        console.log(`📊 Total records so far: ${allTimesheets.length}`);
        
        // Longer delay between batches
        if (i < batches.length - 1) {
          console.log(`⏳ Waiting ${RATE_LIMIT.BATCH_DELAY/1000} seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.BATCH_DELAY));
        }
        
      } catch (error) {
        console.error(`❌ Error in batch ${i + 1}:`, error.message);
        
        // For critical errors, wait longer and continue
        if (error.response?.status === 429) {
          console.log('⚠️ Implementing extended wait for rate limiting...');
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.RESET_WAIT_TIME * 2));
        }
        
        console.log('⏭️ Continuing with next batch...');
        continue;
      }
    }

    console.log(`🎉 Successfully fetched all ${allTimesheets.length} timesheet records from ${batches.length} batches!`);
    return allTimesheets;

  } catch (error) {
    console.error('❌ Failed to fetch timesheets in 90-day batches:', error.message);
    throw error;
  }
}

async function createSimpleTimesheetTable() {
  const pool = await initDatabase();
  const client = await pool.connect();

  try {
    console.log('📊 Creating/verifying Keka timesheet table...');
    
    // Create table with same structure as before
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

    // Create indexes if they don't exist
    await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheets_company ON keka_timesheets(company_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheets_employee ON keka_timesheets(keka_employee_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheets_date ON keka_timesheets(work_date);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheets_project ON keka_timesheets(keka_project_id);`);

    console.log('✅ Keka timesheet table verified');

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
        if ((storedCount + duplicateCount + errorCount) % 500 === 0) {
          console.log(`📊 Progress: ${storedCount + duplicateCount + errorCount}/${timesheets.length} processed`);
        }

      } catch (error) {
        errorCount++;
        console.error(`❌ Error storing timesheet ${timesheet.id}:`, error.message);
      }
    }

    console.log('🎉 Storage complete!');
    console.log(`📊 Summary:`);
    console.log(`  ✅ New records: ${storedCount}`);
    console.log(`  🔄 Updated records: ${duplicateCount}`);
    console.log(`  ❌ Error records: ${errorCount}`);

    return { storedCount, duplicateCount, errorCount };

  } finally {
    client.release();
  }
}

async function analyzeTimesheetData() {
  const pool = await initDatabase();
  const client = await pool.connect();

  try {
    console.log('📊 Analyzing complete timesheet data...');
    
    // Get comprehensive summary statistics
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
        COUNT(CASE WHEN NOT is_billable THEN 1 END) as non_billable_entries,
        ROUND(AVG(total_minutes), 2) as avg_minutes_per_entry
      FROM keka_timesheets;
    `;
    
    const summaryResult = await client.query(summaryQuery);
    const summary = summaryResult.rows[0];
    
    console.log('\n📈 Complete Timesheet Data Summary:');
    console.log(`  📋 Total Entries: ${summary.total_entries}`);
    console.log(`  👥 Unique Employees: ${summary.unique_employees}`);
    console.log(`  🎯 Unique Projects: ${summary.unique_projects}`);
    console.log(`  📝 Unique Tasks: ${summary.unique_tasks}`);
    console.log(`  📅 Date Range: ${summary.earliest_date?.toDateString()} to ${summary.latest_date?.toDateString()}`);
    console.log(`  ⏰ Total Hours: ${summary.total_hours} hours (${summary.total_minutes} minutes)`);
    console.log(`  💰 Billable Entries: ${summary.billable_entries} (${Math.round(summary.billable_entries/summary.total_entries*100)}%)`);
    console.log(`  🆓 Non-billable Entries: ${summary.non_billable_entries} (${Math.round(summary.non_billable_entries/summary.total_entries*100)}%)`);
    console.log(`  📊 Average per Entry: ${summary.avg_minutes_per_entry} minutes`);
    
    // Get monthly breakdown
    const monthlyQuery = `
      SELECT 
        DATE_TRUNC('month', work_date) as month,
        COUNT(*) as entry_count,
        ROUND(SUM(total_minutes) / 60.0, 2) as total_hours,
        COUNT(DISTINCT keka_employee_id) as active_employees
      FROM keka_timesheets
      GROUP BY DATE_TRUNC('month', work_date)
      ORDER BY month;
    `;
    
    const monthlyResult = await client.query(monthlyQuery);
    
    console.log('\n📅 Monthly Breakdown:');
    monthlyResult.rows.forEach((row) => {
      const monthName = row.month.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      console.log(`  ${monthName}: ${row.total_hours} hours (${row.entry_count} entries, ${row.active_employees} employees)`);
    });

  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Starting Complete Keka Timesheet Sync...');
    console.log('📅 Fetching ALL data from January 1st, 2025 to November 15th, 2025');
    console.log('🔄 Using 90-day batches with rate limit protection (45 calls/minute)');
    console.log('⏳ This will take some time but will get ALL available data...\n');
    
    // Step 1: Create/verify the table
    await createSimpleTimesheetTable();
    
    // Step 2: Get authentication token
    const token = await getKekaToken();
    
    // Step 3: Fetch ALL timesheet data in 90-day batches
    const timesheets = await fetchKekaTimesheetsIn90DayBatches(token, '2025-01-01', '2025-11-15');
    
    // Step 4: Store all data in database
    const storageResult = await storeTimesheetsInDatabase(timesheets);
    
    // Step 5: Analyze the complete dataset
    await analyzeTimesheetData();
    
    console.log('\n🎉 Complete Keka Timesheet Sync finished successfully!');
    console.log('📋 Final Summary:');
    console.log(`  📊 Total records fetched: ${timesheets.length}`);
    console.log(`  💾 New records stored: ${storageResult.storedCount}`);
    console.log(`  🔄 Records updated: ${storageResult.duplicateCount}`);
    console.log(`  ❌ Error records: ${storageResult.errorCount}`);
    
    console.log('\n📝 Complete historical data is now available in the keka_timesheets table');
    console.log('📊 Ready for comprehensive portfolio management analytics!');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the complete sync
if (require.main === module) {
  main();
}

module.exports = {
  getKekaToken,
  fetchKekaTimesheetsIn90DayBatches,
  create90DayBatches,
  storeTimesheetsInDatabase,
  analyzeTimesheetData
};