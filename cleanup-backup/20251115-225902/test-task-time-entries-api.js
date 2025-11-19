const axios = require('axios');

// Keka API configuration
const kekaConfig = {
  clientId: 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: 'L0lrngtVKLGBMimNzYNk',
  apiKey: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  tokenUrl: 'https://login.keka.com/connect/token'
};

const KEKA_BASE_URL = 'https://dynamicelements.keka.com/api/v1';

async function getAccessToken() {
  try {
    console.log('🔑 Getting access token...');
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
    
    console.log('✅ Access token obtained');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error getting access token:', error.response?.data || error.message);
    throw error;
  }
}

async function testTaskTimeEntriesAPI() {
  try {
    const token = await getAccessToken();
    
    console.log('\n🔍 Testing different Task Time Entries API endpoints...');
    console.log('=' .repeat(60));
    
    // Test different possible endpoints
    const testEndpoints = [
      '/psa/task-time-entries',
      '/psa/taskTimeEntries', 
      '/psa/timeentries',
      '/psa/task/timeentries',
      '/psa/tasks/timeentries'
    ];
    
    const testParams = {
      from: '2025-11-01T00:00:00.000Z',
      to: '2025-11-15T23:59:59.999Z'
    };
    
    for (const endpoint of testEndpoints) {
      try {
        console.log(`\n📡 Testing: ${KEKA_BASE_URL}${endpoint}`);
        
        const response = await axios.get(`${KEKA_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          params: testParams
        });
        
        console.log(`✅ SUCCESS! Endpoint works: ${endpoint}`);
        console.log(`📊 Response type:`, typeof response.data);
        
        if (Array.isArray(response.data)) {
          console.log(`📝 Found ${response.data.length} records`);
          if (response.data.length > 0) {
            console.log('📋 Sample record structure:');
            console.log(JSON.stringify(response.data[0], null, 2));
          }
        } else if (response.data && typeof response.data === 'object') {
          console.log('📋 Response structure:');
          console.log(JSON.stringify(response.data, null, 2));
        }
        
        // If we found a working endpoint, we can stop here
        break;
        
      } catch (error) {
        console.log(`❌ Failed: ${endpoint} - ${error.response?.status} ${error.response?.statusText}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTaskTimeEntriesAPI();