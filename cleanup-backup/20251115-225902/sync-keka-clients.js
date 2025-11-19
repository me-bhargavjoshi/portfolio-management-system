/**
 * Sync Keka Clients Data
 * Fetch all clients from Keka PSA API and store in database
 */

const axios = require('axios');
const { Pool } = require('pg');

// Keka OAuth2 configuration
const kekaConfig = {
  clientId: 'ad066272-fc26-4cb6-8013-0c917b338282',
  clientSecret: 'L0lrngtVKLGBMimNzYNk',
  apiKey: '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
  tokenUrl: 'https://login.keka.com/connect/token'
};

// Database configuration
const dbConfig = {
  user: 'portfolio_user',
  host: 'localhost',
  database: 'portfolio_management',
  password: 'portfolio_password',
  port: 5432,
};

const pool = new Pool(dbConfig);

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
    throw error;
  }
}

async function fetchKekaClients(token, pageNumber = 1, pageSize = 50) {
  try {
    console.log(`📡 Fetching clients page ${pageNumber} (size: ${pageSize})...`);
    
    const response = await axios({
      method: 'GET',
      url: 'https://dynamicelements.keka.com/api/v1/psa/clients',
      headers: {
        'accept': 'application/json',
        'authorization': `Bearer ${token}`
      },
      params: {
        pageNumber: pageNumber,
        pageSize: pageSize
      }
    });
    
    console.log(`✅ Page ${pageNumber} fetched: ${response.data.data?.length || 0} clients`);
    return response.data;
    
  } catch (error) {
    console.error(`❌ Failed to fetch clients page ${pageNumber}:`, error.response?.status, error.response?.statusText);
    throw error;
  }
}

async function storeClientInDatabase(client, client_db) {
  try {
    const query = `
      INSERT INTO keka_clients (
        keka_client_id, name, billing_name, code, description,
        billing_address, client_contacts, additional_fields, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (company_id, keka_client_id) 
      DO UPDATE SET
        name = EXCLUDED.name,
        billing_name = EXCLUDED.billing_name,
        code = EXCLUDED.code,
        description = EXCLUDED.description,
        billing_address = EXCLUDED.billing_address,
        client_contacts = EXCLUDED.client_contacts,
        additional_fields = EXCLUDED.additional_fields,
        raw_data = EXCLUDED.raw_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id;
    `;
    
    const values = [
      client.id,                                    // keka_client_id
      client.name || null,                          // name
      client.billingName || null,                   // billing_name
      client.code || null,                          // code
      client.description || null,                   // description
      client.billingAddress ? JSON.stringify(client.billingAddress) : null, // billing_address
      client.clientContacts ? JSON.stringify(client.clientContacts) : null, // client_contacts
      client.additionalFields ? JSON.stringify(client.additionalFields) : null, // additional_fields
      JSON.stringify(client)                        // raw_data
    ];
    
    const result = await client_db.query(query, values);
    return result.rows[0].id;
    
  } catch (error) {
    console.error('❌ Error storing client:', error);
    console.error('Client data:', JSON.stringify(client, null, 2));
    throw error;
  }
}

async function syncAllKekaClients() {
  let dbClient;
  try {
    console.log('🚀 Starting Keka Clients sync...');
    
    // Get token and database connection
    const token = await getKekaToken();
    dbClient = await pool.connect();
    
    let allClients = [];
    let currentPage = 1;
    let totalRecords = 0;
    let hasMorePages = true;
    
    // Fetch all pages
    while (hasMorePages) {
      const response = await fetchKekaClients(token, currentPage, 50);
      
      if (currentPage === 1) {
        totalRecords = response.totalRecords;
        console.log(`📊 Total clients to sync: ${totalRecords}`);
      }
      
      if (response.data && response.data.length > 0) {
        allClients.push(...response.data);
        
        console.log(`📥 Collected ${allClients.length}/${totalRecords} clients`);
        
        hasMorePages = currentPage < response.totalPages;
        currentPage++;
        
        // Rate limiting
        if (hasMorePages) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } else {
        hasMorePages = false;
      }
    }
    
    console.log(`\n💾 Storing ${allClients.length} clients in database...`);
    
    let storedCount = 0;
    let updatedCount = 0;
    
    for (const client of allClients) {
      try {
        // Check if client already exists
        const existsQuery = 'SELECT id FROM keka_clients WHERE keka_client_id = $1';
        const existsResult = await dbClient.query(existsQuery, [client.id]);
        
        const isUpdate = existsResult.rows.length > 0;
        
        await storeClientInDatabase(client, dbClient);
        
        if (isUpdate) {
          updatedCount++;
        } else {
          storedCount++;
        }
        
        if ((storedCount + updatedCount) % 10 === 0) {
          console.log(`  📊 Progress: ${storedCount + updatedCount}/${allClients.length} clients processed`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to store client ${client.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Keka Clients sync completed!');
    console.log(`📊 Results:`);
    console.log(`  ✅ New clients stored: ${storedCount}`);
    console.log(`  🔄 Existing clients updated: ${updatedCount}`);
    console.log(`  📋 Total clients processed: ${storedCount + updatedCount}`);
    
    // Get final count
    const countResult = await dbClient.query('SELECT COUNT(*) as count FROM keka_clients');
    console.log(`  🗄️  Total clients in database: ${countResult.rows[0].count}`);
    
    // Show sample of stored clients
    const sampleResult = await dbClient.query(`
      SELECT name, code, billing_name, 
             CASE WHEN billing_address IS NOT NULL THEN 'Yes' ELSE 'No' END as has_billing_address,
             CASE WHEN client_contacts IS NOT NULL THEN 'Yes' ELSE 'No' END as has_contacts
      FROM keka_clients 
      ORDER BY name 
      LIMIT 5
    `);
    
    console.log('\n📋 Sample clients stored:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.name} (${row.code}) - Billing: ${row.has_billing_address}, Contacts: ${row.has_contacts}`);
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    if (dbClient) {
      dbClient.release();
    }
  }
}

// Run sync
syncAllKekaClients()
  .then(() => {
    console.log('\n✅ Keka Clients sync script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sync script failed:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });