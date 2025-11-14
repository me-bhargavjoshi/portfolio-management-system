const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUser = 'portfolio_user';
const dbPassword = 'portfolio_password';
const dbName = 'portfolio_management';

function parseSQL(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let i = 0;

  while (i < sql.length) {
    const char = sql[i];
    const next = sql[i + 1];

    // Handle string literals
    if ((char === '"' || char === "'") && (i === 0 || sql[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        // Check if it's escaped
        let escapeCount = 0;
        let j = i - 1;
        while (j >= 0 && sql[j] === '\\') {
          escapeCount++;
          j--;
        }
        if (escapeCount % 2 === 0) {
          inString = false;
        }
      }
    }

    current += char;

    // Check for statement terminator
    if (char === ';' && !inString) {
      let stmt = current.trim();
      // Remove trailing semicolon
      stmt = stmt.slice(0, -1).trim();
      if (stmt.length > 0 && !stmt.startsWith('--')) {
        statements.push(stmt);
      }
      current = '';
    }

    i++;
  }

  if (current.trim().length > 0) {
    let stmt = current.trim();
    if (!stmt.startsWith('--')) {
      statements.push(stmt);
    }
  }

  return statements;
}

async function init() {
  let client;
  try {
    // Step 1: Connect as postgres superuser
    client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: '',
      database: dbName,
    });

    await client.connect();
    console.log('✅ Connected as postgres to ' + dbName);

    // Create extensions
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
      console.log('✅ Extensions created');
    } catch (e) {
      console.log('ℹ️  Extensions already exist');
    }

    // Create user
    try {
      await client.query(
        'CREATE USER ' + dbUser + ' WITH PASSWORD ' + "'" + dbPassword + "'"
      );
      console.log('✅ User ' + dbUser + ' created');
    } catch (e) {
      if (e.code === '42710') {
        console.log('ℹ️  User ' + dbUser + ' already exists');
      } else {
        throw e;
      }
    }

    // Grant permissions
    try {
      await client.query('GRANT ALL PRIVILEGES ON DATABASE ' + dbName + ' TO ' + dbUser);
      await client.query('GRANT USAGE ON SCHEMA public TO ' + dbUser);
      await client.query('GRANT CREATE ON SCHEMA public TO ' + dbUser);
      await client.query(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ' + dbUser
      );
      await client.query(
        'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ' + dbUser
      );
      console.log('✅ Permissions granted to ' + dbUser);
    } catch (e) {
      console.log('ℹ️  Permissions already set');
    }

    await client.end();
    console.log('');

    // Step 2: Connect as portfolio_user
    client = new Client({
      host: 'localhost',
      port: 5432,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });

    await client.connect();
    console.log('✅ Connected as ' + dbUser);

    // Read schema file
    const schemaPath = path.join(__dirname, '../..', 'database/init.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');

    // Remove CREATE EXTENSION lines and full-line comments
    schema = schema
      .split('\n')
      .filter(
        (line) =>
          !line.includes('CREATE EXTENSION') &&
          !line.startsWith('--')
      )
      .join('\n');

    // Parse statements
    const statements = parseSQL(schema);
    console.log('📝 Loaded ' + statements.length + ' SQL statements\n');

    // Execute each statement
    let executed = 0;
    for (let i = 0; i < statements.length; i++) {
      try {
        await client.query(statements[i]);
        executed++;

        if ((i + 1) % 5 === 0) {
          console.log('  ✓ ' + executed + '/' + statements.length + ' statements executed');
        }
      } catch (err) {
        console.error('\n❌ ERROR at statement ' + (i + 1) + '/' + statements.length);
        console.error('Message: ' + err.message);
        console.error('\nStatement (first 300 chars):');
        console.error(statements[i].substring(0, 300) + '...');
        throw err;
      }
    }

    console.log('\n✅ Successfully executed all ' + executed + ' statements\n');

    // Verify tables
    const result = await client.query(
      'SELECT COUNT(*) as cnt FROM information_schema.tables WHERE table_schema = ' +
        "'" +
        'public' +
        "'"
    );
    const tableCount = result.rows[0].cnt;

    console.log('📊 Database initialized:');
    console.log('   Tables created: ' + tableCount);
    console.log('   Database: ' + dbName);
    console.log('   User: ' + dbUser);
    console.log('   Host: localhost:5432');

    await client.end();
    console.log('\n✅ Initialization complete!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ FATAL ERROR: ' + err.message);
    console.error(err.stack);
    if (client) {
      try {
        await client.end();
      } catch (e) {}
    }
    process.exit(1);
  }
}

init();
