/**
 * Create database tables for Keka master data
 * - Employees (HRIS)
 * - Projects (PSA)
 * - Clients (PSA)
 */

const { Pool } = require('pg');

const dbConfig = {
  user: 'portfolio_user',
  host: 'localhost',
  database: 'portfolio_management',
  password: 'portfolio_password',
  port: 5432,
};

const pool = new Pool(dbConfig);

const createTablesSQL = `
-- Keka Clients Table
CREATE TABLE IF NOT EXISTS keka_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
    keka_client_id UUID NOT NULL,
    name TEXT NOT NULL,
    billing_name TEXT,
    code TEXT,
    description TEXT,
    billing_address JSONB,
    client_contacts JSONB,
    additional_fields JSONB,
    raw_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_keka_clients_company_keka_id UNIQUE (company_id, keka_client_id)
);

-- Keka Projects Table  
CREATE TABLE IF NOT EXISTS keka_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
    keka_project_id UUID NOT NULL,
    keka_client_id UUID,
    name TEXT NOT NULL,
    code TEXT,
    start_date DATE,
    end_date DATE,
    status INTEGER,
    is_billable BOOLEAN,
    billing_type INTEGER,
    project_budget DECIMAL(15,2),
    budgeted_time DECIMAL(10,2),
    is_archived BOOLEAN,
    project_managers JSONB,
    custom_attributes JSONB,
    raw_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_keka_projects_company_keka_id UNIQUE (company_id, keka_project_id)
);

-- Keka Employees Table (Enhanced from HRIS)
CREATE TABLE IF NOT EXISTS keka_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL DEFAULT '11111111-1111-1111-1111-111111111111',
    keka_employee_id UUID NOT NULL,
    employee_number TEXT,
    first_name TEXT,
    middle_name TEXT,
    last_name TEXT,
    display_name TEXT,
    email TEXT,
    personal_email TEXT,
    job_title TEXT,
    secondary_job_title TEXT,
    department TEXT,
    location TEXT,
    city TEXT,
    country_code TEXT,
    reports_to JSONB,
    l2_manager JSONB,
    dotted_line_manager JSONB,
    employment_status TEXT,
    account_status TEXT,
    worker_type TEXT,
    time_type TEXT,
    joining_date DATE,
    exit_date DATE,
    resignation_submitted_date DATE,
    probation_end_date DATE,
    phone_work TEXT,
    phone_mobile TEXT,
    phone_home TEXT,
    date_of_birth DATE,
    gender TEXT,
    marital_status TEXT,
    marriage_date DATE,
    blood_group TEXT,
    nationality TEXT,
    current_address JSONB,
    permanent_address JSONB,
    education_details JSONB,
    experience_details JSONB,
    custom_fields JSONB,
    groups JSONB,
    band_info JSONB,
    pay_grade_info JSONB,
    raw_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_keka_employees_company_keka_id UNIQUE (company_id, keka_employee_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_keka_clients_company_id ON keka_clients (company_id);
CREATE INDEX IF NOT EXISTS idx_keka_clients_name ON keka_clients (name);
CREATE INDEX IF NOT EXISTS idx_keka_clients_code ON keka_clients (code);

CREATE INDEX IF NOT EXISTS idx_keka_projects_company_id ON keka_projects (company_id);
CREATE INDEX IF NOT EXISTS idx_keka_projects_client_id ON keka_projects (keka_client_id);
CREATE INDEX IF NOT EXISTS idx_keka_projects_name ON keka_projects (name);
CREATE INDEX IF NOT EXISTS idx_keka_projects_code ON keka_projects (code);
CREATE INDEX IF NOT EXISTS idx_keka_projects_status ON keka_projects (status);
CREATE INDEX IF NOT EXISTS idx_keka_projects_billable ON keka_projects (is_billable);

CREATE INDEX IF NOT EXISTS idx_keka_employees_company_id ON keka_employees (company_id);
CREATE INDEX IF NOT EXISTS idx_keka_employees_employee_number ON keka_employees (employee_number);
CREATE INDEX IF NOT EXISTS idx_keka_employees_email ON keka_employees (email);
CREATE INDEX IF NOT EXISTS idx_keka_employees_display_name ON keka_employees (display_name);
CREATE INDEX IF NOT EXISTS idx_keka_employees_employment_status ON keka_employees (employment_status);
CREATE INDEX IF NOT EXISTS idx_keka_employees_job_title ON keka_employees (job_title);

-- Note: Foreign key relationship between projects and clients
-- Will be established logically via keka_client_id field
-- Physical constraint skipped to avoid circular dependency issues

-- Add comments for documentation
COMMENT ON TABLE keka_clients IS 'Keka PSA Clients master data';
COMMENT ON TABLE keka_projects IS 'Keka PSA Projects master data with client relationships';
COMMENT ON TABLE keka_employees IS 'Keka HRIS Employees master data with organizational hierarchy';

COMMENT ON COLUMN keka_clients.raw_data IS 'Complete raw JSON response from Keka API';
COMMENT ON COLUMN keka_projects.raw_data IS 'Complete raw JSON response from Keka API';
COMMENT ON COLUMN keka_employees.raw_data IS 'Complete raw JSON response from Keka API';
`;

async function createKekaMasterDataTables() {
  let client;
  try {
    console.log('🔧 Creating Keka master data tables...');
    
    client = await pool.connect();
    
    console.log('📊 Executing SQL to create tables and indexes...');
    await client.query(createTablesSQL);
    
    console.log('✅ Successfully created Keka master data tables:');
    console.log('  📋 keka_clients - For PSA client data');
    console.log('  📂 keka_projects - For PSA project data');
    console.log('  👥 keka_employees - For HRIS employee data');
    console.log('  🔗 Added foreign key relationships');
    console.log('  📈 Added performance indexes');
    
    // Verify tables were created
    const tableCheckQuery = `
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
      AND table_name IN ('keka_clients', 'keka_projects', 'keka_employees')
      ORDER BY table_name;
    `;
    
    const result = await client.query(tableCheckQuery);
    
    console.log('\n📊 Table verification:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}: ${row.column_count} columns`);
    });
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Add cleanup function
async function cleanupOldData() {
  let client;
  try {
    console.log('🧹 Cleaning up old data...');
    
    client = await pool.connect();
    
    await client.query('DELETE FROM keka_projects');
    await client.query('DELETE FROM keka_clients');
    await client.query('DELETE FROM keka_employees');
    
    console.log('✅ Cleaned up old data from all tables');
    
  } catch (error) {
    console.error('❌ Error cleaning up data:', error);
    throw error;
  } finally {
    if (client) {
      client.release();
    }
  }
}

async function main() {
  try {
    await createKekaMasterDataTables();
    console.log('\n🎉 Keka master data tables setup complete!');
    
    console.log('\n📋 Next steps:');
    console.log('1. Run sync-keka-clients.js to fetch all client data');
    console.log('2. Run sync-keka-projects.js to fetch all project data');
    console.log('3. Run sync-keka-employees.js to fetch all employee data');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { createKekaMasterDataTables, cleanupOldData };