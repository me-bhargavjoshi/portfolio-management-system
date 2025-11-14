import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  website: string;
  industry: string;
  founded_year: number;
  employee_count: number;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCompanyDTO {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  industry?: string;
  founded_year?: number;
  employee_count?: number;
  notes?: string;
}

export interface UpdateCompanyDTO {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  industry?: string;
  founded_year?: number;
  employee_count?: number;
  notes?: string;
}

export class CompanyService {
  constructor(private pool: Pool) {}

  /**
   * Create a new company
   */
  async createCompany(data: CreateCompanyDTO): Promise<Company> {
    const client = await this.pool.connect();
    try {
      const id = uuidv4();
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
    } finally {
      client.release();
    }
  }

  /**
   * Get company by ID
   */
  async getCompanyById(id: string): Promise<Company | null> {
    const client = await this.pool.connect();
    try {
      const query = 'SELECT * FROM companies WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } finally {
      client.release();
    }
  }

  /**
   * Get all companies
   */
  async getAllCompanies(limit: number = 100, offset: number = 0): Promise<{ companies: Company[]; total: number }> {
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
    } finally {
      client.release();
    }
  }

  /**
   * Update company
   */
  async updateCompany(id: string, data: UpdateCompanyDTO): Promise<Company | null> {
    const client = await this.pool.connect();
    try {
      // Build dynamic query
      const updates: string[] = [];
      const values: unknown[] = [];
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
    } finally {
      client.release();
    }
  }

  /**
   * Delete company
   */
  async deleteCompany(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      const query = 'DELETE FROM companies WHERE id = $1';
      const result = await client.query(query, [id]);
      return result.rowCount ? result.rowCount > 0 : false;
    } finally {
      client.release();
    }
  }

  /**
   * Search companies by name
   */
  async searchCompanies(query: string, limit: number = 50): Promise<Company[]> {
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
    } finally {
      client.release();
    }
  }
}
