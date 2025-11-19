const { Pool } = require('pg');

const pool = new Pool({
  user: 'portfolio_user',
  host: 'localhost',
  database: 'portfolio_management',
  password: 'portfolio_password',
  port: 5432,
});

const COMPANY_ID = '550e8400-e29b-41d4-a716-446655440000'; // Default company ID

async function syncEmployeeMappings() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 SYNCING EMPLOYEE MAPPINGS');
    console.log('=' .repeat(50));
    
    // Get all Keka employees
    const kekaEmployees = await client.query(`
      SELECT keka_employee_id, display_name, first_name, last_name, email, 
             department, job_title, employment_status
      FROM keka_employees
      WHERE employment_status = 'Active' OR employment_status IS NULL
    `);
    
    console.log(`📊 Found ${kekaEmployees.rows.length} active Keka employees`);
    
    let updated = 0;
    let inserted = 0;
    let skipped = 0;
    
    for (const kekaEmp of kekaEmployees.rows) {
      try {
        // Try to find existing employee by email first, then by Keka ID
        let existingEmployee = await client.query(`
          SELECT id, keka_employee_id FROM employees 
          WHERE email = $1 OR keka_employee_id = $2
        `, [kekaEmp.email, kekaEmp.keka_employee_id]);
        
        const empData = {
          keka_employee_id: kekaEmp.keka_employee_id,
          first_name: kekaEmp.first_name || kekaEmp.display_name?.split(' ')[0] || 'Unknown',
          last_name: kekaEmp.last_name || kekaEmp.display_name?.split(' ').slice(1).join(' ') || '',
          email: kekaEmp.email,
          department: kekaEmp.department || 'Unassigned',
          designation: kekaEmp.job_title || 'Employee',
          is_active: kekaEmp.employment_status !== 'Inactive'
        };
        
        if (existingEmployee.rows.length > 0) {
          // Update existing employee
          const empId = existingEmployee.rows[0].id;
          await client.query(`
            UPDATE employees 
            SET keka_employee_id = $1, first_name = $2, last_name = $3, 
                email = $4, department = $5, designation = $6, 
                is_active = $7, updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
          `, [
            empData.keka_employee_id, empData.first_name, empData.last_name,
            empData.email, empData.department, empData.designation,
            empData.is_active, empId
          ]);
          updated++;
          console.log(`  ✅ Updated: ${empData.first_name} ${empData.last_name} (${empData.email})`);
        } else {
          // Insert new employee
          await client.query(`
            INSERT INTO employees (
              company_id, keka_employee_id, first_name, last_name, email,
              department, designation, is_active, billable_rate, cost_per_hour
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            COMPANY_ID, empData.keka_employee_id, empData.first_name, empData.last_name,
            empData.email, empData.department, empData.designation, empData.is_active,
            100.00, 50.00 // Default rates
          ]);
          inserted++;
          console.log(`  ➕ Inserted: ${empData.first_name} ${empData.last_name} (${empData.email})`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${kekaEmp.display_name}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\\n📊 Employee sync results:`);
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ➕ Inserted: ${inserted}`);
    console.log(`  ❌ Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Fatal error in employee sync:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function syncClientMappings() {
  const client = await pool.connect();
  
  try {
    console.log('\\n🔄 SYNCING CLIENT MAPPINGS');
    console.log('=' .repeat(50));
    
    // Get all Keka clients
    const kekaClients = await client.query(`
      SELECT keka_client_id, name, billing_name, code, description, billing_address
      FROM keka_clients
    `);
    
    console.log(`📊 Found ${kekaClients.rows.length} Keka clients`);
    
    let updated = 0;
    let inserted = 0;
    let skipped = 0;
    
    for (const kekaClient of kekaClients.rows) {
      try {
        // Try to find existing client by name or Keka ID
        let existingClient = await client.query(`
          SELECT id, keka_id FROM clients 
          WHERE name = $1 OR keka_id = $2
        `, [kekaClient.name, kekaClient.keka_client_id]);
        
        const clientData = {
          keka_id: kekaClient.keka_client_id,
          name: kekaClient.name || kekaClient.billing_name || 'Unknown Client',
          address: kekaClient.billing_address || kekaClient.description,
          is_active: true
        };
        
        if (existingClient.rows.length > 0) {
          // Update existing client
          const clientId = existingClient.rows[0].id;
          await client.query(`
            UPDATE clients 
            SET keka_id = $1, name = $2, address = $3, 
                is_active = $4, updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
          `, [
            clientData.keka_id, clientData.name, clientData.address,
            clientData.is_active, clientId
          ]);
          updated++;
          console.log(`  ✅ Updated: ${clientData.name}`);
        } else {
          // Insert new client
          await client.query(`
            INSERT INTO clients (
              company_id, keka_id, name, address, is_active
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            COMPANY_ID, clientData.keka_id, clientData.name, 
            clientData.address, clientData.is_active
          ]);
          inserted++;
          console.log(`  ➕ Inserted: ${clientData.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${kekaClient.name}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\\n📊 Client sync results:`);
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ➕ Inserted: ${inserted}`);
    console.log(`  ❌ Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Fatal error in client sync:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function syncProjectMappings() {
  const client = await pool.connect();
  
  try {
    console.log('\\n🔄 SYNCING PROJECT MAPPINGS');
    console.log('=' .repeat(50));
    
    // Get all Keka projects with client info
    const kekaProjects = await client.query(`
      SELECT p.keka_project_id, p.name, p.code, p.start_date, p.end_date,
             p.status, p.is_billable, p.billing_type, p.project_budget,
             p.budgeted_time, p.keka_client_id, c.id as portfolio_client_id
      FROM keka_projects p
      LEFT JOIN clients c ON c.keka_id = p.keka_client_id
    `);
    
    console.log(`📊 Found ${kekaProjects.rows.length} Keka projects`);
    
    let updated = 0;
    let inserted = 0;
    let skipped = 0;
    
    for (const kekaProject of kekaProjects.rows) {
      try {
        // Try to find existing project by name or Keka ID
        let existingProject = await client.query(`
          SELECT id, keka_id FROM projects 
          WHERE name = $1 OR keka_id = $2
        `, [kekaProject.name, kekaProject.keka_project_id]);
        
        const projectData = {
          keka_id: kekaProject.keka_project_id,
          keka_client_id: kekaProject.keka_client_id,
          account_id: kekaProject.portfolio_client_id, // Link to portfolio client
          name: kekaProject.name || 'Unknown Project',
          start_date: kekaProject.start_date,
          end_date: kekaProject.end_date && kekaProject.end_date !== '0001-01-01T00:00:00' ? kekaProject.end_date : null,
          status: kekaProject.status === 0 ? 'Active' : kekaProject.status === 1 ? 'Completed' : 'On Hold',
          budget: kekaProject.project_budget,
          estimated_hours: kekaProject.budgeted_time,
          is_billable: kekaProject.is_billable || false,
          billing_type: kekaProject.billing_type?.toString() || 'hourly',
          is_active: !kekaProject.is_archived
        };
        
        if (existingProject.rows.length > 0) {
          // Update existing project
          const projectId = existingProject.rows[0].id;
          await client.query(`
            UPDATE projects 
            SET keka_id = $1, keka_client_id = $2, account_id = $3, name = $4,
                start_date = $5, end_date = $6, status = $7, budget = $8,
                estimated_hours = $9, is_billable = $10, billing_type = $11,
                is_active = $12, updated_at = CURRENT_TIMESTAMP
            WHERE id = $13
          `, [
            projectData.keka_id, projectData.keka_client_id, projectData.account_id,
            projectData.name, projectData.start_date, projectData.end_date,
            projectData.status, projectData.budget, projectData.estimated_hours,
            projectData.is_billable, projectData.billing_type, projectData.is_active,
            projectId
          ]);
          updated++;
          console.log(`  ✅ Updated: ${projectData.name}`);
        } else {
          // Insert new project
          await client.query(`
            INSERT INTO projects (
              company_id, keka_id, keka_client_id, account_id, name,
              start_date, end_date, status, budget, estimated_hours,
              is_billable, billing_type, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `, [
            COMPANY_ID, projectData.keka_id, projectData.keka_client_id,
            projectData.account_id, projectData.name, projectData.start_date,
            projectData.end_date, projectData.status, projectData.budget,
            projectData.estimated_hours, projectData.is_billable,
            projectData.billing_type, projectData.is_active
          ]);
          inserted++;
          console.log(`  ➕ Inserted: ${projectData.name}`);
        }
      } catch (error) {
        console.error(`  ❌ Error processing ${kekaProject.name}:`, error.message);
        skipped++;
      }
    }
    
    console.log(`\\n📊 Project sync results:`);
    console.log(`  ✅ Updated: ${updated}`);
    console.log(`  ➕ Inserted: ${inserted}`);
    console.log(`  ❌ Skipped: ${skipped}`);
    
  } catch (error) {
    console.error('❌ Fatal error in project sync:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function runCompleteMapping() {
  try {
    console.log('🚀 STARTING COMPLETE ID MAPPING PROCESS');
    console.log('⏰ This will sync all Keka data with Portfolio Management system');
    console.log('=' .repeat(70));
    
    await syncEmployeeMappings();
    await syncClientMappings();
    await syncProjectMappings();
    
    console.log('\\n🎉 COMPLETE ID MAPPING FINISHED!');
    console.log('=' .repeat(70));
    console.log('✅ All Keka entities have been mapped to Portfolio Management system');
    console.log('🚀 Ready for timesheet data integration!');
    
  } catch (error) {
    console.error('❌ Fatal error in complete mapping:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the complete mapping
runCompleteMapping().catch(console.error);