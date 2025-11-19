"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.getDatabase = exports.initDatabase = void 0;
const pg_1 = require("pg");
const index_1 = __importDefault(require("./index"));
let pool;
const initDatabase = async () => {
    pool = new pg_1.Pool({
        connectionString: index_1.default.databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
    pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
    });
    try {
        const client = await pool.connect();
        console.log('Database connection successful');
        client.release();
    }
    catch (error) {
        console.error('Failed to connect to database:', error);
        throw error;
    }
    return pool;
};
exports.initDatabase = initDatabase;
const getDatabase = () => {
    if (!pool) {
        throw new Error('Database not initialized. Call initDatabase first.');
    }
    return pool;
};
exports.getDatabase = getDatabase;
const closeDatabase = async () => {
    if (pool) {
        await pool.end();
        console.log('Database connection closed');
    }
};
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map