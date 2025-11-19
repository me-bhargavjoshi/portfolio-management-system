"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KekaEmployeeController = void 0;
const pg_1 = require("pg");
const pool = new pg_1.Pool({
    user: process.env.DB_USER || 'portfolio_user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'portfolio_management',
    password: process.env.DB_PASSWORD || 'portfolio_pass',
    port: parseInt(process.env.DB_PORT || '5432'),
});
class KekaEmployeeController {
    static async getEmployees(req, res) {
        try {
            const { page = 1, limit = 50, department, status = 'active' } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            let query = `
        SELECT 
          keka_employee_id as id,
          employee_number,
          first_name,
          last_name,
          display_name,
          email,
          job_title,
          department,
          location,
          employment_status,
          joining_date,
          phone_mobile as phone,
          reports_to,
          l2_manager,
          custom_fields,
          raw_data
        FROM keka_employees 
        WHERE 1=1
      `;
            const params = [];
            let paramCounter = 1;
            if (department) {
                query += ` AND department ILIKE $${paramCounter}`;
                params.push(`%${department}%`);
                paramCounter++;
            }
            if (status === 'active') {
                query += ` AND employment_status = '0'`;
            }
            query += ` ORDER BY first_name, last_name LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
            params.push(Number(limit), offset);
            const result = await pool.query(query, params);
            let countQuery = `SELECT COUNT(*) FROM keka_employees WHERE 1=1`;
            const countParams = [];
            let countParamCounter = 1;
            if (department) {
                countQuery += ` AND department ILIKE $${countParamCounter}`;
                countParams.push(`%${department}%`);
                countParamCounter++;
            }
            if (status === 'active') {
                countQuery += ` AND employment_status = '0'`;
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
            console.error('Get employees error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employees',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getEmployeeById(req, res) {
        try {
            const { id } = req.params;
            const query = `
        SELECT 
          keka_employee_id as id,
          employee_number,
          first_name,
          middle_name,
          last_name,
          display_name,
          email,
          personal_email,
          job_title,
          secondary_job_title,
          department,
          location,
          city,
          country_code,
          reports_to,
          l2_manager,
          dotted_line_manager,
          employment_status,
          account_status,
          worker_type,
          time_type,
          joining_date,
          exit_date,
          phone_work,
          phone_mobile,
          phone_home,
          date_of_birth,
          gender,
          marital_status,
          custom_fields,
          groups,
          band_info,
          pay_grade_info,
          raw_data
        FROM keka_employees 
        WHERE keka_employee_id = $1
      `;
            const result = await pool.query(query, [id]);
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Employee not found'
                });
            }
            return res.json({
                success: true,
                data: result.rows[0]
            });
        }
        catch (error) {
            console.error('Get employee by ID error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch employee',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getDepartments(_req, res) {
        try {
            const query = `
        SELECT 
          department,
          COUNT(*) as employee_count
        FROM keka_employees 
        WHERE department IS NOT NULL 
        AND employment_status = 'Active'
        GROUP BY department 
        ORDER BY department
      `;
            const result = await pool.query(query);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Get departments error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch departments',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    static async getEmployeeTimeEntries(req, res) {
        try {
            const { id } = req.params;
            const { startDate, endDate } = req.query;
            let query = `
        SELECT 
          kte.work_date,
          kte.hours_worked,
          kte.comments,
          kp.raw_data->>'name' as project_name,
          kpt.raw_data->>'name' as task_name,
          kte.is_billable,
          kte.status
        FROM keka_task_time_entries kte
        LEFT JOIN keka_projects kp ON kte.keka_project_id = kp.keka_project_id
        LEFT JOIN keka_project_tasks kpt ON kte.keka_task_id = kpt.keka_task_id
        WHERE kte.keka_employee_id = $1
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
            query += ` ORDER BY kte.work_date DESC`;
            const result = await pool.query(query, params);
            res.json({
                success: true,
                data: result.rows
            });
        }
        catch (error) {
            console.error('Get employee time entries error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch employee time entries',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
}
exports.KekaEmployeeController = KekaEmployeeController;
//# sourceMappingURL=KekaEmployeeController.js.map