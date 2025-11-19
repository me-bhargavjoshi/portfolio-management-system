const fs = require('fs');
const path = require('path');

// Check if we have any Keka response data saved
const kekaDataFile = path.join(__dirname, 'keka-employee-sample.json');

console.log('🔍 Checking Keka employee data structure...');

// Since we may not have saved sample data, let's check the Keka integration code
const integrationFile = path.join(__dirname, 'src/integrations/keka-employees-sync.ts');

if (fs.existsSync(integrationFile)) {
  const content = fs.readFileSync(integrationFile, 'utf8');
  
  // Look for department mapping
  const departmentMatch = content.match(/department.*?:.*?(.*)/gi);
  if (departmentMatch) {
    console.log('📊 Department field mapping found:');
    departmentMatch.forEach(match => {
      console.log(`  - ${match.trim()}`);
    });
  }
  
  // Look for KekaEmployee interface
  const interfaceMatch = content.match(/interface.*KekaEmployee.*?\{([\s\S]*?)\}/);
  if (interfaceMatch) {
    console.log('\n🏗️  KekaEmployee interface structure:');
    console.log(interfaceMatch[1]);
  }
} else {
  console.log('❌ Keka integration file not found');
}

console.log('\n💡 Let\'s check common Keka employee fields...');
console.log('Common department fields in Keka:');
console.log('  - department (direct)');
console.log('  - departmentName'); 
console.log('  - departmentId');
console.log('  - division');
console.log('  - team');
console.log('  - businessUnit');
