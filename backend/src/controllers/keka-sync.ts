/**
 * Keka Sync Controller
 * 
 * Handles API endpoints for Keka data synchronization
 * Provides endpoints to manually trigger syncs and check sync status
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { KekaClientsSyncService } from '../integrations/keka-clients-sync';
import { KekaProjectsSyncService } from '../integrations/keka-projects-sync';
import { KekaEmployeesSyncService } from '../integrations/keka-employees-sync';
import { getKekaClient } from '../integrations/keka';
import { SyncTrackingService } from '../services/sync-tracking';

// Lazy service initialization
let clientsSyncService: KekaClientsSyncService | null = null;
let projectsSyncService: KekaProjectsSyncService | null = null;
let employeesSyncService: KekaEmployeesSyncService | null = null;
let syncTrackingService: SyncTrackingService | null = null;

const getClientsSyncService = () => {
  if (!clientsSyncService) {
    clientsSyncService = new KekaClientsSyncService();
  }
  return clientsSyncService;
};

const getProjectsSyncService = () => {
  if (!projectsSyncService) {
    projectsSyncService = new KekaProjectsSyncService();
  }
  return projectsSyncService;
};

const getEmployeesSyncService = () => {
  if (!employeesSyncService) {
    employeesSyncService = new KekaEmployeesSyncService();
  }
  return employeesSyncService;
};

const getSyncTrackingService = () => {
  if (!syncTrackingService) {
    syncTrackingService = new SyncTrackingService();
  }
  return syncTrackingService;
};

const router = Router();

/**
 * POST /api/keka/sync/test
 * Test Keka API connection
 */
router.post('/sync/test', authMiddleware, async (_req: Request, res: Response) => {
  try {
    console.log('🧪 Testing Keka connection...');
    const kekaClient = getKekaClient();
    const isConnected = await kekaClient.testConnection();

    if (isConnected) {
      return res.json({
        success: true,
        message: '✅ Keka API connection successful',
      });
    } else {
      return res.status(503).json({
        success: false,
        message: '❌ Keka API connection failed',
      });
    }
  } catch (error: any) {
    console.error('❌ Keka test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing Keka connection',
      error: error.message,
    });
  }
});

/**
 * POST /api/keka/sync/clients
 * Sync clients from Keka PSA API
 */
router.post('/sync/clients', authMiddleware, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    console.log(`📥 Syncing clients for company ${companyId}...`);

    const syncService = getClientsSyncService();
    const result = await syncService.syncClients(companyId);

    const statusCode = result.success ? 200 : 207; // 207 Multi-Status if partial failure
    return res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('❌ Clients sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error syncing clients',
      error: error.message,
    });
  }
});

/**
 * POST /api/keka/sync/projects
 * Sync projects from Keka PSA API
 */
router.post('/sync/projects', authMiddleware, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    console.log(`📥 Syncing projects for company ${companyId}...`);

    const syncService = getProjectsSyncService();
    const result = await syncService.syncProjects(companyId);

    const statusCode = result.success ? 200 : 207;
    return res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('❌ Projects sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error syncing projects',
      error: error.message,
    });
  }
});

/**
 * POST /api/keka/sync/employees
 * Sync employees from Keka HRIS API
 */
router.post('/sync/employees', authMiddleware, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    console.log(`📥 Syncing employees for company ${companyId}...`);

    const syncService = getEmployeesSyncService();
    const result = await syncService.syncEmployees(companyId);

    const statusCode = result.success ? 200 : 207;
    return res.status(statusCode).json(result);
  } catch (error: any) {
    console.error('❌ Employees sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error syncing employees',
      error: error.message,
    });
  }
});

/**
 * POST /api/keka/sync/all
 * Sync all data (clients, projects, employees)
 */
router.post('/sync/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
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
      success:
        clientsResult.success &&
        projectsResult.success &&
        employeesResult.success,
      clients: clientsResult,
      projects: projectsResult,
      employees: employeesResult,
      duration: `${duration}s`,
      message: 'Keka sync complete',
    });
  } catch (error: any) {
    console.error('❌ Full sync error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error syncing all data',
      error: error.message,
    });
  }
});

/**
 * GET /api/keka/sync/status
 * Get sync status for all modules
 */
router.get('/sync/status', authMiddleware, async (_req: Request, res: Response) => {
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
  } catch (error: any) {
    console.error('❌ Sync status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting sync status',
      error: error.message,
    });
  }
});

/**
 * GET /api/keka/sync/history
 * Get sync run history for the company
 */
router.get('/sync/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const entityType = req.query.entity as string | undefined;
    const limit = parseInt(req.query.limit as string) || 50;

    const syncTracking = getSyncTrackingService();
    const history = await syncTracking.getSyncHistory(companyId, entityType, limit);

    return res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('❌ Sync history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting sync history',
      error: error.message,
    });
  }
});

/**
 * GET /api/keka/sync/stats
 * Get sync statistics for the company
 */
router.get('/sync/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user.companyId;
    const syncTracking = getSyncTrackingService();
    const stats = await syncTracking.getSyncStats(companyId);

    return res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('❌ Sync stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error getting sync stats',
      error: error.message,
    });
  }
});

export default router;
