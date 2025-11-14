import { initDatabase } from '../src/config/database';

async function createSyncRunsTable() {
  console.log('Initializing database...');
  const pool = await initDatabase();
  
  try {
    console.log('Creating sync_runs table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sync_runs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        entity_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'running',
        records_synced INTEGER DEFAULT 0,
        records_failed INTEGER DEFAULT 0,
        errors JSONB,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        duration_ms INTEGER,
        triggered_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Creating indexes...');
    
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sync_runs_company ON sync_runs(company_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sync_runs_entity ON sync_runs(entity_type);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON sync_runs(status);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_sync_runs_started ON sync_runs(started_at DESC);`);
    
    console.log('✅ sync_runs table and indexes created successfully');
    
    // Verify
    const result = await pool.query(`SELECT COUNT(*) FROM sync_runs`);
    console.log(`Current sync_runs count: ${result.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sync_runs table:', error);
    process.exit(1);
  }
}

createSyncRunsTable();
