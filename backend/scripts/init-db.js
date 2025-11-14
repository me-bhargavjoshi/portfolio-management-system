#!/usr/bin/env node

/**
 * Database Initialization Script
 * Creates database and runs schema if it doesn't exist
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Default connection params (adjust if your local Postgres differs)
const defaultConfig = {
  host: 'localhost',
  port: 5432,
  user: 'postgres', // default Postgres.app user
  password: 'postgres', // default Postgres.app password (may be empty)
};

const dbName = 'portfolio_management';
const dbUser = 'portfolio_user';
const dbPassword = 'portfolio_password';

async function initializeDatabase() {
  let client;

  try {
    console.log('📦 Connecting to Postgres (default config)...');
    
    // First, connect to postgres db to create our custom db
    client = new Client({
      ...defaultConfig,
      database: 'postgres',
    });

    await client.connect();
    console.log('✅ Connected to Postgres');

    // Check if database exists
    const dbCheckResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (dbCheckResult.rows.length === 0) {
      console.log(`📝 Creating database '${dbName}'...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database '${dbName}' created`);
    } else {
      console.log(`✅ Database '${dbName}' already exists`);
    }

    // Check if user exists
    const userCheckResult = await client.query(
      `SELECT 1 FROM pg_user WHERE usename = $1`,
      [dbUser]
    );

    if (userCheckResult.rows.length === 0) {
      console.log(`📝 Creating user '${dbUser}'...`);
      await client.query(
        `CREATE USER ${dbUser} WITH PASSWORD $1`,
        [dbPassword]
      );
      console.log(`✅ User '${dbUser}' created`);
    } else {
      console.log(`✅ User '${dbUser}' already exists`);
    }

    // Grant privileges
    console.log(`📝 Granting privileges...`);
    await client.query(`GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser}`);
    console.log(`✅ Privileges granted`);

    await client.end();

    // Now connect to the new database and run schema
    console.log(`\n📝 Loading schema into '${dbName}'...`);
    
    client = new Client({
      host: 'localhost',
      port: 5432,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });

    await client.connect();
    console.log(`✅ Connected to '${dbName}'`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../database/init.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log(`📝 Executing schema (${schema.length} bytes)...`);
    await client.query(schema);
    console.log(`✅ Schema loaded successfully`);

    await client.end();

    console.log('\n🎉 Database initialization complete!');
    console.log(`\nConnection string for .env:`);
    console.log(`DATABASE_URL=postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during initialization:', error.message);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

initializeDatabase();
