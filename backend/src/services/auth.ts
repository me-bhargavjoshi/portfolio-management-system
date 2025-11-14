import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';
import config from '../config';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  companyId?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: Omit<User, 'password_hash'>;
}

export class AuthService {
  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const db = getDatabase();

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [credentials.email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = config.bcryptRounds || 10;
    const passwordHash = await bcrypt.hash(credentials.password, saltRounds);

    // Get or create company (demo: create default company)
    let companyId = credentials.companyId;
    if (!companyId) {
      const companyResult = await db.query(
        'SELECT id FROM companies LIMIT 1'
      );
      if (companyResult.rows.length === 0) {
        // Create default company for demo
        const newCompany = await db.query(
          'INSERT INTO companies (name) VALUES ($1) RETURNING id',
          ['Default Company']
        );
        companyId = newCompany.rows[0].id;
      } else {
        companyId = companyResult.rows[0].id;
      }
    }

    // Create user
    const userResult = await db.query(
      `INSERT INTO users (
        company_id, email, password_hash, first_name, last_name, role, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, company_id, role`,
      [companyId, credentials.email, passwordHash, credentials.firstName, credentials.lastName, 'user', true]
    );

    const user = userResult.rows[0];

    // Generate tokens
    const token = this.generateToken(user.id, user.email, user.company_id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company_id: user.company_id,
        role: user.role,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    };
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const db = getDatabase();

    // Find user by email
    const userResult = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, company_id, role FROM users WHERE email = $1 AND is_active = true',
      [credentials.email]
    );

    if (userResult.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const token = this.generateToken(user.id, user.email, user.company_id, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        company_id: user.company_id,
        role: user.role,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    };
  }

  static async verifyToken(token: string): Promise<any> {
    try {
        const secret = config.jwtSecret || 'your-secret-key-change-in-production';
        const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static async refreshToken(refreshToken: string): Promise<{ token: string }> {
    const db = getDatabase();

    try {
        const secret = config.jwtSecret || 'your-secret-key-change-in-production';
        const decoded = jwt.verify(refreshToken, secret) as any;
        const userId = decoded.userId;

      // Get user
      const userResult = await db.query(
        'SELECT id, email, company_id, role FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      const token = this.generateToken(user.id, user.email, user.company_id, user.role);

      return { token };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(userId: string): Promise<void> {
    // In a stateless JWT system, logout is typically handled on the frontend
    // This can be extended to maintain a token blacklist if needed
    const db = getDatabase();

    // Optional: Update user's last activity
    await db.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  private static generateToken(userId: string, email: string, companyId: string, role: string): string {
      const secret = config.jwtSecret || 'your-secret-key-change-in-production';
      const expiresIn = config.jwtExpiresIn || '24h';
    return jwt.sign(
      {
        userId,
        email,
        companyId,
        role,
      },
        secret,
        { expiresIn } as any
    );
  }

  private static generateRefreshToken(userId: string): string {
    const expiresIn = config.jwtRefreshExpiresIn || '7d';
      const secret = config.jwtSecret || 'your-secret-key-change-in-production';
    return jwt.sign(
      { userId },
        secret,
        { expiresIn } as any
    );
  }
}
