const { getKekaClient } = require('./dist/integrations/keka.js');

async function checkKekaBillingData() {
  try {
    console.log('🔍 Fetching Keka project data to check billing fields...');
    
    // Build first to ensure compiled code exists
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec('npm run build', (error, stdout, stderr) => {
        if (error) {
          console.log('Build output:', stdout);
          reject(error);
        } else {
          resolve();
        }
      });
    });
    
    console.log('✅ Build complete, fetching Keka data...');
    
    const kekaClient = getKekaClient();
    const response = await kekaClient.getProjects();
    
    if (response.success && response.data && response.data.length > 0) {
      const firstProject = response.data[0];
      
      console.log('\n📊 Sample Keka project data:');
      console.log(`  - Project: ${firstProject.name}`);
      console.log(`  - isBillable: ${firstProject.isBillable}`);
      console.log(`  - billingType: ${firstProject.billingType}`);
      console.log(`  - budget: ${firstProject.budget}`);
      
      // Check how many projects have billing data
      let billableCount = 0;
      let billingTypeCount = 0;
      
      response.data.forEach(project => {
        if (project.isBillable !== undefined && project.isBillable !== null) {
          billableCount++;
        }
        if (project.billingType !== undefined && project.billingType !== null) {
          billingTypeCount++;
        }
      });
      
      console.log('\n💰 Billing data availability:');
      console.log(`  - Total projects: ${response.data.length}`);
      console.log(`  - Projects with isBillable: ${billableCount}`);
      console.log(`  - Projects with billingType: ${billingTypeCount}`);
      
      if (billingTypeCount > 0) {
        console.log('\n✅ Keka provides billingType data - we can add the column!');
        
        // Show billing type distribution
        const billingTypes = {};
        response.data.forEach(project => {
          if (project.billingType !== undefined && project.billingType !== null) {
            const type = project.billingType;
            billingTypes[type] = (billingTypes[type] || 0) + 1;
          }
        });
        
        console.log('\n📈 Billing type distribution:');
        Object.entries(billingTypes).forEach(([type, count]) => {
          const typeName = type === '0' ? 'Non-billable' : 
                          type === '1' ? 'Fixed-price' : 
                          type === '2' ? 'Time & Material' : `Type ${type}`;
          console.log(`  - ${typeName} (${type}): ${count} projects`);
        });
      } else {
        console.log('\n❌ Keka does not provide billingType data - skip adding column');
      }
      
    } else {
      console.log('❌ No project data found or API call failed');
      console.log('Response:', {success: response.success, error: response.error});
    }
    
  } catch (error) {
    console.error('❌ Error fetching Keka data:', error.message);
  }
}

checkKekaBillingData();
