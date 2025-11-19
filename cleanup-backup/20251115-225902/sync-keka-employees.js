/**
 * Sync Keka Employees Data
 * Fetch all employees from Keka HRIS API and store in database
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

async function fetchKekaEmployees(token, pageNumber = 1, pageSize = 50) {
  try {
    console.log(`📡 Fetching employees page ${pageNumber} (size: ${pageSize})...`);
    
    const response = await axios({
      method: 'GET',
      url: 'https://dynamicelements.keka.com/api/v1/hris/employees',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`
      },
      params: {
        pageNumber: pageNumber,
        pageSize: pageSize
      }
    });
    
    console.log(`✅ Page ${pageNumber} fetched: ${response.data.data?.length || 0} employees`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Failed to fetch employees page ${pageNumber}:`, error.response?.status, error.response?.statusText);
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

function extractDepartmentFromGroups(groups) {
  if (!groups || !Array.isArray(groups)) {
    return null;
  }
  
  // Look for department in groups
  // groupType 1 seems to be department, groupType 2 is practice/function
  const departmentGroup = groups.find(group => 
    group.groupType === 1 || group.groupType === 2
  );
  
  if (departmentGroup) {
    return departmentGroup.title;
  }
  
  // Fallback - look for anything with "department" or similar in the title
  const fallbackGroup = groups.find(group => 
    group.title && (
      group.title.toLowerCase().includes('department') ||
      group.title.toLowerCase().includes('dept') ||
      group.title.toLowerCase().includes('practice')
    )
  );
  
  return fallbackGroup ? fallbackGroup.title : null;
}

async function storeEmployeeInDatabase(employee, client_db) {
  try {
    const query = `
      INSERT INTO keka_employees (
        keka_employee_id, employee_number, first_name, middle_name, last_name,
        display_name, email, personal_email, job_title, secondary_job_title,
        department, location, city, country_code, reports_to, l2_manager,
        dotted_line_manager, employment_status, account_status, worker_type,
        time_type, joining_date, exit_date, resignation_submitted_date,
        probation_end_date, phone_work, phone_mobile, phone_home,
        date_of_birth, gender, marital_status, marriage_date, blood_group,
        nationality, current_address, permanent_address, education_details,
        experience_details, custom_fields, groups, band_info, pay_grade_info, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43)
      ON CONFLICT (company_id, keka_employee_id) 
      DO UPDATE SET
        employee_number = EXCLUDED.employee_number,
        first_name = EXCLUDED.first_name,
        middle_name = EXCLUDED.middle_name,
        last_name = EXCLUDED.last_name,
        display_name = EXCLUDED.display_name,
        email = EXCLUDED.email,
        personal_email = EXCLUDED.personal_email,
        job_title = EXCLUDED.job_title,
        secondary_job_title = EXCLUDED.secondary_job_title,
        department = EXCLUDED.department,
        location = EXCLUDED.location,
        city = EXCLUDED.city,
        country_code = EXCLUDED.country_code,
        reports_to = EXCLUDED.reports_to,
        l2_manager = EXCLUDED.l2_manager,
        dotted_line_manager = EXCLUDED.dotted_line_manager,
        employment_status = EXCLUDED.employment_status,
        account_status = EXCLUDED.account_status,
        worker_type = EXCLUDED.worker_type,
        time_type = EXCLUDED.time_type,
        joining_date = EXCLUDED.joining_date,
        exit_date = EXCLUDED.exit_date,
        resignation_submitted_date = EXCLUDED.resignation_submitted_date,
        probation_end_date = EXCLUDED.probation_end_date,
        phone_work = EXCLUDED.phone_work,
        phone_mobile = EXCLUDED.phone_mobile,
        phone_home = EXCLUDED.phone_home,
        date_of_birth = EXCLUDED.date_of_birth,
        gender = EXCLUDED.gender,
        marital_status = EXCLUDED.marital_status,
        marriage_date = EXCLUDED.marriage_date,
        blood_group = EXCLUDED.blood_group,
        nationality = EXCLUDED.nationality,
        current_address = EXCLUDED.current_address,
        permanent_address = EXCLUDED.permanent_address,
        education_details = EXCLUDED.education_details,
        experience_details = EXCLUDED.experience_details,
        custom_fields = EXCLUDED.custom_fields,
        groups = EXCLUDED.groups,
        band_info = EXCLUDED.band_info,
        pay_grade_info = EXCLUDED.pay_grade_info,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id;
    `;
    
    const values = [
      employee.id,                                              // keka_employee_id
      employee.employeeNumber || null,                          // employee_number
      employee.firstName || null,                               // first_name
      employee.middleName || null,                              // middle_name
      employee.lastName || null,                                // last_name
      employee.displayName || null,                             // display_name
      employee.email || null,                                   // email
      employee.personalEmail || null,                           // personal_email
      employee.jobTitle?.title || null,                         // job_title (extract title from object)
      employee.secondaryJobTitle?.title || null,                // secondary_job_title (extract title from object)
      extractDepartmentFromGroups(employee.groups) || null,     // department
      null,                                                     // location (not in API response)
      employee.city || null,                                    // city
      employee.countryCode || null,                             // country_code
      employee.reportsTo ? JSON.stringify(employee.reportsTo) : null, // reports_to
      employee.l2Manager ? JSON.stringify(employee.l2Manager) : null, // l2_manager
      employee.dottedLineManager ? JSON.stringify(employee.dottedLineManager) : null, // dotted_line_manager
      employee.employmentStatus?.toString() || null,            // employment_status (convert number to string)
      employee.accountStatus?.toString() || null,               // account_status (convert number to string)
      employee.workerType?.toString() || null,                  // worker_type (convert number to string)
      employee.timeType?.toString() || null,                    // time_type (convert number to string)
      parseDate(employee.joiningDate),                          // joining_date
      parseDate(employee.exitDate),                             // exit_date
      parseDate(employee.resignationSubmittedDate),             // resignation_submitted_date
      parseDate(employee.probationEndDate),                     // probation_end_date
      employee.workPhone || null,                               // phone_work
      employee.mobilePhone || null,                             // phone_mobile
      employee.homePhone || null,                               // phone_home
      parseDate(employee.dateOfBirth),                          // date_of_birth
      employee.gender?.toString() || null,                      // gender (convert number to string)
      employee.maritalStatus?.toString() || null,               // marital_status (convert number to string)
      parseDate(employee.marriageDate),                         // marriage_date
      employee.bloodGroup?.toString() || null,                  // blood_group (convert number to string)
      employee.nationality || null,                             // nationality
      employee.currentAddress ? JSON.stringify(employee.currentAddress) : null, // current_address
      employee.permanentAddress ? JSON.stringify(employee.permanentAddress) : null, // permanent_address
      employee.educationDetails ? JSON.stringify(employee.educationDetails) : null, // education_details
      employee.experienceDetails ? JSON.stringify(employee.experienceDetails) : null, // experience_details
      employee.customFields ? JSON.stringify(employee.customFields) : null, // custom_fields
      employee.groups ? JSON.stringify(employee.groups) : null, // groups
      employee.bandInfo ? JSON.stringify(employee.bandInfo) : null, // band_info
      employee.payGradeInfo ? JSON.stringify(employee.payGradeInfo) : null, // pay_grade_info
      JSON.stringify(employee)                                  // raw_data
    ];
    
    const result = await client_db.query(query, values);
    return result.rows[0].id;
    
  } catch (error) {
    console.error('❌ Error storing employee:', error);
    console.error('Employee data:', JSON.stringify(employee, null, 2));
    throw error;
  }
}

async function syncAllKekaEmployees() {
  let dbClient;
  try {
    console.log('🚀 Starting Keka Employees sync...');
    
    // Get token and database connection
    const token = await getKekaToken();
    dbClient = await pool.connect();
    
    let allEmployees = [];
    let currentPage = 1;
    let totalRecords = 0;
    let hasMorePages = true;
    
    // Fetch all pages
    while (hasMorePages) {
      const response = await fetchKekaEmployees(token, currentPage, 50);
      
      if (currentPage === 1) {
        totalRecords = response.totalRecords;
        console.log(`📊 Total employees to sync: ${totalRecords}`);
      }
      
      if (response.data && response.data.length > 0) {
        allEmployees.push(...response.data);
        
        console.log(`📥 Collected ${allEmployees.length}/${totalRecords} employees`);
        
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
    
    console.log(`\n💾 Storing ${allEmployees.length} employees in database...`);
    
    let storedCount = 0;
    let updatedCount = 0;
    
    for (const employee of allEmployees) {
      try {
        // Check if employee already exists
        const existsQuery = 'SELECT id FROM keka_employees WHERE keka_employee_id = $1';
        const existsResult = await dbClient.query(existsQuery, [employee.id]);
        
        const isUpdate = existsResult.rows.length > 0;
        
        await storeEmployeeInDatabase(employee, dbClient);
        
        if (isUpdate) {
          updatedCount++;
        } else {
          storedCount++;
        }
        
        if ((storedCount + updatedCount) % 20 === 0) {
          console.log(`  📊 Progress: ${storedCount + updatedCount}/${allEmployees.length} employees processed`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to store employee ${employee.displayName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Keka Employees sync completed!');
    console.log(`📊 Results:`);
    console.log(`  ✅ New employees stored: ${storedCount}`);
    console.log(`  🔄 Existing employees updated: ${updatedCount}`);
    console.log(`  📋 Total employees processed: ${storedCount + updatedCount}`);
    
    // Get final count
    const countResult = await dbClient.query('SELECT COUNT(*) as count FROM keka_employees');
    console.log(`  🗄️  Total employees in database: ${countResult.rows[0].count}`);
    
    // Show statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_employees,
        COUNT(CASE WHEN employment_status = 'Active' THEN 1 END) as active_employees,
        COUNT(CASE WHEN employment_status != 'Active' THEN 1 END) as inactive_employees,
        COUNT(DISTINCT department) as unique_departments,
        COUNT(DISTINCT job_title) as unique_job_titles,
        COUNT(CASE WHEN joining_date >= CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as recent_joiners
      FROM keka_employees
    `;
    
    const statsResult = await dbClient.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log('\n📊 Employee Statistics:');
    console.log(`  👥 Total employees: ${stats.total_employees}`);
    console.log(`  ✅ Active employees: ${stats.active_employees}`);
    console.log(`  ⏸️  Inactive employees: ${stats.inactive_employees}`);
    console.log(`  🏢 Unique departments: ${stats.unique_departments}`);
    console.log(`  💼 Unique job titles: ${stats.unique_job_titles}`);
    console.log(`  🆕 Recent joiners (last year): ${stats.recent_joiners}`);
    
    // Show department breakdown
    const deptQuery = `
      SELECT department, COUNT(*) as employee_count 
      FROM keka_employees 
      WHERE department IS NOT NULL 
      GROUP BY department 
      ORDER BY employee_count DESC 
      LIMIT 10
    `;
    
    const deptResult = await dbClient.query(deptQuery);
    
    console.log('\n🏢 Top departments:');
    deptResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.department}: ${row.employee_count} employees`);
    });
    
    // Show sample of stored employees
    const sampleResult = await dbClient.query(`
      SELECT display_name, employee_number, job_title, department, employment_status,
             CASE WHEN joining_date IS NOT NULL THEN joining_date::text ELSE 'No joining date' END as joining_date
      FROM keka_employees 
      WHERE employment_status = 'Active'
      ORDER BY display_name 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample active employees stored:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.display_name} (${row.employee_number})`);
      console.log(`     Title: ${row.job_title || 'N/A'} | Dept: ${row.department || 'N/A'} | Joined: ${row.joining_date}`);
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
syncAllKekaEmployees()
  .then(() => {
    console.log('\n✅ Keka Employees sync script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });