import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface Account {
  id: string;
  company_id: string;
  client_id: string;
  name: string;
  description?: string;
  account_manager_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAccountDTO {
  company_id: string;
  client_id: string;
  name: string;
  description?: string;
  account_manager_id?: string;
  is_active?: boolean;
}

export interface UpdateAccountDTO {
  name?: string;
  description?: string;
  account_manager_id?: string;
  is_active?: boolean;
}

export class AccountService {
  constructor(private pool: Pool) {}

  /**
   * Create a new account
   */
  async createAccount(data: CreateAccountDTO): Promise<Account> {
    const client = await this.pool.connect();
    try {
      const id = uuidv4();
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
    } finally {
      client.release();
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(id: string): Promise<Account | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM accounts WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * Get all accounts
   */
  async getAllAccounts(limit: number = 100, offset: number = 0): Promise<{ accounts: Account[]; total: number }> {
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
    } finally {
      client.release();
    }
  }

  /**
   * Get accounts by company ID
   */
  async getAccountsByCompanyId(companyId: string, limit: number = 100, offset: number = 0): Promise<{ accounts: Account[]; total: number }> {
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
    } finally {
      client.release();
    }
  }

  /**
   * Get accounts by client ID
   */
  async getAccountsByClientId(clientId: string, limit: number = 100, offset: number = 0): Promise<{ accounts: Account[]; total: number }> {
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
    } finally {
      client.release();
    }
  }

  /**
   * Update account
   */
  async updateAccount(id: string, data: UpdateAccountDTO): Promise<Account | null> {
    const client = await this.pool.connect();
    try {
      const updates: string[] = [];
      const values: unknown[] = [];
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
    } finally {
      client.release();
    }
  }

  /**
   * Delete account
   */
  async deleteAccount(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM accounts WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } finally {
      client.release();
    }
  }

  /**
   * Get account hierarchy (parent account and all child accounts)
   */
  async getAccountHierarchy(accountId: string): Promise<Account[]> {
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
    } finally {
      client.release();
    }
  }

  /**
   * Search accounts by name
   */
  async searchAccounts(query: string, limit: number = 50): Promise<Account[]> {
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
    } finally {
      client.release();
    }
  }
}
