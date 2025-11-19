/**
 * Sync Keka Task Time Entries Data - Historical sync from Jan 1, 2025
 * Fetch all task time entries with 60-day batches (API limitation)
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

const COMPANY_ID = '123e4567-e89b-12d3-a456-426614174000';
const pool = new Pool(dbConfig);

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_CALLS_PER_MINUTE: 40, // Conservative limit
  BATCH_DELAY: 15000,       // 15 second delay between batches
  PAGE_DELAY: 2000          // 2 second delay between pages
};

let apiCallCount = 0;
let lastResetTime = Date.now();

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
  
  // Check if we're approaching the limit
  if (apiCallCount >= RATE_LIMIT.MAX_CALLS_PER_MINUTE) {
    const waitTime = 60000 - (now - lastResetTime);
    console.log(`⏳ Rate limit reached. Waiting ${Math.ceil(waitTime/1000)} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    apiCallCount = 0;
    lastResetTime = Date.now();
  }
  
  apiCallCount++;
}

function create60DayBatches(start, end) {
  const batches = [];
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

async function getAllProjectsAndTasks(token) {
  try {
    console.log('📊 Fetching all projects and tasks...');
    
    const projectsUrl = 'https://dynamicelements.keka.com/api/v1/psa/projects';
    await checkRateLimit();
    
    const projectsResponse = await axios.get(projectsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const projects = projectsResponse.data.data;
    console.log(`✅ Retrieved ${projects.length} projects`);

    // Get all tasks for all projects
    const projectTaskPairs = [];
    
    for (const project of projects) {
      try {
        await checkRateLimit();
        
        const tasksUrl = `https://dynamicelements.keka.com/api/v1/psa/projects/${project.id}/tasks`;
        const tasksResponse = await axios.get(tasksUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        const tasks = tasksResponse.data.data || [];
        
        for (const task of tasks) {
          projectTaskPairs.push({
            projectId: project.id,
            projectName: project.name,
            taskId: task.id,
            taskName: task.name
          });
        }
        
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error(`❌ Error fetching tasks for project ${project.name}:`, error.response?.status);
        }
      }
    }

    console.log(`✅ Found ${projectTaskPairs.length} project-task pairs`);
    return projectTaskPairs;
    
  } catch (error) {
    console.error('❌ Failed to fetch projects and tasks:', error.message);
    throw error;
  }
}

async function getTaskTimeEntries(token, projectId, taskId, fromDate, toDate) {
  try {
    await checkRateLimit();
    
    const timeEntriesUrl = `https://dynamicelements.keka.com/api/v1/psa/projects/${projectId}/tasks/${taskId}/timeentries`;
    
    const response = await axios.get(timeEntriesUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      params: {
        from: fromDate,
        to: toDate
      }
    });

    return response.data.data || [];
    
  } catch (error) {
    if (error.response?.status === 404) {
      return []; // No time entries for this task
    }
    throw error;
  }
}

async function storeTaskTimeEntry(timeEntry) {
  try {
    const query = `
      INSERT INTO keka_task_timeentries (
        company_id,
        keka_timeentry_id,
        keka_task_id,
        keka_project_id,
        keka_employee_id,
        work_date,
        total_minutes,
        start_time,
        end_time,
        comments,
        is_billable,
        status,
        raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (keka_timeentry_id) 
      DO UPDATE SET
        total_minutes = EXCLUDED.total_minutes,
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        comments = EXCLUDED.comments,
        is_billable = EXCLUDED.is_billable,
        status = EXCLUDED.status,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, keka_timeentry_id;
    `;

    const values = [
      COMPANY_ID,
      timeEntry.id,
      timeEntry.taskId,
      timeEntry.projectId,
      timeEntry.employeeId,
      timeEntry.date,
      timeEntry.totalMinutes,
      timeEntry.startTime,
      timeEntry.endTime,
      timeEntry.comments,
      timeEntry.isBillable || false,
      timeEntry.status,
      JSON.stringify(timeEntry)
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
    
  } catch (error) {
    console.error('❌ Error storing task time entry:', error.message);
    throw error;
  }
}

async function syncTaskTimeEntriesBatch(token, projectTaskPairs, fromDate, toDate, batchDescription) {
  console.log(`\n📅 Processing batch: ${batchDescription}`);
  console.log(`  📊 Tasks to process: ${projectTaskPairs.length}`);
  
  let batchTimeEntries = 0;
  let processedTasks = 0;
  
  for (const pair of projectTaskPairs) {
    try {
      const timeEntries = await getTaskTimeEntries(token, pair.projectId, pair.taskId, fromDate, toDate);
      
      if (timeEntries.length > 0) {
        for (const timeEntry of timeEntries) {
          await storeTaskTimeEntry(timeEntry);
          batchTimeEntries++;
        }
      }
      
      processedTasks++;
      
      // Progress indicator
      if (processedTasks % 50 === 0) {
        process.stdout.write(`\r  📈 Progress: ${processedTasks}/${projectTaskPairs.length} tasks, ${batchTimeEntries} entries`);
      }
      
      // Small delay between tasks
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`\n❌ Error processing task ${pair.taskName}:`, error.message);
    }
  }
  
  console.log(`\n  ✅ Batch completed: ${batchTimeEntries} time entries processed`);
  return batchTimeEntries;
}

async function syncAllTaskTimeEntries() {
  try {
    console.log('🚀 Starting Keka Task Time Entries Historical Sync');
    console.log('📅 Date Range: January 1, 2025 to Present');
    console.log('=' .repeat(60));

    // Get authentication token
    const token = await getKekaToken();

    // Get all project-task pairs
    const projectTaskPairs = await getAllProjectsAndTasks(token);

    // Create 60-day batches from Jan 1, 2025 to now
    const startDate = new Date('2025-01-01T00:00:00.000Z');
    const endDate = new Date();
    const batches = create60DayBatches(startDate, endDate);

    console.log(`📊 Created ${batches.length} batches of 60-day periods`);

    let totalTimeEntries = 0;

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      console.log(`\n🔄 Processing batch ${i + 1}/${batches.length}`);
      
      const batchEntries = await syncTaskTimeEntriesBatch(
        token,
        projectTaskPairs,
        batch.from,
        batch.to,
        batch.description
      );
      
      totalTimeEntries += batchEntries;
      
      // Delay between batches to respect rate limits
      if (i < batches.length - 1) {
        console.log(`⏳ Waiting ${RATE_LIMIT.BATCH_DELAY/1000} seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.BATCH_DELAY));
      }
    }

    console.log('\n\n🎉 Keka Task Time Entries sync completed!');
    console.log('=' .repeat(60));
    console.log(`📊 Total batches processed: ${batches.length}`);
    console.log(`⏰ Total time entries synced: ${totalTimeEntries}`);

    // Show summary statistics
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT keka_employee_id) as unique_employees,
        COUNT(DISTINCT keka_project_id) as unique_projects,
        COUNT(DISTINCT keka_task_id) as unique_tasks,
        SUM(total_minutes)/60.0 as total_hours,
        MIN(work_date) as earliest_date,
        MAX(work_date) as latest_date
      FROM keka_task_timeentries
    `);

    const stats = summary.rows[0];
    console.log('\n📈 SUMMARY STATISTICS:');
    console.log(`  📊 Total entries: ${stats.total_entries}`);
    console.log(`  👥 Unique employees: ${stats.unique_employees}`);
    console.log(`  📋 Unique projects: ${stats.unique_projects}`);
    console.log(`  📝 Unique tasks: ${stats.unique_tasks}`);
    console.log(`  ⏱️  Total hours: ${parseFloat(stats.total_hours).toFixed(2)} hours`);
    console.log(`  📅 Date range: ${stats.earliest_date} to ${stats.latest_date}`);

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  } finally {
    await pool.end();
  }
}

syncAllTaskTimeEntries();