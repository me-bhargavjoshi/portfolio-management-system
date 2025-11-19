const axios = require('axios');

async function checkFields() {
  const tokenResponse = await axios.post('https://login.keka.com/connect/token', 
    new URLSearchParams({
      grant_type: 'kekaapi',
      scope: 'kekaapi',
      client_id: 'ad066272-fc26-4cb6-8013-0c917b338282',
      client_secret: 'L0lrngtVKLGBMimNzYNk',
      api_key: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M='
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const token = tokenResponse.data.access_token;
  const headers = { Authorization: `Bearer ${token}` };

  // Check one project
  const projectsRes = await axios.get('https://dynamicelements.keka.com/api/v1/psa/projects', { headers });
  const projects = projectsRes.data.data || projectsRes.data;
  
  console.log('\n=== PROJECT FIELDS (first project) ===');
  console.log(JSON.stringify(projects[0], null, 2));

  // Check one employee
  const employeesRes = await axios.get('https://dynamicelements.keka.com/api/v1/hris/employees', { headers });
  const employees = employeesRes.data.data || employeesRes.data;
  
  console.log('\n=== EMPLOYEE FIELDS (first employee) ===');
  console.log(JSON.stringify(employees[0], null, 2));
}

checkFields().catch(console.error);
