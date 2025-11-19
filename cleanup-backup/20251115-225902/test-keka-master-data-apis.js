/**
 * Test Keka Master Data APIs - Clients, Projects, Employees
 * Explore available endpoints and data structures
 */

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
    console.error('Error details:', error.response?.data);
    throw error;
  }
}

async function testKekaAPI(token, endpoint, description) {
  try {
    console.log(`\n🧪 Testing ${description}`);
    console.log(`📡 Endpoint: ${endpoint}`);
    
    const response = await axios({
      method: 'GET',
      url: endpoint,
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`
      },
      params: {
        pageNumber: 1,
        pageSize: 5  // Small sample size
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Summary:');
    console.log(`  - Success: ${response.data.succeeded}`);
    console.log(`  - Total Records: ${response.data.totalRecords || 'N/A'}`);
    console.log(`  - Total Pages: ${response.data.totalPages || 'N/A'}`);
    console.log(`  - Records in this page: ${response.data.data?.length || 0}`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📋 Sample records structure:');
      response.data.data.slice(0, 2).forEach((record, index) => {
        console.log(`  ${index + 1}. Record Keys:`, Object.keys(record));
        console.log(`     Sample Data:`, JSON.stringify(record, null, 4).substring(0, 200) + '...');
      });
    }
    
    return response.data;
    
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.response?.status, error.response?.statusText);
    if (error.response?.data) {
      console.error('Error details:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

async function exploreKekaAPIs() {
  try {
    const token = await getKekaToken();
    
    console.log('🔍 Exploring Keka Master Data APIs...\n');
    
    // Test common API endpoints for master data
    const endpoints = [
      {
        url: 'https://dynamicelements.keka.com/api/v1/hris/employees',
        description: 'HRIS Employees (we tested this before)'
      },
      {
        url: 'https://dynamicelements.keka.com/api/v1/psa/projects',
        description: 'PSA Projects'
      },
      {
        url: 'https://dynamicelements.keka.com/api/v1/psa/clients', 
        description: 'PSA Clients'
      },
      {
        url: 'https://dynamicelements.keka.com/api/v1/psa/tasks',
        description: 'PSA Tasks'
      },
      {
        url: 'https://dynamicelements.keka.com/api/v1/psa/accounts',
        description: 'PSA Accounts'
      }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      const result = await testKekaAPI(token, endpoint.url, endpoint.description);
      results[endpoint.description] = result;
      
      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('\n🎉 API Exploration Complete!');
    console.log('\n📊 Summary of Available APIs:');
    
    Object.entries(results).forEach(([description, result]) => {
      if (result && result.succeeded) {
        console.log(`✅ ${description}: ${result.totalRecords || 'Unknown'} records available`);
      } else {
        console.log(`❌ ${description}: Not available or failed`);
      }
    });
    
  } catch (error) {
    console.error('❌ API exploration failed:', error.message);
  }
}

exploreKekaAPIs();