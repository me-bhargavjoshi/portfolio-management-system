import { Pool } from 'pg';
import config from './index';

let pool: Pool;

export const initDatabase = async (): Promise<Pool> => {
  // Azure Database for PostgreSQL configuration
  const isAzure = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.includes('postgres.database.azure.com');
  
  pool = new Pool({
    connectionString: config.databaseUrl,
    max: isAzure ? 10 : 20, // Lower connection limit for Azure
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: isAzure ? 5000 : 2000, // Longer timeout for Azure
    ssl: isAzure ? {
      rejectUnauthorized: false, // Azure Database for PostgreSQL requires SSL
    } : false,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  try {
    const client = await pool.connect();
    console.log('Database connection successful');
    client.release();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }

  return pool;
};

export const getDatabase = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return pool;
};

export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    console.log('Database connection closed');
  }
};
