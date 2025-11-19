/**
 * Keka Timesheet Data Sync Script
 * Fetches timesheet data from Keka API and stores it in a well-structured database format
 */

const axios = require('axios');

// Keka OAuth2 configuration
const kekaConfig = {
  clientId: 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: 'L0lrngtVKLGBMimNzYNk',
  apiKey: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  tokenUrl: 'https://login.keka.com/connect/token'
};

// Use the existing database configuration
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

async function initDatabase() {
  const pool = new pg.Pool(dbConfig);
  return pool;
}

// Default company ID for Dynamic Elements (you can make this configurable)
const COMPANY_ID = '123e4567-e89b-12d3-a456-426614174000'; // Replace with actual company ID

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

async function fetchKekaTimesheets(token, startDate = '2025-01-01', endDate = '2025-11-15') {
  try {
    console.log(`📅 Fetching timesheets from ${startDate} to ${endDate}...`);
    
    let allTimesheets = [];
    let currentPage = 1;
    let totalPages = 1;

    do {
      console.log(`📄 Fetching page ${currentPage} of ${totalPages}...`);
      
      const response = await axios({
        method: 'GET',
        url: 'https://dynamicelements.keka.com/api/v1/psa/timeentries',
        headers: {
          'accept': 'application/json',
          'authorization': `Bearer ${token}`
        },
        params: {
          startDate: startDate,
          endDate: endDate,
          pageNumber: currentPage,
          pageSize: 100
        }
      });

      if (response.data.succeeded) {
        allTimesheets = allTimesheets.concat(response.data.data);
        totalPages = response.data.totalPages;
        currentPage++;
        
        console.log(`✅ Fetched ${response.data.data.length} records from page ${currentPage - 1}`);
        console.log(`📊 Total records so far: ${allTimesheets.length} of ${response.data.totalRecords}`);
      } else {
        throw new Error(`API returned error: ${response.data.message}`);
      }

      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));

    } while (currentPage <= totalPages);

    console.log(`🎉 Successfully fetched all ${allTimesheets.length} timesheet records!`);
    return allTimesheets;

  } catch (error) {
    console.error('❌ Failed to fetch timesheets:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
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
        // Convert minutes to hours for storage
        const hoursWorked = timesheet.totalMinutes / 60;
        
        // Insert into keka_timesheet_raw table
        const insertRawQuery = `
          INSERT INTO keka_timesheet_raw (
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
            status,
            raw_json_data,
            api_endpoint,
            processing_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (company_id, keka_timesheet_id) 
          DO UPDATE SET
            updated_at = CURRENT_TIMESTAMP,
            raw_json_data = EXCLUDED.raw_json_data
          RETURNING id, (xmax = 0) AS inserted;
        `;

        const rawResult = await client.query(insertRawQuery, [
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
          JSON.stringify(timesheet),
          'https://dynamicelements.keka.com/api/v1/psa/timeentries',
          'pending'
        ]);

        const wasInserted = rawResult.rows[0].inserted;
        const rawRecordId = rawResult.rows[0].id;

        if (wasInserted) {
          storedCount++;
          
          // Also store in actual_efforts table for immediate use
          const insertEffortQuery = `
            INSERT INTO actual_efforts (
              company_id,
              project_id,
              employee_id,
              effort_date,
              hours_worked,
              task_description,
              source,
              external_timesheet_id,
              keka_timesheet_id,
              is_billable,
              keka_status,
              raw_record_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (company_id, employee_id, effort_date, source, external_timesheet_id)
            DO UPDATE SET
              hours_worked = EXCLUDED.hours_worked,
              task_description = EXCLUDED.task_description,
              is_billable = EXCLUDED.is_billable,
              keka_status = EXCLUDED.keka_status,
              updated_at = CURRENT_TIMESTAMP;
          `;

          // For now, we'll use NULL for project_id and employee_id since we need mapping
          // This will be resolved in a separate mapping process
          await client.query(insertEffortQuery, [
            COMPANY_ID,
            null, // project_id - will be mapped later
            null, // employee_id - will be mapped later  
            timesheet.date,
            hoursWorked,
            timesheet.comments || 'Keka timesheet entry',
            'keka',
            timesheet.id,
            timesheet.id,
            timesheet.isBillable,
            timesheet.status,
            rawRecordId
          ]);

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
    console.log(`  🔄 Duplicates: ${duplicateCount} records`);
    console.log(`  ❌ Errors: ${errorCount} records`);

    return { storedCount, duplicateCount, errorCount };

  } finally {
    client.release();
  }
}

async function syncKekaProjectMappings(timesheets) {
  const pool = await initDatabase();
  const client = await pool.connect();

  try {
    console.log('🔗 Creating project and task mappings...');
    
    // Extract unique project-task combinations
    const projectTaskCombos = new Map();
    
    timesheets.forEach(timesheet => {
      const key = `${timesheet.projectId}-${timesheet.taskId}`;
      if (!projectTaskCombos.has(key)) {
        projectTaskCombos.set(key, {
          projectId: timesheet.projectId,
          taskId: timesheet.taskId
        });
      }
    });

    console.log(`📊 Found ${projectTaskCombos.size} unique project-task combinations`);

    let mappingCount = 0;

    for (const [key, combo] of projectTaskCombos) {
      try {
        const insertMappingQuery = `
          INSERT INTO keka_project_mapping (
            company_id,
            keka_project_id,
            keka_task_id,
            mapping_status
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT (company_id, keka_project_id, keka_task_id) 
          DO NOTHING
          RETURNING id;
        `;

        const result = await client.query(insertMappingQuery, [
          COMPANY_ID,
          combo.projectId,
          combo.taskId,
          'unmapped'
        ]);

        if (result.rows.length > 0) {
          mappingCount++;
        }

      } catch (error) {
        console.error(`❌ Error creating mapping for ${key}:`, error.message);
      }
    }

    console.log(`✅ Created ${mappingCount} new project mappings`);

  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Starting Keka Timesheet Sync...');
    console.log('📅 Date range: January 1, 2025 to November 15, 2025');
    
    // Step 1: Get authentication token
    const token = await getKekaToken();
    
    // Step 2: Fetch all timesheet data
    const timesheets = await fetchKekaTimesheets(token, '2025-01-01', '2025-11-15');
    
    // Step 3: Store raw data in database
    const storageResult = await storeTimesheetsInDatabase(timesheets);
    
    // Step 4: Create project mappings
    await syncKekaProjectMappings(timesheets);
    
    console.log('🎉 Keka Timesheet Sync completed successfully!');
    console.log('📋 Summary:');
    console.log(`  📊 Total records fetched: ${timesheets.length}`);
    console.log(`  💾 New records stored: ${storageResult.storedCount}`);
    console.log(`  🔄 Duplicate records: ${storageResult.duplicateCount}`);
    console.log(`  ❌ Error records: ${storageResult.errorCount}`);
    
    console.log('\n📝 Next steps:');
    console.log('  1. Map Keka employee IDs to your employee records');
    console.log('  2. Map Keka project/task IDs to your project records');
    console.log('  3. Run data processing to populate actual_efforts with proper references');

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
  fetchKekaTimesheets,
  storeTimesheetsInDatabase,
  syncKekaProjectMappings
};