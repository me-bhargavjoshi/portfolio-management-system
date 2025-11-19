"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const config_1 = __importDefault(require("../config"));
class AuthService {
    static async register(credentials) {
        const db = (0, database_1.getDatabase)();
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [credentials.email]);
        if (existingUser.rows.length > 0) {
            throw new Error('User with this email already exists');
        }
        const saltRounds = config_1.default.bcryptRounds || 10;
        const passwordHash = await bcryptjs_1.default.hash(credentials.password, saltRounds);
        let companyId = credentials.companyId;
        if (!companyId) {
            const companyResult = await db.query('SELECT id FROM companies LIMIT 1');
            if (companyResult.rows.length === 0) {
                const newCompany = await db.query('INSERT INTO companies (name) VALUES ($1) RETURNING id', ['Default Company']);
                companyId = newCompany.rows[0].id;
            }
            else {
                companyId = companyResult.rows[0].id;
            }
        }
        const userResult = await db.query(`INSERT INTO users (
        company_id, email, password_hash, first_name, last_name, role, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, first_name, last_name, company_id, role`, [companyId, credentials.email, passwordHash, credentials.firstName, credentials.lastName, 'user', true]);
        const user = userResult.rows[0];
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
    static async login(credentials) {
        const db = (0, database_1.getDatabase)();
        const userResult = await db.query('SELECT id, email, password_hash, first_name, last_name, company_id, role FROM users WHERE email = $1 AND is_active = true', [credentials.email]);
        if (userResult.rows.length === 0) {
            throw new Error('Invalid email or password');
        }
        const user = userResult.rows[0];
        const isPasswordValid = await bcryptjs_1.default.compare(credentials.password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
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
    static async verifyToken(token) {
        try {
            const secret = config_1.default.jwtSecret || 'your-secret-key-change-in-production';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    static async refreshToken(refreshToken) {
        const db = (0, database_1.getDatabase)();
        try {
            const secret = config_1.default.jwtSecret || 'your-secret-key-change-in-production';
            const decoded = jsonwebtoken_1.default.verify(refreshToken, secret);
            const userId = decoded.userId;
            const userResult = await db.query('SELECT id, email, company_id, role FROM users WHERE id = $1 AND is_active = true', [userId]);
            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }
            const user = userResult.rows[0];
            const token = this.generateToken(user.id, user.email, user.company_id, user.role);
            return { token };
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    static async logout(userId) {
        const db = (0, database_1.getDatabase)();
        await db.query('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [userId]);
    }
    static generateToken(userId, email, companyId, role) {
        const secret = config_1.default.jwtSecret || 'your-secret-key-change-in-production';
        const expiresIn = config_1.default.jwtExpiresIn || '24h';
        return jsonwebtoken_1.default.sign({
            userId,
            email,
            companyId,
            role,
        }, secret, { expiresIn });
    }
    static generateRefreshToken(userId) {
        const expiresIn = config_1.default.jwtRefreshExpiresIn || '7d';
        const secret = config_1.default.jwtSecret || 'your-secret-key-change-in-production';
        return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.js.map