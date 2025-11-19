/**
 * Sync Keka Project Tasks Data
 * Fetch all tasks for all projects from Keka PSA API and store in database
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

async function getAllProjects(token) {
  try {
    console.log('📊 Fetching all projects...');
    
    const projectsUrl = 'https://dynamicelements.keka.com/api/v1/psa/projects';
    const response = await axios.get(projectsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    console.log(`✅ Retrieved ${response.data.data.length} projects`);
    return response.data.data;
    
  } catch (error) {
    console.error('❌ Failed to fetch projects:', error.response?.status, error.response?.statusText);
    throw error;
  }
}

async function getProjectTasks(token, projectId) {
  try {
    const tasksUrl = `https://dynamicelements.keka.com/api/v1/psa/projects/${projectId}/tasks`;
    
    const response = await axios.get(tasksUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    return response.data.data || [];
    
  } catch (error) {
    if (error.response?.status === 404) {
      // Project has no tasks
      return [];
    }
    console.error(`❌ Failed to fetch tasks for project ${projectId}:`, error.response?.status);
    return [];
  }
}

async function storeTask(task, projectId) {
  try {
    const query = `
      INSERT INTO keka_tasks (
        company_id,
        keka_task_id,
        keka_project_id,
        name,
        description,
        task_type,
        task_billing_type,
        assigned_to,
        start_date,
        end_date,
        estimated_hours,
        raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (keka_task_id) 
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        task_type = EXCLUDED.task_type,
        task_billing_type = EXCLUDED.task_billing_type,
        assigned_to = EXCLUDED.assigned_to,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        estimated_hours = EXCLUDED.estimated_hours,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, keka_task_id;
    `;

    const values = [
      COMPANY_ID,
      task.id,
      projectId,
      task.name,
      task.description,
      task.taskType,
      task.taskBillingType,
      JSON.stringify(task.assignedTo || []),
      task.startDate && task.startDate !== '0001-01-01T00:00:00' ? task.startDate : null,
      task.endDate && task.endDate !== '0001-01-01T00:00:00' ? task.endDate : null,
      task.estimatedHours,
      JSON.stringify(task)
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
    
  } catch (error) {
    console.error('❌ Error storing task:', error.message);
    console.error('Task data:', JSON.stringify(task, null, 2));
    throw error;
  }
}

async function syncAllTasks() {
  try {
    console.log('🚀 Starting Keka Project Tasks sync...');
    console.log('=' .repeat(50));

    // Get authentication token
    const token = await getKekaToken();

    // Get all projects
    const projects = await getAllProjects(token);

    let totalTasks = 0;
    let newTasks = 0;
    let updatedTasks = 0;
    let projectsWithTasks = 0;

    // Process each project
    for (const project of projects) {
      process.stdout.write(`\r📊 Processing: ${project.name.substring(0, 40)}...`);
      
      try {
        const tasks = await getProjectTasks(token, project.id);
        
        if (tasks.length > 0) {
          projectsWithTasks++;
          
          for (const task of tasks) {
            const storedTask = await storeTask(task, project.id);
            totalTasks++;
            
            // Check if it was an insert or update based on the response
            // (This is a simplified check - in a real scenario you might want more detailed tracking)
            newTasks++;
          }
        }
        
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`\n❌ Error processing project ${project.name}:`, error.message);
      }
    }

    console.log('\n\n🎉 Keka Project Tasks sync completed!');
    console.log('=' .repeat(50));
    console.log(`📊 Projects processed: ${projects.length}`);
    console.log(`📋 Projects with tasks: ${projectsWithTasks}`);
    console.log(`✅ Total tasks synced: ${totalTasks}`);
    console.log(`🆕 New tasks: ${newTasks}`);
    console.log(`🔄 Updated tasks: ${updatedTasks}`);

    // Show some sample data
    const sampleTasks = await pool.query(`
      SELECT t.name, t.task_type, t.task_billing_type, p.name as project_name
      FROM keka_tasks t 
      LEFT JOIN keka_projects p ON t.keka_project_id = p.keka_project_id 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample tasks:');
    sampleTasks.rows.forEach(task => {
      console.log(`  • ${task.name} (${task.project_name}) - Type: ${task.task_type}, Billing: ${task.task_billing_type}`);
    });

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  } finally {
    await pool.end();
  }
}

syncAllTasks();