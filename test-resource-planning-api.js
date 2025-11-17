#!/usr/bin/env node

// Test script for Resource Planning API endpoints
const http = require('http');

const baseUrl = 'http://localhost:3001';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/resource-planning${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Mock token for testing
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test functions
async function testResourcePlanningAPI() {
  console.log('🧪 Testing Resource Planning API Endpoints...\n');

  try {
    // Test 1: Get all resources
    console.log('1️⃣ Testing GET /resources');
    const resourcesResponse = await makeRequest('GET', '/resources');
    console.log(`Status: ${resourcesResponse.status}`);
    console.log(`Resources: ${resourcesResponse.data.data?.length || 0} found`);
    console.log('');

    // Test 2: Get all projects
    console.log('2️⃣ Testing GET /projects');
    const projectsResponse = await makeRequest('GET', '/projects');
    console.log(`Status: ${projectsResponse.status}`);
    console.log(`Projects: ${projectsResponse.data.data?.length || 0} found`);
    console.log('');

    // Test 3: Get all bookings
    console.log('3️⃣ Testing GET /bookings');
    const bookingsResponse = await makeRequest('GET', '/bookings');
    console.log(`Status: ${bookingsResponse.status}`);
    console.log(`Bookings: ${bookingsResponse.data.data?.length || 0} found`);
    console.log('');

    // Test 4: Create a new booking
    console.log('4️⃣ Testing POST /bookings');
    const newBooking = {
      resourceId: 1,
      projectId: 1,
      startDate: '2025-11-18',
      endDate: '2025-11-22',
      allocationMethod: 'hours',
      allocationValue: 6,
      type: 'hard'
    };
    const createResponse = await makeRequest('POST', '/bookings', newBooking);
    console.log(`Status: ${createResponse.status}`);
    console.log(`Message: ${createResponse.data.message || 'No message'}`);
    console.log('');

    // Test 5: Check capacity
    console.log('5️⃣ Testing POST /capacity-check');
    const capacityCheck = {
      resourceId: 1,
      startDate: '2025-11-18',
      endDate: '2025-11-22',
      dailyHours: 8
    };
    const capacityResponse = await makeRequest('POST', '/capacity-check', capacityCheck);
    console.log(`Status: ${capacityResponse.status}`);
    console.log(`Is Overbooked: ${capacityResponse.data.data?.isOverbooked || false}`);
    console.log('');

    // Test 6: Get utilization summary
    console.log('6️⃣ Testing GET /utilization');
    const utilizationResponse = await makeRequest('GET', '/utilization');
    console.log(`Status: ${utilizationResponse.status}`);
    console.log(`Resources: ${utilizationResponse.data.data?.resources?.length || 0} found`);
    console.log('');

    console.log('✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 3001');
    console.log('   Run: cd backend && npm run dev');
  }
}

// Run tests
if (require.main === module) {
  testResourcePlanningAPI();
}

module.exports = { testResourcePlanningAPI };