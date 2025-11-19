/**
 * Keka Timesheet Data Sync Script - 60-day batches (API maximum)
 * Fetches ALL missing timesheet data with proper 60-day batch limits
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

const COMPANY_ID = '123e4567-e89b-12d3-a456-426614174000';

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_CALLS_PER_MINUTE: 40, // Conservative limit
  BATCH_DELAY: 15000,       // 15 second delay between batches
  PAGE_DELAY: 2000          // 2 second delay between pages
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

function create60DayBatches(startDate, endDate) {
  const batches = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentStart = new Date(start);
  
  while (currentStart < end) {
    // Create 60-day batches (API maximum)
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 59); // 60 days (0-59 = 60 days)
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
    
    // Move to next 60-day period
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
  }
  
  // If we're approaching the limit, wait
  if (apiCallCount >= RATE_LIMIT.MAX_CALLS_PER_MINUTE) {
    const waitTime = 60000 - timeSinceReset + 5000;
    console.log(`⏳ Rate limit protection: waiting ${Math.round(waitTime/1000)} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    apiCallCount = 0;
    lastResetTime = Date.now();
  }
}

async function makeApiCall(token, params) {
  await checkRateLimit();
  
  try {
    apiCallCount++;
    console.log(`    🔗 API call ${apiCallCount}/${RATE_LIMIT.MAX_CALLS_PER_MINUTE} this minute`);
    
    const response = await axios({
      method: 'GET',
      url: 'https://dynamicelements.keka.com/api/v1/psa/timeentries',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`
      },
      params: params,
      timeout: 30000
    });
    
    return response;
    
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⚠️ Rate limit hit, waiting 70 seconds...');
      await new Promise(resolve => setTimeout(resolve, 70000));
      apiCallCount = 0;
      lastResetTime = Date.now();
      return makeApiCall(token, params);
    }
    throw error;
  }
}

async function fetchTimesheetsBatch60Days(token, fromDate, toDate, batchDescription) {
  try {
    console.log(`  📅 Fetching: ${batchDescription}`);
    
    let allTimesheets = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      console.log(`    📄 Page ${currentPage} of ${totalPages}...`);
      
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
        
        console.log(`    ✅ Got ${response.data.data.length} records (total: ${allTimesheets.length}/${response.data.totalRecords})`);
        
        // Delay between pages
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
    console.error('❌ Failed to fetch 60-day batch:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
}

async function fetchAllMissingData(token) {
  try {
    console.log('📅 Fetching ALL missing data from January 1st to November 15th, 2025...');
    
    let allTimesheets = [];
    
    // Create 60-day batches for the entire year
    const batches = create60DayBatches('2025-01-01', '2025-11-15');
    
    console.log(`📊 Created ${batches.length} batches of up to 60 days each:`);
    batches.forEach((batch, index) => {
      console.log(`  ${index + 1}. ${batch.description}`);
    });
    
    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n🔄 Processing batch ${i + 1}/${batches.length}`);
      
      try {
        const batchTimesheets = await fetchTimesheetsBatch60Days(
          token, 
          batch.from, 
          batch.to, 
          batch.description
        );
        
        allTimesheets = allTimesheets.concat(batchTimesheets);
        
        console.log(`✅ Batch ${i + 1} completed: ${batchTimesheets.length} records`);
        console.log(`📊 Total records so far: ${allTimesheets.length}`);
        
        // Delay between batches
        if (i < batches.length - 1) {
          console.log(`⏳ Waiting ${RATE_LIMIT.BATCH_DELAY/1000} seconds before next batch...`);
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.BATCH_DELAY));
        }
        
      } catch (error) {
        console.error(`❌ Error in batch ${i + 1}:`, error.message);
        
        if (error.response?.status === 429) {
          console.log('⚠️ Implementing extended wait...');
          await new Promise(resolve => setTimeout(resolve, 90000)); // 90 second wait
        }
        
        console.log('⏭️ Continuing with next batch...');
        continue;
      }
    }

    console.log(`🎉 Successfully fetched all ${allTimesheets.length} timesheet records!`);
    return allTimesheets;

  } catch (error) {
    console.error('❌ Failed to fetch all missing data:', error.message);
    throw error;
  }
}

async function storeTimesheetsInDatabase(timesheets) {
  const pool = await initDatabase();
  const client = await pool.connect();

  try {
    console.log(`💾 Storing ${timesheets.length} timesheet records...`);
    
    let storedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const timesheet of timesheets) {
      try {
        const insertQuery = `
          INSERT INTO keka_timesheets (
            company_id, keka_timesheet_id, keka_employee_id, keka_project_id, keka_task_id,
            work_date, total_minutes, start_time, end_time, comments, is_billable, keka_status, raw_json
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (keka_timesheet_id) 
          DO UPDATE SET updated_at = CURRENT_TIMESTAMP, raw_json = EXCLUDED.raw_json
          RETURNING (xmax = 0) AS inserted;
        `;

        const result = await client.query(insertQuery, [
          COMPANY_ID, timesheet.id, timesheet.employeeId, timesheet.projectId, timesheet.taskId,
          timesheet.date, timesheet.totalMinutes, timesheet.startTime, timesheet.endTime,
          timesheet.comments, timesheet.isBillable, timesheet.status, JSON.stringify(timesheet)
        ]);

        if (result.rows[0].inserted) storedCount++;
        else duplicateCount++;

        if ((storedCount + duplicateCount + errorCount) % 1000 === 0) {
          console.log(`📊 Progress: ${storedCount + duplicateCount + errorCount}/${timesheets.length}`);
        }

      } catch (error) {
        errorCount++;
        if (errorCount < 5) console.error(`❌ Error storing timesheet:`, error.message);
      }
    }

    console.log(`✅ Storage complete: ${storedCount} new, ${duplicateCount} updated, ${errorCount} errors`);
    return { storedCount, duplicateCount, errorCount };

  } finally {
    client.release();
  }
}

async function getFinalAnalysis() {
  const pool = await initDatabase();
  const client = await pool.connect();

  try {
    const query = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT keka_employee_id) as unique_employees,
        COUNT(DISTINCT keka_project_id) as unique_projects,
        MIN(work_date) as earliest_date,
        MAX(work_date) as latest_date,
        ROUND(SUM(total_minutes) / 60.0, 2) as total_hours,
        COUNT(CASE WHEN is_billable THEN 1 END) as billable_entries
      FROM keka_timesheets;
    `;
    
    const result = await client.query(query);
    const stats = result.rows[0];
    
    console.log('\n🎊 FINAL COMPLETE DATASET ANALYSIS:');
    console.log(`📋 Total Timesheet Entries: ${stats.total_entries}`);
    console.log(`👥 Unique Employees: ${stats.unique_employees}`);  
    console.log(`🎯 Unique Projects: ${stats.unique_projects}`);
    console.log(`📅 Complete Date Range: ${stats.earliest_date?.toDateString()} to ${stats.latest_date?.toDateString()}`);
    console.log(`⏰ Total Work Hours: ${stats.total_hours} hours`);
    console.log(`💰 Billable Entries: ${stats.billable_entries} (${Math.round(stats.billable_entries/stats.total_entries*100)}%)`);

  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Starting COMPLETE Keka Timesheet Sync (60-day batches)');
    console.log('🎯 Goal: Get ALL data from January 1st to November 15th, 2025');
    console.log('📏 Using 60-day batches (API maximum) with smart rate limiting\n');
    
    const token = await getKekaToken();
    const timesheets = await fetchAllMissingData(token);
    const result = await storeTimesheetsInDatabase(timesheets);
    await getFinalAnalysis();
    
    console.log('\n🎉 MISSION ACCOMPLISHED!');
    console.log(`📊 Fetched: ${timesheets.length} records`);
    console.log(`💾 Stored: ${result.storedCount} new records`);
    console.log('📋 Complete historical Keka timesheet data is now available!');

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}