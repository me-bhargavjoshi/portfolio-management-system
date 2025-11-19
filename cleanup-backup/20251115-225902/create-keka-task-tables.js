const { Pool } = require('pg');

const pool = new Pool({
  user: 'portfolio_user',
  host: 'localhost',
  database: 'portfolio_management',
  password: 'portfolio_password',
  port: 5432,
});

async function createTaskTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔨 Creating Keka task-related tables...');
    
    // Create keka_project_tasks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS keka_project_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
        keka_task_id UUID NOT NULL UNIQUE,
        keka_project_id UUID NOT NULL,
        task_name VARCHAR(500) NOT NULL,
        task_description TEXT,
        task_type VARCHAR(100),
        task_billing_type VARCHAR(100),
        assigned_to JSONB,
        start_date DATE,
        end_date DATE,
        estimated_hours DECIMAL(10,2),
        is_active BOOLEAN DEFAULT true,
        custom_fields JSONB,
        raw_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Created keka_project_tasks table');
    
    // Create keka_task_time_entries table
    await client.query(`
      CREATE TABLE IF NOT EXISTS keka_task_time_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',
        keka_time_entry_id UUID NOT NULL UNIQUE,
        keka_employee_id UUID NOT NULL,
        keka_project_id UUID NOT NULL,
        keka_task_id UUID NOT NULL,
        work_date DATE NOT NULL,
        total_minutes INTEGER NOT NULL,
        hours_worked DECIMAL(5,2) GENERATED ALWAYS AS (total_minutes / 60.0) STORED,
        start_time TIME,
        end_time TIME,
        comments TEXT,
        is_billable BOOLEAN DEFAULT false,
        status VARCHAR(50),
        approval_status VARCHAR(50),
        submitted_date DATE,
        approved_date DATE,
        custom_attributes JSONB,
        raw_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Created keka_task_time_entries table');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_keka_project_tasks_project_id 
      ON keka_project_tasks(keka_project_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_keka_task_time_entries_employee_id 
      ON keka_task_time_entries(keka_employee_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_keka_task_time_entries_project_id 
      ON keka_task_time_entries(keka_project_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_keka_task_time_entries_task_id 
      ON keka_task_time_entries(keka_task_id);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_keka_task_time_entries_date 
      ON keka_task_time_entries(work_date);
    `);
    
    console.log('✅ Created performance indexes');
    console.log('🎉 All task-related tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTaskTables().catch(console.error);