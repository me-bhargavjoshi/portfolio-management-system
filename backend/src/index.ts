import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import 'express-async-errors';
import config from './config';
import { initDatabase, closeDatabase } from './config/database';
import { initRedis, closeRedis } from './config/redis';
import { createRoutes } from './routes';
import { errorHandler } from './middleware/auth';
import { syncScheduler } from './services/sync-scheduler';

const app: Express = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for our UI
}));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000', 
    'http://localhost:8080',
    'https://*.azurewebsites.net',
    'https://*.azurestaticapps.net'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve the landing page at root
  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../index.html'));
  });
  
  // Serve the main app from frontend-static
  app.use('/app', express.static(path.join(__dirname, '../../frontend-static')));
  
  // Redirect /app to /app/index.html if needed
  app.get('/app', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend-static/index.html'));
  });
}

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
