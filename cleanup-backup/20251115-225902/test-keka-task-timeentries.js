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

async function testTaskTimeEntriesAPI() {
  try {
    console.log('🔍 Testing Keka Task Time Entries API...');
    
    // Get authentication token
    const token = await getKekaToken();

    // First, get projects
    const projectsUrl = 'https://dynamicelements.keka.com/api/v1/psa/projects';
    const projectsResponse = await axios.get(projectsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    const projectsData = projectsResponse.data;
    console.log('📊 Found', projectsData.data.length, 'projects');

    // Test first few projects to find tasks
    for (const project of projectsData.data.slice(0, 5)) {
      console.log(`\n🔍 Getting tasks for project: ${project.name}`);
      
      const tasksUrl = `https://dynamicelements.keka.com/api/v1/psa/projects/${project.id}/tasks`;
      
      try {
        const tasksResponse = await axios.get(tasksUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        const tasksData = tasksResponse.data;
        
        if (tasksData.data && tasksData.data.length > 0) {
          console.log(`  📋 Found ${tasksData.data.length} tasks`);
          
          // Test task time entries with the first task
          const firstTask = tasksData.data[0];
          console.log(`\n🔍 Testing time entries for task: ${firstTask.name} (ID: ${firstTask.id})`);
          
          // Test with recent date range (last 30 days)
          const to = new Date();
          const from = new Date();
          from.setDate(from.getDate() - 30);
          
          const timeEntriesUrl = `https://dynamicelements.keka.com/api/v1/psa/projects/${project.id}/tasks/${firstTask.id}/timeentries`;
          const params = {
            from: from.toISOString(),
            to: to.toISOString()
          };
          
          try {
            const timeEntriesResponse = await axios.get(timeEntriesUrl, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              },
              params: params
            });

            const timeEntriesData = timeEntriesResponse.data;
            console.log(`  ⏰ Found ${timeEntriesData.data ? timeEntriesData.data.length : 0} time entries`);
            
            // Show sample time entry structure
            if (timeEntriesData.data && timeEntriesData.data.length > 0) {
              console.log('\n⏰ Sample Time Entry Structure:');
              console.log(JSON.stringify(timeEntriesData.data[0], null, 2));
              
              console.log('\n✅ Task Time Entries API working successfully!');
              return; // Found sample data, exit
            }
          } catch (timeError) {
            console.log(`  ❌ Time entries error for task ${firstTask.id}:`, timeError.response?.status);
          }
        }
      } catch (taskError) {
        console.log(`  ❌ Tasks error for project ${project.id}:`, taskError.response?.status);
      }
    }
    
    console.log('\n⚠️ No time entries found in recent 30 days for tested projects');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTaskTimeEntriesAPI();