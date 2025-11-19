const axios = require('axios');

// Keka OAuth2 configuration (from the config file)
const kekaConfig = {
  clientId: 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: 'L0lrngtVKLGBMimNzYNk',
  apiKey: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  tokenUrl: 'https://login.keka.com/connect/token'
};

async function getKekaToken() {
  try {
    console.log('Getting fresh Keka token...');
    
    // Use the correct Keka API grant type and include API key
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
    console.log('Token expires in:', response.data.expires_in, 'seconds');
    return response.data.access_token;
    
  } catch (error) {
    console.error('❌ Failed to get token:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data);
    throw error;
  }
}

async function testKekaAPI() {
  try {
    // Get fresh token
    const token = await getKekaToken();
    
    console.log('Testing Keka PSA timeentries API with fresh token...');
    
    // Test the PSA timeentries API endpoint with date range from Jan 1, 2025
    const response = await axios({
      method: 'GET',
      url: 'https://dynamicelements.keka.com/api/v1/psa/timeentries',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`
      },
      params: {
        startDate: '2025-01-01',
        endDate: '2025-11-15'  // Current date
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.error('API Error Response:', error.response.status);
      console.error('Error Details:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testKekaAPI();