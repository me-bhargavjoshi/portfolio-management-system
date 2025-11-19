"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const uuid_1 = require("uuid");
class CompanyService {
    constructor(pool) {
        this.pool = pool;
    }
    async createCompany(data) {
        const client = await this.pool.connect();
        try {
            const id = (0, uuid_1.v4)();
            const query = `
        INSERT INTO companies (
          id, name, email, phone, address, city, state, country, 
          postal_code, website, industry, founded_year, employee_count, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
            const values = [
                id,
                data.name,
                data.email,
                data.phone,
                data.address || null,
                data.city || null,
                data.state || null,
                data.country || null,
                data.postal_code || null,
                data.website || null,
                data.industry || null,
                data.founded_year || null,
                data.employee_count || 0,
                data.notes || null,
            ];
            const result = await client.query(query, values);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    async getCompanyById(id) {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM companies WHERE id = $1';
            const result = await client.query(query, [id]);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    async getAllCompanies(limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const countQuery = 'SELECT COUNT(*) as count FROM companies';
            const countResult = await client.query(countQuery);
            const total = parseInt(countResult.rows[0].count, 10);
            const query = 'SELECT * FROM companies ORDER BY created_at DESC LIMIT $1 OFFSET $2';
            const result = await client.query(query, [limit, offset]);
            return {
                companies: result.rows,
                total,
            };
        }
        finally {
            client.release();
        }
    }
    async updateCompany(id, data) {
        const client = await this.pool.connect();
        try {
            const updates = [];
            const values = [];
            let paramCount = 1;
            if (data.name !== undefined) {
                updates.push(`name = $${paramCount++}`);
                values.push(data.name);
            }
            if (data.email !== undefined) {
                updates.push(`email = $${paramCount++}`);
                values.push(data.email);
            }
            if (data.phone !== undefined) {
                updates.push(`phone = $${paramCount++}`);
                values.push(data.phone);
            }
            if (data.address !== undefined) {
                updates.push(`address = $${paramCount++}`);
                values.push(data.address);
            }
            if (data.city !== undefined) {
                updates.push(`city = $${paramCount++}`);
                values.push(data.city);
            }
            if (data.state !== undefined) {
                updates.push(`state = $${paramCount++}`);
                values.push(data.state);
            }
            if (data.country !== undefined) {
                updates.push(`country = $${paramCount++}`);
                values.push(data.country);
            }
            if (data.postal_code !== undefined) {
                updates.push(`postal_code = $${paramCount++}`);
                values.push(data.postal_code);
            }
            if (data.website !== undefined) {
                updates.push(`website = $${paramCount++}`);
                values.push(data.website);
            }
            if (data.industry !== undefined) {
                updates.push(`industry = $${paramCount++}`);
                values.push(data.industry);
            }
            if (data.founded_year !== undefined) {
                updates.push(`founded_year = $${paramCount++}`);
                values.push(data.founded_year);
            }
            if (data.employee_count !== undefined) {
                updates.push(`employee_count = $${paramCount++}`);
                values.push(data.employee_count);
            }
            if (data.notes !== undefined) {
                updates.push(`notes = $${paramCount++}`);
                values.push(data.notes);
            }
            if (updates.length === 0) {
                return await this.getCompanyById(id);
            }
            updates.push(`updated_at = NOW()`);
            values.push(id);
            const query = `UPDATE companies SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
            const result = await client.query(query, values);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    async deleteCompany(id) {
        const client = await this.pool.connect();
        try {
            const query = 'DELETE FROM companies WHERE id = $1';
            const result = await client.query(query, [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        finally {
            client.release();
        }
    }
    async searchCompanies(query, limit = 50) {
        const client = await this.pool.connect();
        try {
            const sql = `
        SELECT * FROM companies 
        WHERE name ILIKE $1 OR email ILIKE $1
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
exports.CompanyService = CompanyService;
//# sourceMappingURL=company.js.map