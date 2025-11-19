"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncScheduler = exports.SyncSchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const keka_clients_sync_1 = require("../integrations/keka-clients-sync");
const keka_projects_sync_1 = require("../integrations/keka-projects-sync");
const keka_employees_sync_1 = require("../integrations/keka-employees-sync");
const sync_tracking_1 = require("./sync-tracking");
const database_1 = require("../config/database");
class SyncSchedulerService {
    constructor(config) {
        this.tasks = new Map();
        this.syncTracking = new sync_tracking_1.SyncTrackingService();
        this.clientsSync = new keka_clients_sync_1.KekaClientsSyncService();
        this.projectsSync = new keka_projects_sync_1.KekaProjectsSyncService();
        this.employeesSync = new keka_employees_sync_1.KekaEmployeesSyncService();
        this.config = config;
    }
    start() {
        if (!this.config.enabled) {
            console.log('⏸️  Sync scheduler is disabled');
            return;
        }
        console.log('🚀 Starting sync scheduler...');
        if (this.config.clientsSchedule) {
            this.scheduleSync('clients', this.config.clientsSchedule, async (companyId) => {
                return this.clientsSync.syncClients(companyId);
            });
        }
        if (this.config.projectsSchedule) {
            this.scheduleSync('projects', this.config.projectsSchedule, async (companyId) => {
                return this.projectsSync.syncProjects(companyId);
            });
        }
        if (this.config.employeesSchedule) {
            this.scheduleSync('employees', this.config.employeesSchedule, async (companyId) => {
                return this.employeesSync.syncEmployees(companyId);
            });
        }
        if (this.config.allSchedule) {
            this.scheduleSync('all', this.config.allSchedule, async (companyId) => {
                const [clientsResult, projectsResult, employeesResult] = await Promise.all([
                    this.clientsSync.syncClients(companyId),
                    this.projectsSync.syncProjects(companyId),
                    this.employeesSync.syncEmployees(companyId),
                ]);
                return {
                    success: clientsResult.success &&
                        projectsResult.success &&
                        employeesResult.success,
                    synced: clientsResult.synced +
                        projectsResult.synced +
                        employeesResult.synced,
                    failed: clientsResult.failed +
                        projectsResult.failed +
                        employeesResult.failed,
                    errors: [
                        ...clientsResult.errors,
                        ...projectsResult.errors,
                        ...employeesResult.errors,
                    ],
                    message: 'Full sync complete',
                };
            });
        }
        console.log(`✅ Sync scheduler started with ${this.tasks.size} scheduled tasks`);
    }
    stop() {
        console.log('🛑 Stopping sync scheduler...');
        this.tasks.forEach((task) => task.stop());
        this.tasks.clear();
        console.log('✅ Sync scheduler stopped');
    }
    scheduleSync(entityType, schedule, syncFn) {
        if (!cron.validate(schedule)) {
            console.error(`❌ Invalid cron schedule for ${entityType}: ${schedule}`);
            return;
        }
        const task = cron.schedule(schedule, async () => {
            try {
                const companies = await this.getActiveCompanies();
                for (const companyId of companies) {
                    const isRunning = await this.syncTracking.isSyncRunning(companyId, entityType);
                    if (isRunning) {
                        console.log(`⏭️  Skipping ${entityType} sync for company ${companyId} - already running`);
                        continue;
                    }
                    console.log(`⏰ Scheduled ${entityType} sync starting for company ${companyId}...`);
                    const result = await syncFn(companyId);
                    console.log(`✅ Scheduled ${entityType} sync complete:`, result.message);
                }
            }
            catch (error) {
                console.error(`❌ Scheduled ${entityType} sync failed:`, error.message);
            }
        });
        this.tasks.set(entityType, task);
        console.log(`📅 Scheduled ${entityType} sync: ${schedule}`);
    }
    async getActiveCompanies() {
        const pool = (0, database_1.getDatabase)();
        const result = await pool.query('SELECT id FROM companies WHERE is_active = true');
        return result.rows.map((row) => row.id);
    }
    getStatus() {
        const tasks = Array.from(this.tasks.entries()).map(([entity, task]) => ({
            entity,
            schedule: this.getScheduleForEntity(entity),
            isRunning: task !== null,
        }));
        return {
            enabled: this.config.enabled,
            tasks,
        };
    }
    getScheduleForEntity(entity) {
        switch (entity) {
            case 'clients':
                return this.config.clientsSchedule || 'Not configured';
            case 'projects':
                return this.config.projectsSchedule || 'Not configured';
            case 'employees':
                return this.config.employeesSchedule || 'Not configured';
            case 'all':
                return this.config.allSchedule || 'Not configured';
            default:
                return 'Unknown';
        }
    }
}
exports.SyncSchedulerService = SyncSchedulerService;
const config = {
    enabled: process.env.SYNC_SCHEDULER_ENABLED === 'true',
    clientsSchedule: process.env.SYNC_CLIENTS_SCHEDULE,
    projectsSchedule: process.env.SYNC_PROJECTS_SCHEDULE,
    employeesSchedule: process.env.SYNC_EMPLOYEES_SCHEDULE,
    allSchedule: process.env.SYNC_ALL_SCHEDULE,
};
exports.syncScheduler = new SyncSchedulerService(config);
exports.default = exports.syncScheduler;
//# sourceMappingURL=sync-scheduler.js.map