/**
 * Database Migration Script
 * Adds the keka_timesheet_raw table and updates actual_efforts table
 */

import { initDatabase } from './src/config/database';

async function runMigration() {
  console.log('🔄 Running database migration for timesheet tables...');
  
  try {
    const pool = await initDatabase();
    const client = await pool.connect();

    try {
      // Check if keka_timesheet_raw table already exists
      const checkQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'keka_timesheet_raw'
        );
      `;
      
      const result = await client.query(checkQuery);
      const tableExists = result.rows[0].exists;

      if (tableExists) {
        console.log('✅ keka_timesheet_raw table already exists');
      } else {
        console.log('📊 Creating keka_timesheet_raw table...');
        
        const createRawTableQuery = `
          CREATE TABLE keka_timesheet_raw (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
            employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
            keka_employee_id VARCHAR(255),
            
            -- API Response Storage
            raw_json_response JSONB NOT NULL,
            api_endpoint VARCHAR(500) NOT NULL,
            date_range_start DATE NOT NULL,
            date_range_end DATE NOT NULL,
            
            -- Processing Status
            processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processed, failed, skipped
            processing_error TEXT,
            processed_at TIMESTAMP,
            processed_records_count INTEGER DEFAULT 0,
            
            -- Sync Metadata  
            sync_run_id UUID,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            -- Constraints
            UNIQUE(company_id, keka_employee_id, date_range_start, date_range_end)
          );
        `;
        
        await client.query(createRawTableQuery);
        console.log('✅ keka_timesheet_raw table created successfully');
      }

      // Check if actual_efforts table has the new columns
      const checkColumnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'actual_efforts' 
        AND column_name IN ('raw_record_id', 'processed_at');
      `;
      
      const columnsResult = await client.query(checkColumnsQuery);
      const existingColumns = columnsResult.rows.map(row => row.column_name);

      if (existingColumns.includes('raw_record_id') && existingColumns.includes('processed_at')) {
        console.log('✅ actual_efforts table already has new columns');
      } else {
        console.log('📊 Adding new columns to actual_efforts table...');
        
        if (!existingColumns.includes('raw_record_id')) {
          await client.query('ALTER TABLE actual_efforts ADD COLUMN raw_record_id UUID REFERENCES keka_timesheet_raw(id)');
          console.log('✅ Added raw_record_id column');
        }
        
        if (!existingColumns.includes('processed_at')) {
          await client.query('ALTER TABLE actual_efforts ADD COLUMN processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
          console.log('✅ Added processed_at column');
        }
      }

      console.log('🎉 Database migration completed successfully!');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration().catch(console.error);