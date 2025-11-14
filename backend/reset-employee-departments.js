const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function resetEmployeeDepartments() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting employee departments to null (will show as "-")...');
    
    // Reset all departments to null - let Keka sync populate them properly
    const result = await client.query(`
      UPDATE employees 
      SET department = NULL
      WHERE keka_employee_id IS NOT NULL
      RETURNING first_name, last_name, email, department;
    `);
    
    console.log(`✅ Reset ${result.rows.length} employee departments to null`);
    
    // Show current state
    const currentResult = await client.query(`
      SELECT first_name, last_name, department,
             CASE WHEN department IS NULL THEN '-' ELSE department END as display_dept
      FROM employees 
      WHERE is_active = true 
      LIMIT 5
    `);
    
    console.log('\n📊 Sample employees after reset:');
    currentResult.rows.forEach(emp => {
      console.log(`  - ${emp.first_name} ${emp.last_name}: department=${emp.department || 'NULL'} (will show as "${emp.display_dept}")`);
    });
    
    console.log('\n✅ Departments reset! Now sync from Keka will populate only what Keka provides.');
    
  } catch (error) {
    console.error('❌ Error resetting departments:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

resetEmployeeDepartments().catch(console.error);
