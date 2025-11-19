"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRedisConnected = exports.closeRedis = exports.getRedis = exports.initRedis = void 0;
const redis_1 = require("redis");
const index_1 = __importDefault(require("./index"));
let redis;
let isConnected = false;
const initRedis = async () => {
    redis = (0, redis_1.createClient)({
        url: index_1.default.redisUrl,
        socket: {
            reconnectStrategy: () => 5000,
            connectTimeout: 3000,
        },
    });
    redis.on('error', (err) => {
        console.warn('Redis error (optional service):', err.message);
    });
    redis.on('connect', () => {
        console.log('Redis connection successful');
        isConnected = true;
    });
    try {
        const connectPromise = redis.connect();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connect timeout')), 3000));
        Promise.race([connectPromise, timeoutPromise])
            .then(() => {
            isConnected = true;
            console.log('Redis connected successfully');
        })
            .catch((err) => {
            console.warn('Redis connection skipped (optional service):', err.message);
        });
    }
    catch (err) {
        console.warn('Redis initialization failed (optional service):', err.message);
    }
    return redis;
};
exports.initRedis = initRedis;
const getRedis = () => {
    if (!redis || !isConnected) {
        return null;
    }
    return redis;
};
exports.getRedis = getRedis;
const closeRedis = async () => {
    if (redis && isConnected) {
        try {
            await redis.disconnect();
            console.log('Redis connection closed');
        }
        catch (err) {
            console.warn('Error closing Redis:', err.message);
        }
    }
};
exports.closeRedis = closeRedis;
const isRedisConnected = () => {
    return isConnected;
};
exports.isRedisConnected = isRedisConnected;
//# sourceMappingURL=redis.js.map