/**
 * Sync Scheduler Service
 * Handles automatic background syncs using node-cron
 */

import * as cron from 'node-cron';
import { KekaClientsSyncService } from '../integrations/keka-clients-sync';
import { KekaProjectsSyncService } from '../integrations/keka-projects-sync';
import { KekaEmployeesSyncService } from '../integrations/keka-employees-sync';
import { SyncTrackingService } from './sync-tracking';
import { getDatabase } from '../config/database';

export interface SyncSchedulerConfig {
  enabled: boolean;
  clientsSchedule?: string; // cron expression
  projectsSchedule?: string;
  employeesSchedule?: string;
  allSchedule?: string;
}

export class SyncSchedulerService {
  private config: SyncSchedulerConfig;
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private syncTracking = new SyncTrackingService();
  private clientsSync = new KekaClientsSyncService();
  private projectsSync = new KekaProjectsSyncService();
  private employeesSync = new KekaEmployeesSyncService();

  constructor(config: SyncSchedulerConfig) {
    this.config = config;
  }

  /**
   * Start all configured scheduled syncs
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('⏸️  Sync scheduler is disabled');
      return;
    }

    console.log('🚀 Starting sync scheduler...');

    // Schedule clients sync
    if (this.config.clientsSchedule) {
      this.scheduleSync('clients', this.config.clientsSchedule, async (companyId) => {
        return this.clientsSync.syncClients(companyId);
      });
    }

    // Schedule projects sync
    if (this.config.projectsSchedule) {
      this.scheduleSync('projects', this.config.projectsSchedule, async (companyId) => {
        return this.projectsSync.syncProjects(companyId);
      });
    }

    // Schedule employees sync
    if (this.config.employeesSchedule) {
      this.scheduleSync('employees', this.config.employeesSchedule, async (companyId) => {
        return this.employeesSync.syncEmployees(companyId);
      });
    }

    // Schedule full sync
    if (this.config.allSchedule) {
      this.scheduleSync('all', this.config.allSchedule, async (companyId) => {
        const [clientsResult, projectsResult, employeesResult] = await Promise.all([
          this.clientsSync.syncClients(companyId),
          this.projectsSync.syncProjects(companyId),
          this.employeesSync.syncEmployees(companyId),
        ]);

        return {
          success:
            clientsResult.success &&
            projectsResult.success &&
            employeesResult.success,
          synced:
            clientsResult.synced +
            projectsResult.synced +
            employeesResult.synced,
          failed:
            clientsResult.failed +
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

  /**
   * Stop all scheduled syncs
   */
  stop(): void {
    console.log('🛑 Stopping sync scheduler...');
    this.tasks.forEach((task) => task.stop());
    this.tasks.clear();
    console.log('✅ Sync scheduler stopped');
  }

  /**
   * Schedule a sync task
   */
  private scheduleSync(
    entityType: string,
    schedule: string,
    syncFn: (companyId: string) => Promise<any>
  ): void {
    if (!cron.validate(schedule)) {
      console.error(`❌ Invalid cron schedule for ${entityType}: ${schedule}`);
      return;
    }

    const task = cron.schedule(schedule, async () => {
      try {
        // Check if a sync is already running
        const companies = await this.getActiveCompanies();
        
        for (const companyId of companies) {
          const isRunning = await this.syncTracking.isSyncRunning(companyId, entityType as any);
          
          if (isRunning) {
            console.log(`⏭️  Skipping ${entityType} sync for company ${companyId} - already running`);
            continue;
          }

          console.log(`⏰ Scheduled ${entityType} sync starting for company ${companyId}...`);
          const result = await syncFn(companyId);
          console.log(`✅ Scheduled ${entityType} sync complete:`, result.message);
        }
      } catch (error: any) {
        console.error(`❌ Scheduled ${entityType} sync failed:`, error.message);
      }
    });

    this.tasks.set(entityType, task);
    console.log(`📅 Scheduled ${entityType} sync: ${schedule}`);
  }

  /**
   * Get list of active companies for scheduled syncs
   */
  private async getActiveCompanies(): Promise<string[]> {
    const pool = getDatabase();
    const result = await pool.query(
      'SELECT id FROM companies WHERE is_active = true'
    );
    return result.rows.map((row) => row.id);
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    enabled: boolean;
    tasks: Array<{ entity: string; schedule: string; isRunning: boolean }>;
  } {
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

  private getScheduleForEntity(entity: string): string {
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

// Create and export singleton instance
const config: SyncSchedulerConfig = {
  enabled: process.env.SYNC_SCHEDULER_ENABLED === 'true',
  clientsSchedule: process.env.SYNC_CLIENTS_SCHEDULE, // e.g., '0 2 * * *' (2 AM daily)
  projectsSchedule: process.env.SYNC_PROJECTS_SCHEDULE,
  employeesSchedule: process.env.SYNC_EMPLOYEES_SCHEDULE,
  allSchedule: process.env.SYNC_ALL_SCHEDULE, // e.g., '0 3 * * 0' (3 AM Sunday)
};

export const syncScheduler = new SyncSchedulerService(config);
export default syncScheduler;
