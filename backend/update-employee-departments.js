const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function updateEmployeeDepartments() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Updating employee departments with sample data...');
    
    // Update employees with meaningful department names instead of 'Unknown'
    const result = await client.query(`
      UPDATE employees 
      SET department = CASE 
        WHEN email LIKE '%@evidi.%' THEN 'Engineering'
        WHEN first_name IN ('Jay', 'Ravi', 'Amit') THEN 'Development'
        WHEN first_name IN ('Anita', 'Priya') THEN 'HR'
        WHEN first_name IN ('Rajesh', 'Suresh') THEN 'Operations'
        WHEN email LIKE '%admin%' THEN 'Administration'
        WHEN email LIKE '%sales%' THEN 'Sales'
        WHEN email LIKE '%support%' THEN 'Support'
        WHEN designation LIKE '%Manager%' THEN 'Management'
        WHEN designation LIKE '%Developer%' THEN 'Engineering'
        WHEN designation LIKE '%Analyst%' THEN 'Business Analysis'
        ELSE 'General'
      END
      WHERE department IS NULL OR department = 'Unknown'
      RETURNING first_name, last_name, email, department, designation;
    `);
    
    console.log('✅ Updated employee departments:');
    result.rows.forEach(emp => {
      console.log(`  - ${emp.first_name} ${emp.last_name}: ${emp.department} (${emp.designation})`);
    });
    
    // Get department distribution
    const deptResult = await client.query(`
      SELECT department, COUNT(*) as count
      FROM employees 
      WHERE is_active = true 
      GROUP BY department
      ORDER BY count DESC
    `);
    
    console.log('\n🏢 Updated department distribution:');
    deptResult.rows.forEach(dept => {
      console.log(`  - ${dept.department}: ${dept.count} employees`);
    });
    
    console.log(`\n✅ Successfully updated ${result.rows.length} employee departments!`);
    
  } catch (error) {
    console.error('❌ Error updating departments:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateEmployeeDepartments().catch(console.error);
