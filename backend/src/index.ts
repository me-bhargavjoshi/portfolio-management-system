import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import config from './config';
import { initDatabase, closeDatabase } from './config/database';
import { initRedis, closeRedis } from './config/redis';
import { createRoutes } from './routes';
import { errorHandler } from './middleware/auth';
import { syncScheduler } from './services/sync-scheduler';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize services
let isInitialized = false;

const initialize = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized');
    
    console.log('Initializing Redis...');
    await initRedis();
    console.log('Redis initialization complete');
    
    isInitialized = true;
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
};

// Routes
createRoutes(app);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    await initialize();

    app.listen(config.port, () => {
      console.log(`Portfolio Management API running on port ${config.port}`);
      console.log(`Environment: ${config.nodeEnv}`);
      
      // Start background sync scheduler
      syncScheduler.start();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  syncScheduler.stop();
  await closeDatabase();
  await closeRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  syncScheduler.stop();
  await closeDatabase();
  await closeRedis();
  process.exit(0);
});

startServer();

export default app;
