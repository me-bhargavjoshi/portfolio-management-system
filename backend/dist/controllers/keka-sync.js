"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const keka_clients_sync_1 = require("../integrations/keka-clients-sync");
const keka_projects_sync_1 = require("../integrations/keka-projects-sync");
const keka_employees_sync_1 = require("../integrations/keka-employees-sync");
const keka_1 = require("../integrations/keka");
const sync_tracking_1 = require("../services/sync-tracking");
let clientsSyncService = null;
let projectsSyncService = null;
let employeesSyncService = null;
let syncTrackingService = null;
const getClientsSyncService = () => {
    if (!clientsSyncService) {
        clientsSyncService = new keka_clients_sync_1.KekaClientsSyncService();
    }
    return clientsSyncService;
};
const getProjectsSyncService = () => {
    if (!projectsSyncService) {
        projectsSyncService = new keka_projects_sync_1.KekaProjectsSyncService();
    }
    return projectsSyncService;
};
const getEmployeesSyncService = () => {
    if (!employeesSyncService) {
        employeesSyncService = new keka_employees_sync_1.KekaEmployeesSyncService();
    }
    return employeesSyncService;
};
const getSyncTrackingService = () => {
    if (!syncTrackingService) {
        syncTrackingService = new sync_tracking_1.SyncTrackingService();
    }
    return syncTrackingService;
};
const router = (0, express_1.Router)();
router.post('/sync/test', auth_1.authMiddleware, async (_req, res) => {
    try {
        console.log('🧪 Testing Keka connection...');
        const kekaClient = (0, keka_1.getKekaClient)();
        const isConnected = await kekaClient.testConnection();
        if (isConnected) {
            return res.json({
                success: true,
                message: '✅ Keka API connection successful',
            });
        }
        else {
            return res.status(503).json({
                success: false,
                message: '❌ Keka API connection failed',
            });
        }
    }
    catch (error) {
        console.error('❌ Keka test error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error testing Keka connection',
            error: error.message,
        });
    }
});
router.post('/sync/clients', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        console.log(`📥 Syncing clients for company ${companyId}...`);
        const syncService = getClientsSyncService();
        const result = await syncService.syncClients(companyId);
        const statusCode = result.success ? 200 : 207;
        return res.status(statusCode).json(result);
    }
    catch (error) {
        console.error('❌ Clients sync error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error syncing clients',
            error: error.message,
        });
    }
});
router.post('/sync/projects', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        console.log(`📥 Syncing projects for company ${companyId}...`);
        const syncService = getProjectsSyncService();
        const result = await syncService.syncProjects(companyId);
        const statusCode = result.success ? 200 : 207;
        return res.status(statusCode).json(result);
    }
    catch (error) {
        console.error('❌ Projects sync error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error syncing projects',
            error: error.message,
        });
    }
});
router.post('/sync/employees', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        console.log(`📥 Syncing employees for company ${companyId}...`);
        const syncService = getEmployeesSyncService();
        const result = await syncService.syncEmployees(companyId);
        const statusCode = result.success ? 200 : 207;
        return res.status(statusCode).json(result);
    }
    catch (error) {
        console.error('❌ Employees sync error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error syncing employees',
            error: error.message,
        });
    }
});
router.post('/sync/all', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        console.log(`📥 Syncing all Keka data for company ${companyId}...`);
        const clientsSync = getClientsSyncService();
        const projectsSync = getProjectsSyncService();
        const employeesSync = getEmployeesSyncService();
        const startTime = Date.now();
        const [clientsResult, projectsResult, employeesResult] = await Promise.all([
            clientsSync.syncClients(companyId),
            projectsSync.syncProjects(companyId),
            employeesSync.syncEmployees(companyId),
        ]);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        return res.json({
            success: clientsResult.success &&
                projectsResult.success &&
                employeesResult.success,
            clients: clientsResult,
            projects: projectsResult,
            employees: employeesResult,
            duration: `${duration}s`,
            message: 'Keka sync complete',
        });
    }
    catch (error) {
        console.error('❌ Full sync error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error syncing all data',
            error: error.message,
        });
    }
});
router.get('/sync/status', auth_1.authMiddleware, async (_req, res) => {
    try {
        const clientsSync = getClientsSyncService();
        const projectsSync = getProjectsSyncService();
        const employeesSync = getEmployeesSyncService();
        const [clientsStatus, projectsStatus, employeesStatus] = await Promise.all([
            clientsSync.getSyncStatus(),
            projectsSync.getSyncStatus(),
            employeesSync.getSyncStatus(),
        ]);
        return res.json({
            success: true,
            clients: clientsStatus,
            projects: projectsStatus,
            employees: employeesStatus,
        });
    }
    catch (error) {
        console.error('❌ Sync status error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting sync status',
            error: error.message,
        });
    }
});
router.get('/sync/history', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const entityType = req.query.entity;
        const limit = parseInt(req.query.limit) || 50;
        const syncTracking = getSyncTrackingService();
        const history = await syncTracking.getSyncHistory(companyId, entityType, limit);
        return res.json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        console.error('❌ Sync history error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting sync history',
            error: error.message,
        });
    }
});
router.get('/sync/stats', auth_1.authMiddleware, async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const syncTracking = getSyncTrackingService();
        const stats = await syncTracking.getSyncStats(companyId);
        return res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('❌ Sync stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error getting sync stats',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=keka-sync.js.map