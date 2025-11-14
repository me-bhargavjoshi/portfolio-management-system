import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface Employee {
  id: string;
  company_id: string;
  keka_employee_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
  designation?: string;
  reporting_manager_id?: string;
  billable_rate?: number;
  cost_per_hour?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEmployeeDTO {
  company_id: string;
  first_name: string;
  last_name: string;
  email: string;
  keka_employee_id?: string;
  department?: string;
  designation?: string;
  reporting_manager_id?: string;
  billable_rate?: number;
  cost_per_hour?: number;
  is_active?: boolean;
}

export interface UpdateEmployeeDTO {
  first_name?: string;
  last_name?: string;
  email?: string;
  keka_employee_id?: string;
  department?: string;
  designation?: string;
  reporting_manager_id?: string;
  billable_rate?: number;
  cost_per_hour?: number;
  date_of_exit?: Date;
  is_active?: boolean;
  skills?: string;
  notes?: string;
}

export class EmployeeService {
  constructor(private pool: Pool) {}

  /**
   * Create a new employee
   */
  async createEmployee(data: CreateEmployeeDTO): Promise<Employee> {
    const client = await this.pool.connect();
    try {
      const id = uuidv4();
      const query = `
        INSERT INTO employees (
          id, company_id, keka_employee_id, first_name, last_name, email,
          department, designation, reporting_manager_id, billable_rate, cost_per_hour,
          is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `;
      const values = [
        id,
        data.company_id,
        data.keka_employee_id || null,
        data.first_name,
        data.last_name,
        data.email,
        data.department || null,
        data.designation || null,
        data.reporting_manager_id || null,
        data.billable_rate || null,
        data.cost_per_hour || null,
        data.is_active ?? true,
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<Employee | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM employees WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * Get all employees
   */
  async getAllEmployees(limit: number = 100, offset: number = 0): Promise<{ employees: Employee[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const countQuery = 'SELECT COUNT(*) as count FROM employees WHERE is_active = true';
      const countResult = await client.query(countQuery);
      const total = parseInt(countResult.rows[0].count, 10);

      const query = 'SELECT * FROM employees WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2';
      const result = await client.query(query, [limit, offset]);
      
      return {
        employees: result.rows,
        total,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get employees by company ID
   */
  async getEmployeesByCompanyId(companyId: string, limit: number = 100, offset: number = 0): Promise<{ employees: Employee[]; total: number }> {
    const client = await this.pool.connect();
    try {
      const countQuery = 'SELECT COUNT(*) as count FROM employees WHERE company_id = $1 AND is_active = true';
      const countResult = await client.query(countQuery, [companyId]);
      const total = parseInt(countResult.rows[0].count, 10);

      const query = 'SELECT * FROM employees WHERE company_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      const result = await client.query(query, [companyId, limit, offset]);
      
      return {
        employees: result.rows,
        total,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get active employees count
   */
  async getActiveEmployeesCount(companyId?: string): Promise<number> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT COUNT(*) as count FROM employees WHERE is_active = true';
      let values: unknown[] = [];
      
      if (companyId) {
        query += ' AND company_id = $1';
        values = [companyId];
      }

      const result = await client.query(query, values);
      return parseInt(result.rows[0].count, 10);
    } finally {
      client.release();
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, data: UpdateEmployeeDTO): Promise<Employee | null> {
    const client = await this.pool.connect();
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
      let paramCount = 1;

      if (data.first_name !== undefined) {
        updates.push(`first_name = $${paramCount++}`);
        values.push(data.first_name);
      }
      if (data.last_name !== undefined) {
        updates.push(`last_name = $${paramCount++}`);
        values.push(data.last_name);
      }
      if (data.email !== undefined) {
        updates.push(`email = $${paramCount++}`);
        values.push(data.email);
      }
      if (data.keka_employee_id !== undefined) {
        updates.push(`keka_employee_id = $${paramCount++}`);
        values.push(data.keka_employee_id);
      }
      if (data.department !== undefined) {
        updates.push(`department = $${paramCount++}`);
        values.push(data.department);
      }
      if (data.designation !== undefined) {
        updates.push(`designation = $${paramCount++}`);
        values.push(data.designation);
      }
      if (data.reporting_manager_id !== undefined) {
        updates.push(`reporting_manager_id = $${paramCount++}`);
        values.push(data.reporting_manager_id);
      }
      if (data.billable_rate !== undefined) {
        updates.push(`billable_rate = $${paramCount++}`);
        values.push(data.billable_rate);
      }
      if (data.cost_per_hour !== undefined) {
        updates.push(`cost_per_hour = $${paramCount++}`);
        values.push(data.cost_per_hour);
      }
      if (data.is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(data.is_active);
      }

      if (updates.length === 0) {
        return await this.getEmployeeById(id);
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);

      const query = `UPDATE employees SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await client.query(query, values);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * Delete employee
   */
  async deleteEmployee(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM employees WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } finally {
      client.release();
    }
  }

  /**
   * Search employees by name or email
   */
  async searchEmployees(query: string, limit: number = 50): Promise<Employee[]> {
    const client = await this.pool.connect();
    try {
      const sql = `
        SELECT * FROM employees 
        WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
        ORDER BY first_name ASC
        LIMIT $2
      `;
      const result = await client.query(sql, [`%${query}%`, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(department: string, companyId?: string, limit: number = 50): Promise<Employee[]> {
    const client = await this.pool.connect();
    try {
      let query = 'SELECT * FROM employees WHERE department = $1';
      let values: unknown[] = [department];

      if (companyId) {
        query += ' AND company_id = $2';
        values.push(companyId);
      }

      query += ' ORDER BY first_name ASC LIMIT $' + (values.length + 1);
      values.push(limit);

      const result = await client.query(query, values);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
