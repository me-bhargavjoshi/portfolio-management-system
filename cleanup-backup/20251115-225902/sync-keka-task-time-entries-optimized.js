const axios = require('axios');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'portfolio_user',
  host: 'localhost',
  database: 'portfolio_management',
  password: 'portfolio_password',
  port: 5432,
});

// Keka API configuration
const kekaConfig = {
  clientId: 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: 'L0lrngtVKLGBMimNzYNk',
  apiKey: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  tokenUrl: 'https://login.keka.com/connect/token'
};

const KEKA_BASE_URL = 'https://dynamicelements.keka.com/api/v1';

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_CALLS_PER_MINUTE: 40, // Conservative limit
  BATCH_DELAY: 15000,       // 15 second delay between batches
  PAGE_DELAY: 2000          // 2 second delay between API calls
};

let accessToken = null;
let apiCallCount = 0;
let lastResetTime = Date.now();

async function getAccessToken() {
  if (accessToken) return accessToken;
  
  try {
    console.log('🔑 Getting access token...');
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
    
    accessToken = response.data.access_token;
    console.log('✅ Access token obtained');
    return accessToken;
  } catch (error) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    throw error;
  }
}

async function checkRateLimit() {
  const now = Date.now();
  
  // Reset counter every minute
  if (now - lastResetTime > 60000) {
    apiCallCount = 0;
    lastResetTime = now;
  }
  
  // Wait if we're approaching the limit
  if (apiCallCount >= RATE_LIMIT.MAX_CALLS_PER_MINUTE) {
    const waitTime = 60000 - (now - lastResetTime);
    if (waitTime > 0) {
      console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      apiCallCount = 0;
      lastResetTime = Date.now();
    }
  }
  
  apiCallCount++;
}

// Create 60-day batches from January 1, 2025 to November 15, 2025
function create60DayBatches() {
  const batches = [];
  const startDate = new Date('2025-01-01T00:00:00.000Z');
  const endDate = new Date('2025-11-15T23:59:59.999Z');
  
  let currentStart = new Date(startDate);
  
  while (currentStart < endDate) {
    let currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 59); // 60 days batch
    
    if (currentEnd > endDate) {
      currentEnd = new Date(endDate);
    }
    
    batches.push({
      from: currentStart.toISOString(),
      to: currentEnd.toISOString(),
      description: `${currentStart.toISOString().split('T')[0]} to ${currentEnd.toISOString().split('T')[0]}`
    });
    
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }
  
  return batches;
}

async function fetchTaskTimeEntriesBatch(fromDate, toDate, pageNumber = 1) {
  try {
    const token = await getAccessToken();
    await checkRateLimit();
    
    const response = await axios.get(`${KEKA_BASE_URL}/psa/timeentries`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        from: fromDate,
        to: toDate,
        pageNumber: pageNumber,
        pageSize: 100
      }
    });
    
    return {
      data: response.data.data || response.data || [],
      pagination: {
        totalPages: response.data.totalPages || 1,
        totalRecords: response.data.totalRecords || 0,
        currentPage: response.data.pageNumber || pageNumber,
        hasNextPage: response.data.nextPage !== null
      }
    };
  } catch (error) {
    console.error(`❌ Error fetching task time entries batch:`, error.response?.status, error.response?.statusText);
    return { data: [], pagination: { totalPages: 1, totalRecords: 0, currentPage: pageNumber, hasNextPage: false } };
  }
}

async function saveTaskTimeEntriesToDatabase(timeEntries) {
  if (!timeEntries || timeEntries.length === 0) return { inserted: 0, updated: 0 };

  const client = await pool.connect();
  let inserted = 0;
  let updated = 0;

  try {
    for (const entry of timeEntries) {
      // Check if time entry already exists
      const existingEntry = await client.query(
        'SELECT id FROM keka_task_time_entries WHERE keka_time_entry_id = $1',
        [entry.id]
      );

      const entryData = {
        keka_time_entry_id: entry.id,
        keka_employee_id: entry.employeeId,
        keka_project_id: entry.projectId,
        keka_task_id: entry.taskId,
        work_date: entry.date ? new Date(entry.date) : null,
        total_minutes: entry.totalMinutes || 0,
        start_time: entry.startTime || null,
        end_time: entry.endTime || null,
        comments: entry.comments || null,
        is_billable: entry.isBillable === true,
        status: entry.status?.toString() || null,
        approval_status: entry.approvalStatus || null,
        submitted_date: entry.submittedDate ? new Date(entry.submittedDate) : null,
        approved_date: entry.approvedDate ? new Date(entry.approvedDate) : null,
        custom_attributes: entry.customAttributes ? JSON.stringify(entry.customAttributes) : null,
        raw_data: JSON.stringify(entry)
      };

      if (existingEntry.rows.length > 0) {
        // Update existing entry
        await client.query(`
          UPDATE keka_task_time_entries 
          SET keka_employee_id = $2, keka_project_id = $3, keka_task_id = $4,
              work_date = $5, total_minutes = $6, start_time = $7, end_time = $8,
              comments = $9, is_billable = $10, status = $11, approval_status = $12,
              submitted_date = $13, approved_date = $14, custom_attributes = $15,
              raw_data = $16, updated_at = CURRENT_TIMESTAMP
          WHERE keka_time_entry_id = $1
        `, [
          entryData.keka_time_entry_id, entryData.keka_employee_id, entryData.keka_project_id,
          entryData.keka_task_id, entryData.work_date, entryData.total_minutes,
          entryData.start_time, entryData.end_time, entryData.comments,
          entryData.is_billable, entryData.status, entryData.approval_status,
          entryData.submitted_date, entryData.approved_date, entryData.custom_attributes,
          entryData.raw_data
        ]);
        updated++;
      } else {
        // Insert new entry
        await client.query(`
          INSERT INTO keka_task_time_entries (
            keka_time_entry_id, keka_employee_id, keka_project_id, keka_task_id,
            work_date, total_minutes, start_time, end_time, comments,
            is_billable, status, approval_status, submitted_date, approved_date,
            custom_attributes, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        `, [
          entryData.keka_time_entry_id, entryData.keka_employee_id, entryData.keka_project_id,
          entryData.keka_task_id, entryData.work_date, entryData.total_minutes,
          entryData.start_time, entryData.end_time, entryData.comments,
          entryData.is_billable, entryData.status, entryData.approval_status,
          entryData.submitted_date, entryData.approved_date, entryData.custom_attributes,
          entryData.raw_data
        ]);
        inserted++;
      }
    }
  } catch (error) {
    console.error('❌ Error saving task time entries to database:', error.message);
    throw error;
  } finally {
    client.release();
  }

  return { inserted, updated };
}

async function syncTaskTimeEntriesOptimized() {
  try {
    console.log('🚀 Starting OPTIMIZED Task Time Entries sync...');
    console.log('⚡ Using direct /psa/timeentries endpoint with date batching');
    console.log('⏰ Fetching historical data from January 1, 2025 to November 15, 2025');
    console.log('=' .repeat(75));
    
    // Create date batches
    const batches = create60DayBatches();
    console.log(`📅 Created ${batches.length} date batches (60-day periods)`);
    
    let totalTimeEntries = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalApiCalls = 0;
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      console.log(`\n📅 Processing batch ${batchIndex + 1}/${batches.length}: ${batch.description}`);
      
      let batchTotalEntries = 0;
      let batchTotalInserted = 0;
      let batchTotalUpdated = 0;
      let pageNumber = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        try {
          console.log(`   📄 Fetching page ${pageNumber}...`);
          
          const result = await fetchTaskTimeEntriesBatch(batch.from, batch.to, pageNumber);
          totalApiCalls++;
          
          if (result.data.length > 0) {
            console.log(`      ✅ Found ${result.data.length} time entries`);
            
            // Save to database
            const saveResult = await saveTaskTimeEntriesToDatabase(result.data);
            batchTotalEntries += result.data.length;
            batchTotalInserted += saveResult.inserted;
            batchTotalUpdated += saveResult.updated;
            
            console.log(`      💾 Saved: ${saveResult.inserted} new, ${saveResult.updated} updated`);
          } else {
            console.log(`      ℹ️  No time entries found`);
          }
          
          // Check if there are more pages
          hasMorePages = result.pagination.hasNextPage && pageNumber < result.pagination.totalPages;
          
          if (hasMorePages) {
            pageNumber++;
            console.log(`      📄 Total pages: ${result.pagination.totalPages}, continuing to page ${pageNumber}`);
            // Small delay between pages
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.PAGE_DELAY));
          } else {
            console.log(`      ✅ Batch completed - ${result.pagination.totalRecords} total records available`);
          }
          
        } catch (error) {
          console.error(`      ❌ Error processing page ${pageNumber}: ${error.message}`);
          hasMorePages = false; // Stop processing this batch
        }
      }
      
      console.log(`   🎯 Batch summary: ${batchTotalEntries} entries (${batchTotalInserted} new, ${batchTotalUpdated} updated)`);
      
      totalTimeEntries += batchTotalEntries;
      totalInserted += batchTotalInserted;
      totalUpdated += batchTotalUpdated;
      
      // Delay between batches to respect rate limits
      if (batchIndex < batches.length - 1) {
        console.log(`   ⏳ Pausing ${RATE_LIMIT.BATCH_DELAY / 1000}s before next batch...`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.BATCH_DELAY));
      }
    }
    
    console.log('\n🎉 OPTIMIZED TASK TIME ENTRIES SYNC COMPLETED!');
    console.log('=' .repeat(75));
    console.log(`📅 Date batches processed: ${batches.length}`);
    console.log(`📡 Total API calls made: ${totalApiCalls}`);
    console.log(`⏰ Total time entries found: ${totalTimeEntries}`);
    console.log(`💾 Time entries inserted: ${totalInserted}`);
    console.log(`🔄 Time entries updated: ${totalUpdated}`);
    console.log(`⚡ Performance: ~${Math.round(totalTimeEntries / totalApiCalls)} entries per API call`);
    
  } catch (error) {
    console.error('❌ Fatal error in optimized task time entries sync:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the optimized sync
syncTaskTimeEntriesOptimized().catch(console.error);