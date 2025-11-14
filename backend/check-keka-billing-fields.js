const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Keka project billing fields...');

// Check the KekaProject interface to see what billing fields are available
const kekaFile = path.join(__dirname, 'src/integrations/keka.ts');

if (fs.existsSync(kekaFile)) {
  const content = fs.readFileSync(kekaFile, 'utf8');
  
  // Find KekaProject interface
  const interfaceMatch = content.match(/export interface KekaProject \{([\s\S]*?)\}/);
  if (interfaceMatch) {
    console.log('\n🏗️  KekaProject interface:');
    const interfaceContent = interfaceMatch[1];
    
    // Look for billing-related fields
    const lines = interfaceContent.split('\n');
    const billingFields = lines.filter(line => 
      line.toLowerCase().includes('bill') || 
      line.toLowerCase().includes('rate') ||
      line.toLowerCase().includes('type')
    );
    
    console.log('\n💰 Billing-related fields found:');
    if (billingFields.length > 0) {
      billingFields.forEach(field => {
        console.log(`  - ${field.trim()}`);
      });
    } else {
      console.log('  - No obvious billing fields found in interface');
    }
    
    // Show all available fields
    console.log('\n📋 All available KekaProject fields:');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('*') && trimmed.includes(':')) {
        console.log(`  - ${trimmed}`);
      }
    });
  }
} else {
  console.log('❌ Keka integration file not found');
}

console.log('\n💡 Common Keka billing fields to look for:');
console.log('  - billingType: number (0=Non-billable, 1=Fixed-price, 2=Time & Material)');
console.log('  - isBillable: boolean');
console.log('  - billingRate: number');
console.log('  - projectType: string');
