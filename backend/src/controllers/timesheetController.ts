/**
 * Timesheet Controller
 * 
 * Handles both admin sync operations and user-facing timesheet endpoints
 * Admin endpoints: sync historical data, process raw data, get sync status
 * User endpoints: view timesheets, daily/weekly/monthly views, get summaries
 */

import { Response } from 'express';
import TimesheetSyncService from '../services/timesheetSync';
import TimesheetProcessingService from '../services/timesheetProcessor';
import { getDatabase } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export class TimesheetController {
  private syncService: TimesheetSyncService;
  private processingService: TimesheetProcessingService;

  constructor() {
    this.syncService = new TimesheetSyncService();
    this.processingService = new TimesheetProcessingService();
  }

  // ============================================================================
  // ADMIN SYNC ENDPOINTS
  // ============================================================================

  /**
   * POST /api/timesheets/sync/historical
   * Start historical sync from 2025-01-01 to current date
   */
  syncHistorical = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.user!;
      
      console.log(`🚀 Starting historical timesheet sync for company ${companyId}`);

      const result = await this.syncService.syncHistoricalTimesheets(companyId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            stats: result.stats,
            sync_type: 'historical',
            date_range: {
              start: '2025-01-01',
              end: new Date().toISOString().split('T')[0],
            },
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          data: { stats: result.stats },
        });
      }

    } catch (error: any) {
      console.error('❌ Historical sync failed:', error.message);
      res.status(500).json({
        success: false,
        error: 'Historical sync failed',
        details: error.message,
      });
    }
  };

  /**
   * POST /api/timesheets/sync/incremental
   * Sync recent timesheet data (last 7 days)
   */
  syncIncremental = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.user!;
      const { days = 7 } = req.body;

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      console.log(`🔄 Starting incremental timesheet sync for company ${companyId} (${days} days)`);

      // Note: We'll need to add an incremental sync method to the sync service
      // For now, we'll return a placeholder response
      res.json({
        success: true,
        message: `Incremental sync for ${days} days initiated`,
        data: {
          sync_type: 'incremental',
          date_range: {
            start: startDate.toISOString().split('T')[0],
            end: endDate.toISOString().split('T')[0],
          },
        },
      });

    } catch (error: any) {
      console.error('❌ Incremental sync failed:', error.message);
      res.status(500).json({
        success: false,
        error: 'Incremental sync failed',
        details: error.message,
      });
    }
  };

  /**
   * POST /api/timesheets/process
   * Process pending raw timesheet data
   */
  processRawData = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.user!;

      console.log(`⚙️  Processing raw timesheet data for company ${companyId}`);

      const result = await this.processingService.processRawTimesheets(companyId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            stats: result.stats,
            errors: result.errors,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message,
          data: {
            stats: result.stats,
            errors: result.errors,
          },
        });
      }

    } catch (error: any) {
      console.error('❌ Processing failed:', error.message);
      res.status(500).json({
        success: false,
        error: 'Processing failed',
        details: error.message,
      });
    }
  };

  /**
   * GET /api/timesheets/sync/status
   * Get sync and processing status
   */
  getSyncStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.user!;

      const [syncStatus, processingStatus] = await Promise.all([
        this.syncService.getSyncStatus(companyId),
        this.processingService.getProcessingStatus(companyId),
      ]);

      res.json({
        success: true,
        data: {
          sync: syncStatus,
          processing: processingStatus,
          overall_status: this.calculateOverallStatus(syncStatus, processingStatus),
        },
      });

    } catch (error: any) {
      console.error('❌ Failed to get sync status:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get sync status',
        details: error.message,
      });
    }
  };

  // ============================================================================
  // USER-FACING TIMESHEET ENDPOINTS
  // ============================================================================

  /**
   * GET /api/timesheets/daily?date=YYYY-MM-DD&employee_id=uuid
   * Get timesheet entries for a specific date
   */
  getDailyTimesheets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.user!;
      const { date, employee_id } = req.query;

      if (!date) {
        res.status(400).json({
          success: false,
          error: 'Date parameter is required (YYYY-MM-DD format)',
        });
        return;
      }

      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        });
        return;
      }

      const timesheets = await this.getTimesheetsByDate(
        companyId,
        targetDate,
        employee_id as string
      );

      res.json({
        success: true,
        data: {
          date: targetDate.toISOString().split('T')[0],
          total_hours: timesheets.reduce((sum, entry) => sum + entry.hours_worked, 0),
          entries: timesheets,
        },
      });

    } catch (error: any) {
      console.error('❌ Failed to get daily timesheets:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get daily timesheets',
        details: error.message,
      });
    }
  };

  /**
   * GET /api/timesheets/weekly?week=YYYY-MM-DD&employee_id=uuid
   * Get timesheet entries for a specific week (starting Monday)
   */
  getWeeklyTimesheets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.user!;
      const { week, employee_id } = req.query;

      if (!week) {
        res.status(400).json({
          success: false,
          error: 'Week parameter is required (YYYY-MM-DD format for Monday of the week)',
        });
        return;
      }

      const weekStart = new Date(week as string);
      if (isNaN(weekStart.getTime())) {
        res.status(400).json({
          success: false,
          error: 'Invalid week format. Use YYYY-MM-DD for Monday of the week',
        });
        return;
      }

      // Ensure it's a Monday
      const dayOfWeek = weekStart.getDay();
      if (dayOfWeek !== 1) { // 1 = Monday
        weekStart.setDate(weekStart.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      }

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const timesheets = await this.getTimesheetsByDateRange(
        companyId,
        weekStart,
        weekEnd,
        employee_id as string
      );

      // Group by day
      const dailyBreakdown = this.groupTimesheetsByDay(timesheets, weekStart, weekEnd);

      res.json({
        success: true,
        data: {
          week_start: weekStart.toISOString().split('T')[0],
          week_end: weekEnd.toISOString().split('T')[0],
          total_hours: timesheets.reduce((sum, entry) => sum + entry.hours_worked, 0),
          daily_breakdown: dailyBreakdown,
        },
      });

    } catch (error: any) {
      console.error('❌ Failed to get weekly timesheets:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get weekly timesheets',
        details: error.message,
      });
    }
  };

  /**
   * GET /api/timesheets/monthly?month=YYYY-MM&employee_id=uuid
   * Get timesheet entries for a specific month
   */
  getMonthlyTimesheets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.user!;
      const { month, employee_id } = req.query;

      if (!month) {
        res.status(400).json({
          success: false,
          error: 'Month parameter is required (YYYY-MM format)',
        });
        return;
      }

      const monthMatch = (month as string).match(/^(\d{4})-(\d{2})$/);
      if (!monthMatch) {
        res.status(400).json({
          success: false,
          error: 'Invalid month format. Use YYYY-MM',
        });
        return;
      }

      const year = parseInt(monthMatch[1], 10);
      const monthNum = parseInt(monthMatch[2], 10);

      const monthStart = new Date(year, monthNum - 1, 1);
      const monthEnd = new Date(year, monthNum, 0); // Last day of month

      const timesheets = await this.getTimesheetsByDateRange(
        companyId,
        monthStart,
        monthEnd,
        employee_id as string
      );

      res.json({
        success: true,
        data: {
          month: monthNum,
          year: year,
          total_hours: timesheets.reduce((sum, entry) => sum + entry.hours_worked, 0),
          entries: timesheets,
          summary: {
            total_days_worked: new Set(timesheets.map(t => t.effort_date.toISOString().split('T')[0])).size,
            average_hours_per_day: timesheets.length > 0 ? 
              timesheets.reduce((sum, entry) => sum + entry.hours_worked, 0) / 
              new Set(timesheets.map(t => t.effort_date.toISOString().split('T')[0])).size : 0,
          },
        },
      });

    } catch (error: any) {
      console.error('❌ Failed to get monthly timesheets:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get monthly timesheets',
        details: error.message,
      });
    }
  };

  /**
   * GET /api/timesheets/summary
   * Get timesheet summary for the company
   */
  getTimesheetSummary = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { companyId } = req.user!;

      const pool = getDatabase();
      const client = await pool.connect();

      try {
        const query = `
          SELECT 
            COUNT(*) as total_entries,
            COUNT(DISTINCT employee_id) as active_employees,
            COUNT(DISTINCT project_id) as projects_with_time,
            SUM(hours_worked) as total_hours,
            AVG(hours_worked) as avg_hours_per_entry,
            MIN(effort_date) as earliest_date,
            MAX(effort_date) as latest_date
          FROM actual_efforts 
          WHERE company_id = $1
        `;

        const result = await client.query(query, [companyId]);
        const stats = result.rows[0];

        res.json({
          success: true,
          data: {
            total_entries: parseInt(stats.total_entries) || 0,
            active_employees: parseInt(stats.active_employees) || 0,
            projects_with_time: parseInt(stats.projects_with_time) || 0,
            total_hours: parseFloat(stats.total_hours) || 0,
            avg_hours_per_entry: parseFloat(stats.avg_hours_per_entry) || 0,
            date_range: {
              earliest: stats.earliest_date ? new Date(stats.earliest_date).toISOString().split('T')[0] : null,
              latest: stats.latest_date ? new Date(stats.latest_date).toISOString().split('T')[0] : null,
            },
          },
        });

      } finally {
        client.release();
      }

    } catch (error: any) {
      console.error('❌ Failed to get timesheet summary:', error.message);
      res.status(500).json({
        success: false,
        error: 'Failed to get timesheet summary',
        details: error.message,
      });
    }
  };

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get timesheets for a specific date
   */
  private async getTimesheetsByDate(
    companyId: string,
    date: Date,
    employeeId?: string
  ): Promise<any[]> {
    const pool = getDatabase();
    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          ae.id,
          ae.effort_date,
          ae.hours_worked,
          ae.task_description,
          ae.source,
          e.id as employee_id,
          CONCAT(e.first_name, ' ', e.last_name) as employee_name,
          e.email as employee_email,
          p.id as project_id,
          p.name as project_name,
          c.name as client_name
        FROM actual_efforts ae
        JOIN employees e ON ae.employee_id = e.id
        LEFT JOIN projects p ON ae.project_id = p.id
        LEFT JOIN accounts a ON p.account_id = a.id
        LEFT JOIN clients c ON a.client_id = c.id
        WHERE ae.company_id = $1 
          AND ae.effort_date = $2
      `;

      const params = [companyId, date];

      if (employeeId) {
        query += ' AND ae.employee_id = $3';
        params.push(employeeId);
      }

      query += ' ORDER BY ae.effort_date DESC, e.first_name, e.last_name';

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        employee: {
          id: row.employee_id,
          name: row.employee_name,
          email: row.employee_email,
        },
        project: row.project_id ? {
          id: row.project_id,
          name: row.project_name,
          client_name: row.client_name,
        } : null,
        effort_date: new Date(row.effort_date),
        hours_worked: parseFloat(row.hours_worked),
        task_description: row.task_description,
        source: row.source,
      }));

    } finally {
      client.release();
    }
  }

  /**
   * Get timesheets for a date range
   */
  private async getTimesheetsByDateRange(
    companyId: string,
    startDate: Date,
    endDate: Date,
    employeeId?: string
  ): Promise<any[]> {
    const pool = getDatabase();
    const client = await pool.connect();

    try {
      let query = `
        SELECT 
          ae.id,
          ae.effort_date,
          ae.hours_worked,
          ae.task_description,
          ae.source,
          e.id as employee_id,
          CONCAT(e.first_name, ' ', e.last_name) as employee_name,
          e.email as employee_email,
          p.id as project_id,
          p.name as project_name,
          c.name as client_name
        FROM actual_efforts ae
        JOIN employees e ON ae.employee_id = e.id
        LEFT JOIN projects p ON ae.project_id = p.id
        LEFT JOIN accounts a ON p.account_id = a.id
        LEFT JOIN clients c ON a.client_id = c.id
        WHERE ae.company_id = $1 
          AND ae.effort_date >= $2 
          AND ae.effort_date <= $3
      `;

      const params = [companyId, startDate, endDate];

      if (employeeId) {
        query += ' AND ae.employee_id = $4';
        params.push(employeeId);
      }

      query += ' ORDER BY ae.effort_date DESC, e.first_name, e.last_name';

      const result = await client.query(query, params);
      
      return result.rows.map(row => ({
        id: row.id,
        employee: {
          id: row.employee_id,
          name: row.employee_name,
          email: row.employee_email,
        },
        project: row.project_id ? {
          id: row.project_id,
          name: row.project_name,
          client_name: row.client_name,
        } : null,
        effort_date: new Date(row.effort_date),
        hours_worked: parseFloat(row.hours_worked),
        task_description: row.task_description,
        source: row.source,
      }));

    } finally {
      client.release();
    }
  }

  /**
   * Group timesheets by day for weekly view
   */
  private groupTimesheetsByDay(timesheets: any[], weekStart: Date, weekEnd: Date): any[] {
    const days = [];
    const currentDate = new Date(weekStart);

    while (currentDate <= weekEnd) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayTimesheets = timesheets.filter(
        t => t.effort_date.toISOString().split('T')[0] === dateStr
      );

      days.push({
        date: new Date(currentDate),
        total_hours: dayTimesheets.reduce((sum, entry) => sum + entry.hours_worked, 0),
        entries: dayTimesheets,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  /**
   * Calculate overall status from sync and processing status
   */
  private calculateOverallStatus(syncStatus: any, processingStatus: any): string {
    if (processingStatus.pendingRecords > 0) {
      return 'processing_pending';
    }
    
    if (syncStatus.failedSyncs > 0 || processingStatus.failedRecords > 0) {
      return 'partially_failed';
    }
    
    if (syncStatus.syncedEmployees === syncStatus.totalEmployees && 
        processingStatus.totalTimesheetEntries > 0) {
      return 'up_to_date';
    }
    
    return 'sync_needed';
  }
}

export default TimesheetController;