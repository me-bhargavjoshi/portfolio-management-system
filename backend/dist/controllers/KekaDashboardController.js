"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KekaDashboardController = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    user: process.env.DB_USER || 'portfolio_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'portfolio_management',
    password: process.env.DB_PASSWORD || 'portfolio_pass',
    port: parseInt(process.env.DB_PORT || '5432'),
});
class KekaDashboardController {
    static async getDashboardMetrics(_req, res) {
        try {
            const query = 'SELECT * FROM portfolio_dashboard_metrics_view';
            const result = await pool.query(query);
            res.json({
                success: true,
                data: result.rows[0]
            });
        }
        catch (error) {
            console.error('Get dashboard metrics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard metrics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getRecentTimesheets(req, res) {
        try {
            const { limit = 10 } = req.query;
            const query = `
        SELECT 
          id,
          effort_date,
          hours_worked,
          entry_comments,
          employee_name,
          project_name,
          client_name,
          is_billable
        FROM portfolio_timesheet_view 
        ORDER BY effort_date DESC, created_at DESC
        LIMIT $1
      `;
            const result = await pool.query(query, [Number(limit)]);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Get recent timesheets error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch recent timesheets',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getTopProjects(req, res) {
        try {
            const { limit = 5 } = req.query;
            const query = `
        SELECT 
          project_id,
          project_name,
          client_name,
          actual_hours,
          budgeted_hours,
          total_time_entries,
          employees_worked,
          budget_utilization_percent
        FROM portfolio_project_analytics_view 
        WHERE actual_hours > 0
        ORDER BY actual_hours DESC
        LIMIT $1
      `;
            const result = await pool.query(query, [Number(limit)]);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Get top projects error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch top projects',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getEmployeeUtilization(req, res) {
        try {
            const { limit = 10 } = req.query;
            const query = `
        SELECT 
          employee_id,
          employee_name,
          department,
          total_hours_logged,
          projects_worked_on,
          billability_percent,
          avg_hours_per_day
        FROM portfolio_employee_utilization_view 
        WHERE total_hours_logged > 0
        ORDER BY total_hours_logged DESC
        LIMIT $1
      `;
            const result = await pool.query(query, [Number(limit)]);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Get employee utilization error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employee utilization',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getTimesheetAnalytics(req, res) {
        try {
            const { startDate, endDate } = req.query;
            let query = `
        SELECT 
          effort_date,
          COUNT(*) as entries_count,
          SUM(hours_worked) as total_hours,
          COUNT(DISTINCT employee_id) as unique_employees,
          COUNT(DISTINCT project_id) as unique_projects,
          SUM(CASE WHEN is_billable = true THEN hours_worked ELSE 0 END) as billable_hours
        FROM portfolio_timesheet_view
        WHERE 1=1
      `;
            const params = [];
            let paramCounter = 1;
            if (startDate) {
                query += ` AND effort_date >= $${paramCounter}`;
                params.push(startDate);
                paramCounter++;
            }
            if (endDate) {
                query += ` AND effort_date <= $${paramCounter}`;
                params.push(endDate);
                paramCounter++;
            }
            query += ` GROUP BY effort_date ORDER BY effort_date DESC`;
            const result = await pool.query(query, params);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Get timesheet analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch timesheet analytics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getAllTimesheets(req, res) {
        try {
            const { page = 1, limit = 50, employee_id, project_id, date_from, date_to } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let conditions = [];
            let params = [];
            let paramIndex = 1;
            if (employee_id) {
                conditions.push(`employee_id = $${paramIndex++}`);
                params.push(employee_id);
            }
            if (project_id) {
                conditions.push(`project_id = $${paramIndex++}`);
                params.push(project_id);
            }
            if (date_from) {
                conditions.push(`effort_date >= $${paramIndex++}`);
                params.push(date_from);
            }
            if (date_to) {
                conditions.push(`effort_date <= $${paramIndex++}`);
                params.push(date_to);
            }
            const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
            const countQuery = `
        SELECT COUNT(*) as total
        FROM portfolio_timesheet_view 
        ${whereClause}
      `;
            const countResult = await pool.query(countQuery, params);
            const total = parseInt(countResult.rows[0].total);
            const dataQuery = `
        SELECT 
          id,
          effort_date as date,
          hours_worked as hours,
          entry_comments as notes,
          employee_name,
          project_name,
          client_name,
          task_name,
          is_billable,
          'approved' as status,
          employee_id,
          project_id,
          created_at
        FROM portfolio_timesheet_view 
        ${whereClause}
        ORDER BY effort_date DESC, created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex}
      `;
            params.push(Number(limit), offset);
            const dataResult = await pool.query(dataQuery, params);
            const totalPages = Math.ceil(total / Number(limit));
            res.json({
                success: true,
                data: dataResult.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    totalPages,
                    hasNext: Number(page) < totalPages,
                    hasPrev: Number(page) > 1
                }
            });
        }
        catch (error) {
            console.error('Get all timesheets error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch timesheets',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}
exports.KekaDashboardController = KekaDashboardController;
//# sourceMappingURL=KekaDashboardController.js.map