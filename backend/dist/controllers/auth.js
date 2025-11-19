"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_1 = require("../services/auth");
class AuthController {
    static async register(req, res, next) {
        try {
            const { email, password, firstName, lastName, companyId } = req.body;
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
            const credentials = {
                email: email.toLowerCase(),
                password,
                firstName,
                lastName,
                companyId,
            };
            const result = await auth_1.AuthService.register(credentials);
            res.status(201).json({
                success: true,
                data: {
                    token: result.token,
                    refreshToken: result.refreshToken,
                    user: result.user,
                },
            });
        }
        catch (error) {
            if (error.message === 'User with this email already exists') {
                res.status(409).json({
                    success: false,
                    error: error.message,
                });
            }
            else {
                next(error);
            }
        }
    }
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({
                    success: false,
                    error: 'Missing required fields: email, password',
                });
                return;
            }
            const credentials = {
                email: email.toLowerCase(),
                password,
            };
            const result = await auth_1.AuthService.login(credentials);
            res.status(200).json({
                success: true,
                data: {
                    token: result.token,
                    refreshToken: result.refreshToken,
                    user: result.user,
                },
            });
        }
        catch (error) {
            if (error.message === 'Invalid email or password') {
                res.status(401).json({
                    success: false,
                    error: error.message,
                });
            }
            else {
                next(error);
            }
        }
    }
    static async refreshToken(req, res, _next) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    error: 'Missing refreshToken',
                });
                return;
            }
            const result = await auth_1.AuthService.refreshToken(refreshToken);
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: error.message || 'Token refresh failed',
            });
        }
    }
    static async logout(req, res, next) {
        try {
            const user = req.user;
            if (!user || !user.userId) {
                res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                });
                return;
            }
            await auth_1.AuthService.logout(user.userId);
            res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCurrentUser(req, res, next) {
        try {
            const user = req.user;
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
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.js.map