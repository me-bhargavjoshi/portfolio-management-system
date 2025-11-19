"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
require("express-async-errors");
const config_1 = __importDefault(require("./config"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const routes_1 = require("./routes");
const auth_1 = require("./middleware/auth");
const sync_scheduler_1 = require("./services/sync-scheduler");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
let isInitialized = false;
const initialize = async () => {
    if (isInitialized)
        return;
    try {
        console.log('Initializing database...');
        await (0, database_1.initDatabase)();
        console.log('Database initialized');
        console.log('Initializing Redis...');
        await (0, redis_1.initRedis)();
        console.log('Redis initialization complete');
        isInitialized = true;
        console.log('All services initialized successfully');
    }
    catch (error) {
        console.error('Failed to initialize services:', error);
        throw error;
    }
};
(0, routes_1.createRoutes)(app);
app.use(auth_1.errorHandler);
const startServer = async () => {
    try {
        await initialize();
        app.listen(config_1.default.port, () => {
            console.log(`Portfolio Management API running on port ${config_1.default.port}`);
            console.log(`Environment: ${config_1.default.nodeEnv}`);
            sync_scheduler_1.syncScheduler.start();
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    sync_scheduler_1.syncScheduler.stop();
    await (0, database_1.closeDatabase)();
    await (0, redis_1.closeRedis)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    sync_scheduler_1.syncScheduler.stop();
    await (0, database_1.closeDatabase)();
    await (0, redis_1.closeRedis)();
    process.exit(0);
});
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map