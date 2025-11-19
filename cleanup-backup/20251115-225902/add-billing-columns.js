const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function addBillingColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Adding billing columns to projects table...');
    
    // Check if columns already exist
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('billing_type', 'is_billable')
    `);
    
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    
    // Add billing_type column
    if (!existingColumns.includes('billing_type')) {
      await client.query(`
        ALTER TABLE projects 
        ADD COLUMN billing_type VARCHAR(50)
      `);
      console.log('✅ Added billing_type column');
    } else {
      console.log('ℹ️  billing_type column already exists');
    }
    
    // Add is_billable column
    if (!existingColumns.includes('is_billable')) {
      await client.query(`
        ALTER TABLE projects 
        ADD COLUMN is_billable BOOLEAN
      `);
      console.log('✅ Added is_billable column');
    } else {
      console.log('ℹ️  is_billable column already exists');
    }
    
    // Show updated table structure
    const structureCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'projects' 
      AND column_name IN ('name', 'billing_type', 'is_billable', 'keka_id')
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Relevant projects table columns:');
    structureCheck.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('\n✅ Billing columns ready for Keka data!');
    
  } catch (error) {
    console.error('❌ Error adding columns:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addBillingColumns().catch(console.error);
