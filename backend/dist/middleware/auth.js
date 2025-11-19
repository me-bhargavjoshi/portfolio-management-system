"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.roleMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const authMiddleware = (_req, res, _next) => {
    const token = _req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret);
        _req.user = decoded;
        _next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authMiddleware = authMiddleware;
const roleMiddleware = (allowedRoles) => {
    return (_req, res, _next) => {
        if (!_req.user || !allowedRoles.includes(_req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        _next();
    };
};
exports.roleMiddleware = roleMiddleware;
const errorHandler = (err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=auth.js.map