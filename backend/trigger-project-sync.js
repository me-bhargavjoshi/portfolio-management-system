const https = require('https');

// Generate JWT token
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: '123e4567-e89b-12d3-a456-426614174000', companyId: '123e4567-e89b-12d3-a456-426614174000' },
  'your-secret-key-here-make-it-long-and-random-in-production',
  { expiresIn: '24h' }
);

// Make API call
const postData = JSON.stringify({
  companyId: '123e4567-e89b-12d3-a456-426614174000'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/keka-sync/projects',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${token}`
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Status:', res.statusCode);
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Raw Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(postData);
req.end();
