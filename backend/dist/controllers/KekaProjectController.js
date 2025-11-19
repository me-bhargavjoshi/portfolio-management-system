"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KekaProjectController = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    user: process.env.DB_USER || 'portfolio_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'portfolio_management',
    password: process.env.DB_PASSWORD || 'portfolio_pass',
    port: parseInt(process.env.DB_PORT || '5432'),
});
class KekaProjectController {
    static async getProjects(req, res) {
        try {
            const { page = 1, limit = 50, clientId, status, search } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = `
        SELECT 
          kp.keka_project_id as id,
          kp.keka_client_id as client_id,
          kp.raw_data->>'name' as name,
          kp.code,
          kp.start_date,
          kp.end_date,
          kp.status,
          kp.is_billable,
          kp.billing_type,
          kp.project_budget as budget,
          kp.budgeted_time,
          kp.project_managers,
          kp.is_archived,
          kc.name as client_name,
          kc.code as client_code,
          kp.raw_data
        FROM keka_projects kp
        LEFT JOIN keka_clients kc ON kp.keka_client_id = kc.keka_client_id
        WHERE 1=1
      `;
            const params = [];
            let paramCounter = 1;
            if (clientId) {
                query += ` AND kp.keka_client_id = $${paramCounter}`;
                params.push(clientId);
                paramCounter++;
            }
            if (status) {
                query += ` AND kp.status = $${paramCounter}`;
                params.push(Number(status));
                paramCounter++;
            }
            if (search) {
                query += ` AND (kp.raw_data->>'name' ILIKE $${paramCounter} OR kp.code ILIKE $${paramCounter})`;
                params.push(`%${search}%`);
                paramCounter++;
            }
            query += ` ORDER BY kp.start_date DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
            params.push(Number(limit), offset);
            const result = await pool.query(query, params);
            let countQuery = `SELECT COUNT(*) FROM keka_projects kp WHERE 1=1`;
            const countParams = [];
            let countParamCounter = 1;
            if (clientId) {
                countQuery += ` AND kp.keka_client_id = $${countParamCounter}`;
                countParams.push(clientId);
                countParamCounter++;
            }
            if (status) {
                countQuery += ` AND kp.status = $${countParamCounter}`;
                countParams.push(Number(status));
                countParamCounter++;
            }
            if (search) {
                countQuery += ` AND (kp.raw_data->>'name' ILIKE $${countParamCounter} OR kp.code ILIKE $${countParamCounter})`;
                countParams.push(`%${search}%`);
            }
            const countResult = await pool.query(countQuery, countParams);
            const totalCount = parseInt(countResult.rows[0].count);
            res.json({
                success: true,
                data: result.rows,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalCount,
                    totalPages: Math.ceil(totalCount / Number(limit))
                }
            });
        }
        catch (error) {
            console.error('Get projects error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch projects',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getProjectById(req, res) {
        try {
            const { id } = req.params;
            const query = `
        SELECT 
          kp.keka_project_id as id,
          kp.keka_client_id as client_id,
          kp.raw_data->>'name' as name,
          kp.code,
          kp.start_date,
          kp.end_date,
          kp.status,
          kp.is_billable,
          kp.billing_type,
          kp.project_budget as budget,
          kp.budgeted_time,
          kp.project_managers,
          kp.is_archived,
          kp.custom_attributes,
          kc.name as client_name,
          kc.code as client_code,
          kc.billing_address as client_billing_address,
          kp.raw_data
        FROM keka_projects kp
        LEFT JOIN keka_clients kc ON kp.keka_client_id = kc.keka_client_id
        WHERE kp.keka_project_id = $1
      `;
            const result = await pool.query(query, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }
            return res.json({
                success: true,
                data: result.rows[0]
            });
        }
        catch (error) {
            console.error('Get project by ID error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch project',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getProjectTasks(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.query;
            let query = `
        SELECT 
          kpt.keka_task_id as id,
          kpt.keka_project_id as project_id,
          kpt.task_name as name,
          kpt.task_description,
          kpt.estimated_hours,
          kpt.task_billing_type,
          kpt.is_active,
          kpt.raw_data
        FROM keka_project_tasks kpt
        WHERE kpt.keka_project_id = $1
      `;
            const params = [id];
            let paramCounter = 2;
            if (status) {
                query += ` AND kpt.is_active = $${paramCounter}`;
                params.push(status === 'active');
                paramCounter++;
            }
            query += ` ORDER BY kpt.raw_data->>'name'`;
            const result = await pool.query(query, params);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Get project tasks error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project tasks',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getProjectTimeEntries(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate, employeeId } = req.query;
            let query = `
        SELECT 
          kte.keka_time_entry_id as id,
          kte.work_date,
          kte.hours_worked,
          kte.comments,
          kte.is_billable,
          kte.status,
          ke.first_name || ' ' || ke.last_name as employee_name,
          ke.email as employee_email,
          kpt.task_name,
          kte.raw_data
        FROM keka_task_time_entries kte
        LEFT JOIN keka_employees ke ON kte.keka_employee_id = ke.keka_employee_id
        LEFT JOIN keka_project_tasks kpt ON kte.keka_task_id = kpt.keka_task_id
        WHERE kte.keka_project_id = $1
      `;
            const params = [id];
            let paramCounter = 2;
            if (startDate) {
                query += ` AND kte.work_date >= $${paramCounter}`;
                params.push(startDate);
                paramCounter++;
            }
            if (endDate) {
                query += ` AND kte.work_date <= $${paramCounter}`;
                params.push(endDate);
                paramCounter++;
            }
            if (employeeId) {
                query += ` AND kte.keka_employee_id = $${paramCounter}`;
                params.push(employeeId);
                paramCounter++;
            }
            query += ` ORDER BY kte.work_date DESC, ke.first_name`;
            const result = await pool.query(query, params);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Get project time entries error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch project time entries',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getProjectAnalytics(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const projectQuery = `
        SELECT 
          kp.project_budget,
          kp.budgeted_time,
          kp.start_date,
          kp.end_date,
          kp.raw_data->>'name' as name
        FROM keka_projects kp
        WHERE kp.keka_project_id = $1
      `;
            const projectResult = await pool.query(projectQuery, [id]);
            if (projectResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found'
                });
            }
            let timeQuery = `
        SELECT 
          SUM(kte.hours_worked) as total_hours,
          COUNT(*) as total_entries,
          COUNT(DISTINCT kte.keka_employee_id) as unique_employees,
          COUNT(DISTINCT kte.keka_task_id) as unique_tasks
        FROM keka_task_time_entries kte
        WHERE kte.keka_project_id = $1
      `;
            const timeParams = [id];
            let timeParamCounter = 2;
            if (startDate) {
                timeQuery += ` AND kte.work_date >= $${timeParamCounter}`;
                timeParams.push(startDate);
                timeParamCounter++;
            }
            if (endDate) {
                timeQuery += ` AND kte.work_date <= $${timeParamCounter}`;
                timeParams.push(endDate);
            }
            const timeResult = await pool.query(timeQuery, timeParams);
            const tasksQuery = `
        SELECT 
          COUNT(*) as total_tasks,
          SUM(estimated_hours) as total_estimated_hours
        FROM keka_project_tasks
        WHERE keka_project_id = $1
      `;
            const tasksResult = await pool.query(tasksQuery, [id]);
            return res.json({
                success: true,
                data: {
                    project: projectResult.rows[0],
                    timeEntries: timeResult.rows[0],
                    tasks: tasksResult.rows[0]
                }
            });
        }
        catch (error) {
            console.error('Get project analytics error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch project analytics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}
exports.KekaProjectController = KekaProjectController;
//# sourceMappingURL=KekaProjectController.js.map