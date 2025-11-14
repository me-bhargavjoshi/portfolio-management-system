const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function checkEmployeeDepartments() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking employee department data...');
    
    // Get sample employee data
    const result = await client.query(`
      SELECT first_name, last_name, email, designation, department
      FROM employees 
      WHERE is_active = true 
      LIMIT 5
    `);
    
    console.log('\n📊 Sample employee data:');
    result.rows.forEach(emp => {
      console.log(`  - ${emp.first_name} ${emp.last_name}: designation="${emp.designation}", department="${emp.department}"`);
    });
    
    // Check unique departments
    const deptResult = await client.query(`
      SELECT DISTINCT department, COUNT(*) as count
      FROM employees 
      WHERE is_active = true 
      GROUP BY department
      ORDER BY count DESC
    `);
    
    console.log('\n🏢 Department distribution:');
    deptResult.rows.forEach(dept => {
      console.log(`  - "${dept.department}": ${dept.count} employees`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkEmployeeDepartments().catch(console.error);
