/**
 * Test Keka API with proper from/to timestamp parameters
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

async function testKekaAPIWithDateRange() {
  try {
    // Get fresh token
    const token = await getKekaToken();
    
    console.log('🧪 Testing Keka PSA timeentries API with from/to parameters...');
    
    // Test with January 2025 date range
    const fromDate = '2025-01-01T00:00:00.000Z';
    const toDate = '2025-01-31T23:59:59.999Z';
    
    console.log(`📅 Testing date range: ${fromDate} to ${toDate}`);
    
    const response = await axios({
      method: 'GET',
      url: 'https://dynamicelements.keka.com/api/v1/psa/timeentries',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`
      },
      params: {
        from: fromDate,
        to: toDate,
        pageNumber: 1,
        pageSize: 10  // Small page size for testing
      }
    });
    
    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Summary:');
    console.log(`  - Success: ${response.data.succeeded}`);
    console.log(`  - Total Records: ${response.data.totalRecords}`);
    console.log(`  - Total Pages: ${response.data.totalPages}`);
    console.log(`  - Current Page: ${response.data.pageNumber}`);
    console.log(`  - Records in this page: ${response.data.data?.length || 0}`);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📋 Sample records:');
      response.data.data.slice(0, 3).forEach((record, index) => {
        console.log(`  ${index + 1}. Date: ${record.date}, Minutes: ${record.totalMinutes}, Employee: ${record.employeeId?.substring(0, 8)}...`);
      });
      
      // Check date range of actual data
      const dates = response.data.data.map(r => new Date(r.date));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      
      console.log(`\n📅 Actual data date range: ${minDate.toDateString()} to ${maxDate.toDateString()}`);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error Response:', error.response.status);
      console.error('Error Details:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testKekaAPIWithDateRange();