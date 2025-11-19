"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = void 0;
const uuid_1 = require("uuid");
class ProjectService {
    constructor(pool) {
        this.pool = pool;
    }
    async createProject(data) {
        const client = await this.pool.connect();
        try {
            const id = (0, uuid_1.v4)();
            const query = `
        INSERT INTO projects (
          id, company_id, account_id, name, description, start_date, end_date,
          budget, status, project_manager_id, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, NOW(), NOW())
        RETURNING *
      `;
            const values = [
                id,
                data.company_id,
                data.account_id,
                data.name,
                data.description || null,
                data.start_date,
                data.end_date,
                data.budget || 0,
                data.status || 'active',
                data.project_manager_id || null,
            ];
            const result = await client.query(query, values);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    async getProjectById(id) {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM projects WHERE id = $1';
            const result = await client.query(query, [id]);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    async getAllProjects(limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const countQuery = 'SELECT COUNT(*) as count FROM projects WHERE is_active = true';
            const countResult = await client.query(countQuery);
            const total = parseInt(countResult.rows[0].count, 10);
            const query = 'SELECT * FROM projects WHERE is_active = true ORDER BY start_date DESC LIMIT $1 OFFSET $2';
            const result = await client.query(query, [limit, offset]);
            return {
                projects: result.rows,
                total,
            };
        }
        finally {
            client.release();
        }
    }
    async getProjectsByCompanyId(companyId, limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const countQuery = 'SELECT COUNT(*) as count FROM projects WHERE company_id = $1 AND is_active = true';
            const countResult = await client.query(countQuery, [companyId]);
            const total = parseInt(countResult.rows[0].count, 10);
            const query = 'SELECT * FROM projects WHERE company_id = $1 AND is_active = true ORDER BY start_date DESC LIMIT $2 OFFSET $3';
            const result = await client.query(query, [companyId, limit, offset]);
            return {
                projects: result.rows,
                total,
            };
        }
        finally {
            client.release();
        }
    }
    async getProjectsByAccountId(accountId, limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const countQuery = 'SELECT COUNT(*) as count FROM projects WHERE account_id = $1 AND is_active = true';
            const countResult = await client.query(countQuery, [accountId]);
            const total = parseInt(countResult.rows[0].count, 10);
            const query = 'SELECT * FROM projects WHERE account_id = $1 AND is_active = true ORDER BY start_date DESC LIMIT $2 OFFSET $3';
            const result = await client.query(query, [accountId, limit, offset]);
            return {
                projects: result.rows,
                total,
            };
        }
        finally {
            client.release();
        }
    }
    async updateProject(id, data) {
        const client = await this.pool.connect();
        try {
            const updates = [];
            const values = [];
            let paramCount = 1;
            if (data.name !== undefined) {
                updates.push(`name = $${paramCount++}`);
                values.push(data.name);
            }
            if (data.description !== undefined) {
                updates.push(`description = $${paramCount++}`);
                values.push(data.description);
            }
            if (data.start_date !== undefined) {
                updates.push(`start_date = $${paramCount++}`);
                values.push(data.start_date);
            }
            if (data.end_date !== undefined) {
                updates.push(`end_date = $${paramCount++}`);
                values.push(data.end_date);
            }
            if (data.budget !== undefined) {
                updates.push(`budget = $${paramCount++}`);
                values.push(data.budget);
            }
            if (data.status !== undefined) {
                updates.push(`status = $${paramCount++}`);
                values.push(data.status);
            }
            if (data.project_manager_id !== undefined) {
                updates.push(`project_manager_id = $${paramCount++}`);
                values.push(data.project_manager_id);
            }
            if (updates.length === 0) {
                return await this.getProjectById(id);
            }
            updates.push(`updated_at = NOW()`);
            values.push(id);
            const query = `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
            const result = await client.query(query, values);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    async deleteProject(id) {
        const client = await this.pool.connect();
        try {
            const query = 'DELETE FROM projects WHERE id = $1';
            const result = await client.query(query, [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        finally {
            client.release();
        }
    }
    async getActiveProjects(limit = 50) {
        const client = await this.pool.connect();
        try {
            const query = `
        SELECT * FROM projects 
        WHERE status = 'active'
        ORDER BY start_date DESC
        LIMIT $1
      `;
            const result = await client.query(query, [limit]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    async searchProjects(query, limit = 50) {
        const client = await this.pool.connect();
        try {
            const sql = `
        SELECT * FROM projects 
        WHERE name ILIKE $1 OR description ILIKE $1
        ORDER BY name ASC
        LIMIT $2
      `;
            const result = await client.query(sql, [`%${query}%`, limit]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
}
exports.ProjectService = ProjectService;
//# sourceMappingURL=project.js.map