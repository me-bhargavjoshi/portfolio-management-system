/**
 * Sync Keka Projects Data
 * Fetch all projects from Keka PSA API and store in database
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

async function fetchKekaProjects(token, pageNumber = 1, pageSize = 50) {
  try {
    console.log(`📡 Fetching projects page ${pageNumber} (size: ${pageSize})...`);
    
    const response = await axios({
      method: 'GET',
      url: 'https://dynamicelements.keka.com/api/v1/psa/projects',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`
      },
      params: {
        pageNumber: pageNumber,
        pageSize: pageSize
      }
    });
    
    console.log(`✅ Page ${pageNumber} fetched: ${response.data.data?.length || 0} projects`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Failed to fetch projects page ${pageNumber}:`, error.response?.status, error.response?.statusText);
    throw error;
  }
}

function parseDate(dateString) {
  if (!dateString || dateString === '0001-01-01T00:00:00' || dateString === '0001-01-01T00:00:00Z') {
    return null;
  }
  try {
    const date = new Date(dateString);
    return date.getFullYear() > 1900 ? date.toISOString().split('T')[0] : null;
  } catch (error) {
    return null;
  }
}

async function storeProjectInDatabase(project, client_db) {
  try {
    const query = `
      INSERT INTO keka_projects (
        keka_project_id, keka_client_id, name, code, start_date, end_date,
        status, is_billable, billing_type, project_budget, budgeted_time,
        is_archived, project_managers, custom_attributes, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (company_id, keka_project_id) 
      DO UPDATE SET
        keka_client_id = EXCLUDED.keka_client_id,
        name = EXCLUDED.name,
        code = EXCLUDED.code,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        status = EXCLUDED.status,
        is_billable = EXCLUDED.is_billable,
        billing_type = EXCLUDED.billing_type,
        project_budget = EXCLUDED.project_budget,
        budgeted_time = EXCLUDED.budgeted_time,
        is_archived = EXCLUDED.is_archived,
        project_managers = EXCLUDED.project_managers,
        custom_attributes = EXCLUDED.custom_attributes,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id;
    `;
    
    const values = [
      project.id,                                           // keka_project_id
      project.clientId || null,                             // keka_client_id
      project.name || null,                                 // name
      project.code || null,                                 // code
      parseDate(project.startDate),                         // start_date
      parseDate(project.endDate),                           // end_date
      project.status || null,                               // status
      project.isBillable || false,                          // is_billable
      project.billingType || null,                          // billing_type
      project.projectBudget || null,                        // project_budget
      project.budgetedTime || null,                         // budgeted_time
      project.isArchived || false,                          // is_archived
      project.projectManagers ? JSON.stringify(project.projectManagers) : null, // project_managers
      project.customAttributes ? JSON.stringify(project.customAttributes) : null, // custom_attributes
      JSON.stringify(project)                               // raw_data
    ];
    
    const result = await client_db.query(query, values);
    return result.rows[0].id;
    
  } catch (error) {
    console.error('❌ Error storing project:', error);
    console.error('Project data:', JSON.stringify(project, null, 2));
    throw error;
  }
}

async function syncAllKekaProjects() {
  let dbClient;
  try {
    console.log('🚀 Starting Keka Projects sync...');
    
    // Get token and database connection
    const token = await getKekaToken();
    dbClient = await pool.connect();
    
    let allProjects = [];
    let currentPage = 1;
    let totalRecords = 0;
    let hasMorePages = true;
    
    // Fetch all pages
    while (hasMorePages) {
      const response = await fetchKekaProjects(token, currentPage, 50);
      
      if (currentPage === 1) {
        totalRecords = response.totalRecords;
        console.log(`📊 Total projects to sync: ${totalRecords}`);
      }
      
      if (response.data && response.data.length > 0) {
        allProjects.push(...response.data);
        
        console.log(`📥 Collected ${allProjects.length}/${totalRecords} projects`);
        
        hasMorePages = currentPage < response.totalPages;
        currentPage++;
        
        // Rate limiting
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        hasMorePages = false;
      }
    }
    
    console.log(`\n💾 Storing ${allProjects.length} projects in database...`);
    
    let storedCount = 0;
    let updatedCount = 0;
    
    for (const project of allProjects) {
      try {
        // Check if project already exists
        const existsQuery = 'SELECT id FROM keka_projects WHERE keka_project_id = $1';
        const existsResult = await dbClient.query(existsQuery, [project.id]);
        
        const isUpdate = existsResult.rows.length > 0;
        
        await storeProjectInDatabase(project, dbClient);
        
        if (isUpdate) {
          updatedCount++;
        } else {
          storedCount++;
        }
        
        if ((storedCount + updatedCount) % 20 === 0) {
          console.log(`  📊 Progress: ${storedCount + updatedCount}/${allProjects.length} projects processed`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to store project ${project.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Keka Projects sync completed!');
    console.log(`📊 Results:`);
    console.log(`  ✅ New projects stored: ${storedCount}`);
    console.log(`  🔄 Existing projects updated: ${updatedCount}`);
    console.log(`  📋 Total projects processed: ${storedCount + updatedCount}`);
    
    // Get final count
    const countResult = await dbClient.query('SELECT COUNT(*) as count FROM keka_projects');
    console.log(`  🗄️  Total projects in database: ${countResult.rows[0].count}`);
    
    // Show statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN is_billable THEN 1 END) as billable_projects,
        COUNT(CASE WHEN is_archived THEN 1 END) as archived_projects,
        COUNT(CASE WHEN status = 1 THEN 1 END) as active_projects,
        COUNT(DISTINCT keka_client_id) as unique_clients
      FROM keka_projects
    `;
    
    const statsResult = await dbClient.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log('\n📊 Project Statistics:');
    console.log(`  📂 Total projects: ${stats.total_projects}`);
    console.log(`  💰 Billable projects: ${stats.billable_projects}`);
    console.log(`  📦 Archived projects: ${stats.archived_projects}`);
    console.log(`  ✅ Active projects: ${stats.active_projects}`);
    console.log(`  👥 Unique clients: ${stats.unique_clients}`);
    
    // Show sample of stored projects
    const sampleResult = await dbClient.query(`
      SELECT p.name, p.code, c.name as client_name, p.is_billable, p.status,
             CASE WHEN p.start_date IS NOT NULL THEN p.start_date::text ELSE 'No start date' END as start_date
      FROM keka_projects p
      LEFT JOIN keka_clients c ON p.keka_client_id = c.keka_client_id
      ORDER BY p.name 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample projects stored:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.name} (${row.code})`);
      console.log(`     Client: ${row.client_name || 'Unknown'} | Billable: ${row.is_billable ? 'Yes' : 'No'} | Start: ${row.start_date}`);
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    if (dbClient) {
      dbClient.release();
    }
  }
}

// Run sync
syncAllKekaProjects()
  .then(() => {
    console.log('\n✅ Keka Projects sync script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });