/**
 * Create Keka Tasks and Task Time Entries Tables
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

async function createTables() {
  try {
    console.log('🔨 Creating Keka Tasks and Task Time Entries tables...');

    // Create keka_tasks table
    const createKekaTasksTable = `
      CREATE TABLE IF NOT EXISTS keka_tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL DEFAULT '123e4567-e89b-12d3-a456-426614174000',
        keka_task_id UUID NOT NULL UNIQUE,
        keka_project_id UUID NOT NULL,
        name VARCHAR(500) NOT NULL,
        description TEXT,
        task_type INTEGER,
        task_billing_type INTEGER,
        assigned_to JSONB,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        estimated_hours DECIMAL(10,2),
        raw_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createKekaTasksTable);
    console.log('✅ keka_tasks table created');

    // Create keka_task_timeentries table
    const createKekaTaskTimeEntriesTable = `
      CREATE TABLE IF NOT EXISTS keka_task_timeentries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL DEFAULT '123e4567-e89b-12d3-a456-426614174000',
        keka_timeentry_id UUID NOT NULL UNIQUE,
        keka_task_id UUID NOT NULL,
        keka_project_id UUID NOT NULL,
        keka_employee_id UUID NOT NULL,
        work_date DATE NOT NULL,
        total_minutes INTEGER NOT NULL,
        hours_worked DECIMAL(10,2) GENERATED ALWAYS AS (total_minutes / 60.0) STORED,
        start_time TIME,
        end_time TIME,
        comments TEXT,
        is_billable BOOLEAN NOT NULL DEFAULT false,
        status INTEGER,
        raw_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createKekaTaskTimeEntriesTable);
    console.log('✅ keka_task_timeentries table created');

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_keka_tasks_project_id ON keka_tasks(keka_project_id);',
      'CREATE INDEX IF NOT EXISTS idx_keka_tasks_company_id ON keka_tasks(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_keka_task_timeentries_date ON keka_task_timeentries(work_date);',
      'CREATE INDEX IF NOT EXISTS idx_keka_task_timeentries_employee ON keka_task_timeentries(keka_employee_id);',
      'CREATE INDEX IF NOT EXISTS idx_keka_task_timeentries_project ON keka_task_timeentries(keka_project_id);',
      'CREATE INDEX IF NOT EXISTS idx_keka_task_timeentries_task ON keka_task_timeentries(keka_task_id);',
      'CREATE INDEX IF NOT EXISTS idx_keka_task_timeentries_company ON keka_task_timeentries(company_id);'
    ];

    for (const indexQuery of indexes) {
      await pool.query(indexQuery);
    }
    
    console.log('✅ Indexes created');
    console.log('\n🎉 All tables and indexes created successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    await pool.end();
  }
}

createTables();