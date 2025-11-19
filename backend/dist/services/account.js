"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const uuid_1 = require("uuid");
class AccountService {
    constructor(pool) {
        this.pool = pool;
    }
    async createAccount(data) {
        const client = await this.pool.connect();
        try {
            const id = (0, uuid_1.v4)();
            const query = `
        INSERT INTO accounts (
          id, company_id, client_id, name, description, account_manager_id,
          is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `;
            const values = [
                id,
                data.company_id,
                data.client_id,
                data.name,
                data.description || null,
                data.account_manager_id || null,
                data.is_active ?? true,
            ];
            const result = await client.query(query, values);
            return result.rows[0];
        }
        finally {
            client.release();
        }
    }
    async getAccountById(id) {
        const client = await this.pool.connect();
        try {
            const query = 'SELECT * FROM accounts WHERE id = $1';
            const result = await client.query(query, [id]);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    async getAllAccounts(limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const countQuery = 'SELECT COUNT(*) as count FROM accounts';
            const countResult = await client.query(countQuery);
            const total = parseInt(countResult.rows[0].count, 10);
            const query = 'SELECT * FROM accounts ORDER BY created_at DESC LIMIT $1 OFFSET $2';
            const result = await client.query(query, [limit, offset]);
            return {
                accounts: result.rows,
                total,
            };
        }
        finally {
            client.release();
        }
    }
    async getAccountsByCompanyId(companyId, limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const countQuery = 'SELECT COUNT(*) as count FROM accounts WHERE company_id = $1';
            const countResult = await client.query(countQuery, [companyId]);
            const total = parseInt(countResult.rows[0].count, 10);
            const query = 'SELECT * FROM accounts WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
            const result = await client.query(query, [companyId, limit, offset]);
            return {
                accounts: result.rows,
                total,
            };
        }
        finally {
            client.release();
        }
    }
    async getAccountsByClientId(clientId, limit = 100, offset = 0) {
        const client = await this.pool.connect();
        try {
            const countQuery = 'SELECT COUNT(*) as count FROM accounts WHERE client_id = $1';
            const countResult = await client.query(countQuery, [clientId]);
            const total = parseInt(countResult.rows[0].count, 10);
            const query = 'SELECT * FROM accounts WHERE client_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
            const result = await client.query(query, [clientId, limit, offset]);
            return {
                accounts: result.rows,
                total,
            };
        }
        finally {
            client.release();
        }
    }
    async updateAccount(id, data) {
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
            if (data.account_manager_id !== undefined) {
                updates.push(`account_manager_id = $${paramCount++}`);
                values.push(data.account_manager_id);
            }
            if (data.is_active !== undefined) {
                updates.push(`is_active = $${paramCount++}`);
                values.push(data.is_active);
            }
            if (updates.length === 0) {
                return await this.getAccountById(id);
            }
            updates.push(`updated_at = NOW()`);
            values.push(id);
            const query = `UPDATE accounts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
            const result = await client.query(query, values);
            return result.rows.length > 0 ? result.rows[0] : null;
        }
        finally {
            client.release();
        }
    }
    async deleteAccount(id) {
        const client = await this.pool.connect();
        try {
            const query = 'DELETE FROM accounts WHERE id = $1';
            const result = await client.query(query, [id]);
            return result.rowCount ? result.rowCount > 0 : false;
        }
        finally {
            client.release();
        }
    }
    async getAccountHierarchy(accountId) {
        const client = await this.pool.connect();
        try {
            const query = `
        WITH RECURSIVE account_tree AS (
          SELECT * FROM accounts WHERE id = $1
          UNION ALL
          SELECT a.* FROM accounts a
          INNER JOIN account_tree at ON a.parent_account_id = at.id
        )
        SELECT * FROM account_tree ORDER BY parent_account_id, name
      `;
            const result = await client.query(query, [accountId]);
            return result.rows;
        }
        finally {
            client.release();
        }
    }
    async searchAccounts(query, limit = 50) {
        const client = await this.pool.connect();
        try {
            const sql = `
        SELECT * FROM accounts 
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
exports.AccountService = AccountService;
//# sourceMappingURL=account.js.map