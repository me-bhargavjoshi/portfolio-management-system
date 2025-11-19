"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientService = void 0;
const uuid_1 = require("uuid");
class ClientService {
    constructor(pool) {
        this.pool = pool;
    }
    async createClient(data) {
        const client = await this.pool.connect();
        try {
            const id = (0, uuid_1.v4)();
            const query = `
        INSERT INTO clients (
          id, company_id, name, email, phone, address, city, state,
          country, postal_code, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
            const values = [
                id,
                data.company_id,
                data.name,
                data.email || null,
                data.phone || null,
                data.address || null,
                data.city || null,
                data.state || null,
                data.country || null,
                data.postal_code || null,
                data.is_active ?? true,
            ];
            const result = await client.query(query, values);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    async getClientById(id) {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM clients WHERE id = $1';
            const result = await client.query(query, [id]);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    async getAllClients(limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const countQuery = 'SELECT COUNT(*) as count FROM clients WHERE is_active = true';
            const countResult = await client.query(countQuery);
            const total = parseInt(countResult.rows[0].count, 10);
            const query = 'SELECT * FROM clients WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2';
            const result = await client.query(query, [limit, offset]);
            return {
                clients: result.rows,
                total,
            };
        }
        finally {
            client.release();
        }
    }
    async getClientsByCompanyId(companyId, limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const countQuery = 'SELECT COUNT(*) as count FROM clients WHERE company_id = $1 AND is_active = true';
            const countResult = await client.query(countQuery, [companyId]);
            const total = parseInt(countResult.rows[0].count, 10);
            const query = 'SELECT * FROM clients WHERE company_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT $2 OFFSET $3';
            const result = await client.query(query, [companyId, limit, offset]);
            return {
                clients: result.rows,
                total,
            };
        }
        finally {
            client.release();
        }
    }
    async updateClient(id, data) {
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
            if (data.is_active !== undefined) {
                updates.push(`is_active = $${paramCount++}`);
                values.push(data.is_active);
            }
            if (updates.length === 0) {
                return await this.getClientById(id);
            }
            updates.push(`updated_at = NOW()`);
            values.push(id);
            const query = `UPDATE clients SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
            const result = await client.query(query, values);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    async deleteClient(id) {
        const client = await this.pool.connect();
        try {
            const query = 'DELETE FROM clients WHERE id = $1';
            const result = await client.query(query, [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        finally {
            client.release();
        }
    }
    async searchClients(query, limit = 50) {
        const client = await this.pool.connect();
        try {
            const sql = `
        SELECT * FROM clients 
        WHERE name ILIKE $1 OR email ILIKE $1 OR contact_email ILIKE $1
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
exports.ClientService = ClientService;
//# sourceMappingURL=client.js.map