const { KekaEmployeesSyncService } = require('./dist/integrations/keka-employees-sync.js');
const { getKekaClient } = require('./dist/integrations/keka.js');

async function checkKekaEmployeeFields() {
  try {
    console.log('🔍 Fetching raw Keka employee data...');
    const kekaClient = getKekaClient();
    const response = await kekaClient.getEmployees();
    
    if (response.success && response.data && response.data.length > 0) {
      const firstEmployee = response.data[0];
      console.log('\n📊 Available fields in Keka employee data:');
      console.log('Keys:', Object.keys(firstEmployee));
      
      console.log('\n🏢 Department-related fields:');
      Object.keys(firstEmployee).forEach(key => {
        if (key.toLowerCase().includes('depart') || 
            key.toLowerCase().includes('division') || 
            key.toLowerCase().includes('team') || 
            key.toLowerCase().includes('unit')) {
          console.log(`  - ${key}: ${firstEmployee[key]}`);
        }
      });
      
      console.log('\n👤 Sample employee data:');
      console.log(`  - Name: ${firstEmployee.firstName} ${firstEmployee.lastName}`);
      console.log(`  - Email: ${firstEmployee.email}`);
      console.log(`  - Department: ${firstEmployee.department}`);
      console.log(`  - Designation: ${firstEmployee.designation}`);
      
      // Check if there are nested department objects
      if (firstEmployee.department && typeof firstEmployee.department === 'object') {
        console.log('  - Department is an object:', firstEmployee.department);
      }
      
    } else {
      console.log('❌ No employee data found or API call failed');
      console.log('Response:', {success: response.success, error: response.error});
    }
    
  } catch (error) {
    console.error('❌ Error fetching Keka data:', error.message);
  }
}

checkKekaEmployeeFields();
