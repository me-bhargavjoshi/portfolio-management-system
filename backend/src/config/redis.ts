import { createClient } from 'redis';
import config from './index';

let redis: any;
let isConnected = false;

export const initRedis = async (): Promise<typeof redis> => {
  redis = createClient({
    url: config.redisUrl,
    socket: {
      reconnectStrategy: () => 5000,
      connectTimeout: 3000, // 3 second timeout
    },
  });

  redis.on('error', (err: Error) => {
    console.warn('Redis error (optional service):', err.message);
  });

  redis.on('connect', () => {
    console.log('Redis connection successful');
    isConnected = true;
  });

  // Try to connect but don't wait forever
  try {
    const connectPromise = redis.connect();
    // Set a timeout for the connection attempt
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis connect timeout')), 3000)
    );
    
    Promise.race([connectPromise, timeoutPromise])
      .then(() => {
        isConnected = true;
        console.log('Redis connected successfully');
      })
      .catch((err) => {
        console.warn('Redis connection skipped (optional service):', err.message);
        // Don't throw - Redis is optional
      });
  } catch (err) {
    console.warn('Redis initialization failed (optional service):', (err as Error).message);
  }

  return redis;
};

export const getRedis = (): typeof redis => {
  if (!redis || !isConnected) {
    return null;
  }
  return redis;
};

export const closeRedis = async (): Promise<void> => {
  if (redis && isConnected) {
    try {
      await redis.disconnect();
      console.log('Redis connection closed');
    } catch (err) {
      console.warn('Error closing Redis:', (err as Error).message);
    }
  }
};

export const isRedisConnected = (): boolean => {
  return isConnected;
};
