"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KekaClientController = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    user: process.env.DB_USER || 'portfolio_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'portfolio_management',
    password: process.env.DB_PASSWORD || 'portfolio_pass',
    port: parseInt(process.env.DB_PORT || '5432'),
});
class KekaClientController {
    static async getClients(req, res) {
        try {
            const { page = 1, limit = 50, search } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = `
        SELECT 
          keka_client_id as id,
          name,
          billing_name,
          code,
          description,
          billing_address,
          client_contacts,
          additional_fields,
          raw_data
        FROM keka_clients 
        WHERE 1=1
      `;
            const params = [];
            let paramCounter = 1;
            if (search) {
                query += ` AND (name ILIKE $${paramCounter} OR code ILIKE $${paramCounter})`;
                params.push(`%${search}%`);
                paramCounter++;
            }
            query += ` ORDER BY name LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
            params.push(Number(limit), offset);
            const result = await pool.query(query, params);
            let countQuery = `SELECT COUNT(*) FROM keka_clients WHERE 1=1`;
            const countParams = [];
            let countParamCounter = 1;
            if (search) {
                countQuery += ` AND (name ILIKE $${countParamCounter} OR code ILIKE $${countParamCounter})`;
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
            console.error('Get clients error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch clients',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getClientById(req, res) {
        try {
            const { id } = req.params;
            const query = `
        SELECT 
          keka_client_id as id,
          name,
          billing_name,
          code,
          description,
          billing_address,
          client_contacts,
          additional_fields,
          raw_data
        FROM keka_clients 
        WHERE keka_client_id = $1
      `;
            const result = await pool.query(query, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Client not found'
                });
            }
            return res.json({
                success: true,
                data: result.rows[0]
            });
        }
        catch (error) {
            console.error('Get client by ID error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch client',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getClientProjects(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.query;
            let query = `
        SELECT 
          kp.keka_project_id as id,
          kp.raw_data->>'name' as name,
          kp.code,
          kp.start_date,
          kp.end_date,
          kp.status,
          kp.is_billable,
          kp.billing_type,
          kp.project_budget,
          kp.budgeted_time,
          kp.project_managers,
          kp.raw_data
        FROM keka_projects kp
        WHERE kp.keka_client_id = $1
      `;
            const params = [id];
            let paramCounter = 2;
            if (status) {
                query += ` AND kp.status = $${paramCounter}`;
                params.push(status);
                paramCounter++;
            }
            query += ` ORDER BY kp.start_date DESC`;
            const result = await pool.query(query, params);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Get client projects error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch client projects',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getClientAnalytics(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            const projectsQuery = `
        SELECT 
          COUNT(*) as total_projects,
          COUNT(CASE WHEN status = 1 THEN 1 END) as active_projects,
          SUM(project_budget) as total_budget,
          SUM(budgeted_time) as total_budgeted_hours
        FROM keka_projects 
        WHERE keka_client_id = $1
      `;
            const projectsResult = await pool.query(projectsQuery, [id]);
            let timeEntriesQuery = `
        SELECT 
          SUM(kte.hours_worked) as total_hours,
          COUNT(*) as total_entries,
          COUNT(DISTINCT kte.keka_employee_id) as unique_employees
        FROM keka_task_time_entries kte
        JOIN keka_projects kp ON kte.keka_project_id = kp.keka_project_id
        WHERE kp.keka_client_id = $1
      `;
            const timeParams = [id];
            let timeParamCounter = 2;
            if (startDate) {
                timeEntriesQuery += ` AND kte.work_date >= $${timeParamCounter}`;
                timeParams.push(startDate);
                timeParamCounter++;
            }
            if (endDate) {
                timeEntriesQuery += ` AND kte.work_date <= $${timeParamCounter}`;
                timeParams.push(endDate);
            }
            const timeEntriesResult = await pool.query(timeEntriesQuery, timeParams);
            res.json({
                success: true,
                data: {
                    projects: projectsResult.rows[0],
                    timeEntries: timeEntriesResult.rows[0]
                }
            });
        }
        catch (error) {
            console.error('Get client analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch client analytics',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}
exports.KekaClientController = KekaClientController;
//# sourceMappingURL=KekaClientController.js.map