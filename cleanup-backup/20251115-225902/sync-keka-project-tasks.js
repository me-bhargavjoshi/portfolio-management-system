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
const KEKA_BASE_URL = 'https://dynamicelements.keka.com/api/v1';
const kekaConfig = {
  clientId: 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: 'L0lrngtVKLGBMimNzYNk',
  apiKey: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  tokenUrl: 'https://login.keka.com/connect/token'
};

let accessToken = null;

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

async function fetchProjectsList() {
  try {
    console.log('📊 Fetching projects from database...');
    
    // Get projects from our database instead of API
    const result = await pool.query('SELECT keka_project_id, name FROM keka_projects ORDER BY name');
    const projects = result.rows.map(row => ({
      id: row.keka_project_id,
      name: row.name
    }));
    
    console.log(`✅ Found ${projects.length} projects to process from database`);
    return projects;
  } catch (error) {
    console.error('❌ Error fetching projects from database:', error.message);
    throw error;
  }
}

async function fetchProjectTasks(projectId) {
  try {
    const token = await getAccessToken();
    
    console.log(`  🔍 Calling API: /psa/projects/${projectId}/tasks`);
    const response = await axios.get(`${KEKA_BASE_URL}/psa/projects/${projectId}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    // Handle different response formats
    let tasks = response.data;
    if (tasks && tasks.data && Array.isArray(tasks.data)) {
      tasks = tasks.data;
    } else if (tasks && tasks.items && Array.isArray(tasks.items)) {
      tasks = tasks.items;
    } else if (!Array.isArray(tasks)) {
      tasks = [];
    }
    
    return tasks;
  } catch (error) {
    if (error.response?.status === 404) {
      // Project has no tasks
      return [];
    }
    console.error(`❌ Error fetching tasks for project ${projectId}:`, error.response?.status, error.response?.statusText);
    return [];
  }
}

async function saveTasksToDatabase(tasks) {
  if (!tasks || tasks.length === 0) return { inserted: 0, updated: 0 };

  const client = await pool.connect();
  let inserted = 0;
  let updated = 0;

  try {
    for (const task of tasks) {
      // Check if task already exists
      const existingTask = await client.query(
        'SELECT id FROM keka_project_tasks WHERE keka_task_id = $1',
        [task.id]
      );

      const taskData = {
        keka_task_id: task.id,
        keka_project_id: task.projectId,
        task_name: task.name || 'Unnamed Task',
        task_description: task.description || null,
        task_type: task.taskType || null,
        task_billing_type: task.taskBillingType || null,
        assigned_to: task.assignedTo ? JSON.stringify(task.assignedTo) : null,
        start_date: task.startDate ? new Date(task.startDate) : null,
        end_date: task.endDate ? new Date(task.endDate) : null,
        estimated_hours: task.estimatedHours || null,
        is_active: task.isActive !== false,
        custom_fields: task.customFields ? JSON.stringify(task.customFields) : null,
        raw_data: JSON.stringify(task)
      };

      if (existingTask.rows.length > 0) {
        // Update existing task
        await client.query(`
          UPDATE keka_project_tasks 
          SET keka_project_id = $2, task_name = $3, task_description = $4, 
              task_type = $5, task_billing_type = $6, assigned_to = $7,
              start_date = $8, end_date = $9, estimated_hours = $10,
              is_active = $11, custom_fields = $12, raw_data = $13,
              updated_at = CURRENT_TIMESTAMP
          WHERE keka_task_id = $1
        `, [
          taskData.keka_task_id, taskData.keka_project_id, taskData.task_name,
          taskData.task_description, taskData.task_type, taskData.task_billing_type,
          taskData.assigned_to, taskData.start_date, taskData.end_date,
          taskData.estimated_hours, taskData.is_active, taskData.custom_fields,
          taskData.raw_data
        ]);
        updated++;
      } else {
        // Insert new task
        await client.query(`
          INSERT INTO keka_project_tasks (
            keka_task_id, keka_project_id, task_name, task_description,
            task_type, task_billing_type, assigned_to, start_date, end_date,
            estimated_hours, is_active, custom_fields, raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          taskData.keka_task_id, taskData.keka_project_id, taskData.task_name,
          taskData.task_description, taskData.task_type, taskData.task_billing_type,
          taskData.assigned_to, taskData.start_date, taskData.end_date,
          taskData.estimated_hours, taskData.is_active, taskData.custom_fields,
          taskData.raw_data
        ]);
        inserted++;
      }
    }
  } catch (error) {
    console.error('❌ Error saving tasks to database:', error.message);
    throw error;
  } finally {
    client.release();
  }

  return { inserted, updated };
}

async function syncProjectTasks() {
  try {
    console.log('🚀 Starting Project Tasks sync...');
    console.log('=' .repeat(50));
    
    // Get all projects
    const projects = await fetchProjectsList();
    
    let totalTasks = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let projectsProcessed = 0;
    let projectsWithTasks = 0;
    
    for (const project of projects) {
      try {
        console.log(`📋 Processing project: ${project.name} (${project.id})`);
        
        // Fetch tasks for this project
        const tasks = await fetchProjectTasks(project.id);
        
        if (tasks.length > 0) {
          projectsWithTasks++;
          console.log(`  ✅ Found ${tasks.length} tasks`);
          
          // Save tasks to database
          const result = await saveTasksToDatabase(tasks);
          totalTasks += tasks.length;
          totalInserted += result.inserted;
          totalUpdated += result.updated;
          
          console.log(`  💾 Saved: ${result.inserted} new, ${result.updated} updated`);
        } else {
          console.log(`  ℹ️  No tasks found`);
        }
        
        projectsProcessed++;
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error processing project ${project.name}:`, error.message);
        // Continue with next project
      }
    }
    
    console.log('\n🎉 PROJECT TASKS SYNC COMPLETED!');
    console.log('=' .repeat(50));
    console.log(`📊 Projects processed: ${projectsProcessed}/${projects.length}`);
    console.log(`📋 Projects with tasks: ${projectsWithTasks}`);
    console.log(`📝 Total tasks found: ${totalTasks}`);
    console.log(`💾 Tasks inserted: ${totalInserted}`);
    console.log(`🔄 Tasks updated: ${totalUpdated}`);
    
  } catch (error) {
    console.error('❌ Fatal error in project tasks sync:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the sync
syncProjectTasks().catch(console.error);