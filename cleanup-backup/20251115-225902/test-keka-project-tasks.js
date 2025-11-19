const axios = require('axios');

// Keka OAuth2 configuration
const kekaConfig = {
  clientId: 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: 'L0lrngtVKLGBMimNzYNk',
  apiKey: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  tokenUrl: 'https://login.keka.com/connect/token'
};

async function getKekaToken() {
  try {
    console.log('🔑 Getting fresh Keka token...');
    
    const response = await axios({
      method: 'POST',
      url: kekaConfig.tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: new URLSearchParams({
        'grant_type': 'kekaapi',
        'scope': 'kekaapi',
        'client_id': kekaConfig.clientId,
        'client_secret': kekaConfig.clientSecret,
        'api_key': kekaConfig.apiKey
      })
    });
    
    console.log('✅ Token retrieved successfully');
    return response.data.access_token;
    
  } catch (error) {
    console.error('❌ Failed to get token:', error.response?.status, error.response?.statusText);
    throw error;
  }
}

async function testProjectTasksAPI() {
  try {
    console.log('🔍 Testing Keka Project Tasks API...');
    
    // Get authentication token
    const token = await getKekaToken();
    console.log('✅ Authentication successful');

    // First, let's get a few projects to test with
    const projectsUrl = 'https://dynamicelements.keka.com/api/v1/psa/projects';
    const projectsResponse = await axios.get(projectsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const projectsData = projectsResponse.data;
    console.log('📊 Found', projectsData.data.length, 'projects');

    // Test project tasks API with first few projects
    const testProjects = projectsData.data.slice(0, 3);
    
    for (const project of testProjects) {
      console.log(`\n🔍 Testing tasks for project: ${project.name} (ID: ${project.id})`);
      
      const tasksUrl = `https://dynamicelements.keka.com/api/v1/psa/projects/${project.id}/tasks`;
      
      try {
        const tasksResponse = await axios.get(tasksUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        const tasksData = tasksResponse.data;
        console.log(`  📋 Found ${tasksData.data ? tasksData.data.length : 0} tasks`);
        
        // Show sample task structure
        if (tasksData.data && tasksData.data.length > 0) {
          console.log('\n📝 Sample Task Structure:');
          console.log(JSON.stringify(tasksData.data[0], null, 2));
          break; // Just show one example
        }
      } catch (error) {
        console.log(`❌ Error fetching tasks for project ${project.id}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProjectTasksAPI();