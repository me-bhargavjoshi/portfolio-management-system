import { Request, Response, NextFunction } from 'express';
import { AuthService, RegisterCredentials, LoginCredentials, AuthResponse } from '../services/auth';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, firstName, lastName, companyId } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password, firstName, lastName',
        });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long',
        });
        return;
      }

      const credentials: RegisterCredentials = {
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        companyId,
      };

      const result: AuthResponse = await AuthService.register(credentials);

      res.status(201).json({
        success: true,
        data: {
          token: result.token,
          refreshToken: result.refreshToken,
          user: result.user,
        },
      });
    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        res.status(409).json({
          success: false,
          error: error.message,
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password',
        });
        return;
      }

      const credentials: LoginCredentials = {
        email: email.toLowerCase(),
        password,
      };

      const result: AuthResponse = await AuthService.login(credentials);

      res.status(200).json({
        success: true,
        data: {
          token: result.token,
          refreshToken: result.refreshToken,
          user: result.user,
        },
      });
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        res.status(401).json({
          success: false,
          error: error.message,
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  static async refreshToken(req: Request, res: Response, _next: NextFunction): Promise<void> {
     // eslint-disable-next-line @typescript-eslint/no-unused-vars
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Missing refreshToken',
        });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed',
      });
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user (invalidate token on frontend)
   */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user || !user.userId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      await AuthService.logout(user.userId);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Get current user info
   */
  static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
