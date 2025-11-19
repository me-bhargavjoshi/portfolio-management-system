/**
 * Create Keka Timesheet Storage Tables
 * This script creates tables for storing Keka timesheet data with proper structure
 */

// Use require to import TypeScript files through ts-node or compiled JavaScript
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

async function createKekaTimesheetTables() {
  console.log('🔄 Creating Keka timesheet storage tables...');
  
  try {
    const pool = await initDatabase();
    const client = await pool.connect();

    try {
      // 1. Create keka_timesheet_raw table for storing raw API responses
      console.log('📊 Creating keka_timesheet_raw table...');
      
      const createTableResult = await client.query(`
        CREATE TABLE IF NOT EXISTS keka_timesheet_raw (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          
          -- Keka-specific identifiers
          keka_timesheet_id VARCHAR(255) NOT NULL,
          keka_employee_id VARCHAR(255) NOT NULL,
          keka_project_id VARCHAR(255) NOT NULL,
          keka_task_id VARCHAR(255) NOT NULL,
          
          -- Time tracking data
          work_date DATE NOT NULL,
          total_minutes INTEGER NOT NULL,
          start_time TIME,
          end_time TIME,
          
          -- Work details
          comments TEXT,
          is_billable BOOLEAN NOT NULL DEFAULT false,
          status INTEGER NOT NULL DEFAULT 0,
          
          -- Raw API data
          raw_json_data JSONB NOT NULL,
          
          -- Processing metadata
          processing_status VARCHAR(50) DEFAULT 'pending',
          processing_error TEXT,
          processed_at TIMESTAMP,
          
          -- Sync metadata
          sync_run_id UUID,
          api_endpoint VARCHAR(500) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          -- Ensure uniqueness per timesheet entry
          UNIQUE(company_id, keka_timesheet_id)
        );
      `);
      
      console.log('✅ keka_timesheet_raw table created successfully');

      // 2. Create indexes for performance
      console.log('📊 Creating indexes for keka_timesheet_raw...');
      
      await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheet_raw_company ON keka_timesheet_raw(company_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheet_raw_employee ON keka_timesheet_raw(keka_employee_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheet_raw_date ON keka_timesheet_raw(work_date);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheet_raw_project ON keka_timesheet_raw(keka_project_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_timesheet_raw_status ON keka_timesheet_raw(processing_status);`);
      
      console.log('✅ Indexes created successfully');

      // 3. Add columns to actual_efforts table for Keka integration
      console.log('📊 Updating actual_efforts table for Keka integration...');
      
      // Check if columns already exist
      const checkColumnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'actual_efforts' 
        AND column_name IN ('keka_timesheet_id', 'is_billable', 'keka_status', 'raw_record_id');
      `;
      
      const columnsResult = await client.query(checkColumnsQuery);
      const existingColumns = columnsResult.rows.map(row => row.column_name);

      if (!existingColumns.includes('keka_timesheet_id')) {
        await client.query('ALTER TABLE actual_efforts ADD COLUMN keka_timesheet_id VARCHAR(255)');
        console.log('✅ Added keka_timesheet_id column to actual_efforts');
      }
      
      if (!existingColumns.includes('is_billable')) {
        await client.query('ALTER TABLE actual_efforts ADD COLUMN is_billable BOOLEAN DEFAULT true');
        console.log('✅ Added is_billable column to actual_efforts');
      }
      
      if (!existingColumns.includes('keka_status')) {
        await client.query('ALTER TABLE actual_efforts ADD COLUMN keka_status INTEGER');
        console.log('✅ Added keka_status column to actual_efforts');
      }
      
      if (!existingColumns.includes('raw_record_id')) {
        await client.query('ALTER TABLE actual_efforts ADD COLUMN raw_record_id UUID REFERENCES keka_timesheet_raw(id)');
        console.log('✅ Added raw_record_id column to actual_efforts');
      }

      // 4. Create keka_project_mapping table for project mapping
      console.log('📊 Creating keka_project_mapping table...');
      
      await client.query(`
        CREATE TABLE IF NOT EXISTS keka_project_mapping (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
          
          -- Keka identifiers
          keka_project_id VARCHAR(255) NOT NULL,
          keka_project_name VARCHAR(500),
          keka_task_id VARCHAR(255),
          keka_task_name VARCHAR(500),
          
          -- Portfolio Management identifiers
          portfolio_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
          
          -- Mapping metadata
          mapping_status VARCHAR(50) DEFAULT 'unmapped', -- unmapped, mapped, ignored
          mapped_by UUID REFERENCES users(id),
          mapped_at TIMESTAMP,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          UNIQUE(company_id, keka_project_id, keka_task_id)
        );
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_project_mapping_company ON keka_project_mapping(company_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_project_mapping_keka_project ON keka_project_mapping(keka_project_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_keka_project_mapping_portfolio_project ON keka_project_mapping(portfolio_project_id);`);

      console.log('🎉 Keka timesheet storage tables created successfully!');
      console.log('📋 Tables created:');
      console.log('  ✅ keka_timesheet_raw - Raw timesheet data storage');
      console.log('  ✅ keka_project_mapping - Project mapping between Keka and Portfolio Management');
      console.log('  ✅ actual_efforts - Enhanced with Keka integration columns');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Failed to create Keka timesheet tables:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the migration
createKekaTimesheetTables()
  .then(() => {
    console.log('✅ Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });