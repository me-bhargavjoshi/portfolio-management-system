const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'portfolio_management',
  user: 'portfolio_user',
  password: 'portfolio_password'
});

async function checkCounts() {
  // Check projects
  const projectsTotal = await pool.query('SELECT COUNT(*) FROM projects WHERE keka_id IS NOT NULL');
  const projectsActive = await pool.query('SELECT COUNT(*) FROM projects WHERE keka_id IS NOT NULL AND is_active = true');
  const projectsInactive = await pool.query('SELECT COUNT(*) FROM projects WHERE keka_id IS NOT NULL AND is_active = false');
  
  console.log('\n=== PROJECTS ===');
  console.log(`Total: ${projectsTotal.rows[0].count}`);
  console.log(`Active: ${projectsActive.rows[0].count}`);
  console.log(`Inactive: ${projectsInactive.rows[0].count}`);
  
  // Sample inactive projects
  const inactiveProjects = await pool.query(
    'SELECT name, is_active FROM projects WHERE keka_id IS NOT NULL AND is_active = false LIMIT 5'
  );
  if (inactiveProjects.rows.length > 0) {
    console.log('\nSample Inactive Projects:');
    inactiveProjects.rows.forEach(p => console.log(`  - ${p.name}`));
  }
  
  // Check employees
  const employeesTotal = await pool.query('SELECT COUNT(*) FROM employees WHERE keka_employee_id IS NOT NULL');
  const employeesActive = await pool.query('SELECT COUNT(*) FROM employees WHERE keka_employee_id IS NOT NULL AND is_active = true');
  const employeesInactive = await pool.query('SELECT COUNT(*) FROM employees WHERE keka_employee_id IS NOT NULL AND is_active = false');
  
  console.log('\n=== EMPLOYEES ===');
  console.log(`Total: ${employeesTotal.rows[0].count}`);
  console.log(`Active: ${employeesActive.rows[0].count}`);
  console.log(`Inactive: ${employeesInactive.rows[0].count}`);
  
  // Sample inactive employees
  const inactiveEmployees = await pool.query(
    'SELECT first_name, last_name, is_active FROM employees WHERE keka_employee_id IS NOT NULL AND is_active = false LIMIT 5'
  );
  if (inactiveEmployees.rows.length > 0) {
    console.log('\nSample Inactive Employees:');
    inactiveEmployees.rows.forEach(e => console.log(`  - ${e.first_name} ${e.last_name}`));
  }
  
  await pool.end();
}

checkCounts().catch(console.error);
