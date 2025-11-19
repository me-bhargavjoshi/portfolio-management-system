"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = void 0;
const auth_1 = require("../middleware/auth");
const auth_2 = require("../controllers/auth");
const AccountController = __importStar(require("../controllers/account"));
const keka_sync_1 = __importDefault(require("../controllers/keka-sync"));
const keka_employees_1 = __importDefault(require("./keka-employees"));
const keka_clients_1 = __importDefault(require("./keka-clients"));
const keka_projects_1 = __importDefault(require("./keka-projects"));
const keka_dashboard_1 = __importDefault(require("./keka-dashboard"));
const resource_planning_1 = __importDefault(require("./resource-planning"));
const createRoutes = (app) => {
    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    app.post('/api/auth/register', auth_2.AuthController.register);
    app.post('/api/auth/login', auth_2.AuthController.login);
    app.post('/api/auth/refresh', auth_2.AuthController.refreshToken);
    app.post('/api/auth/logout', auth_1.authMiddleware, auth_2.AuthController.logout);
    app.get('/api/auth/me', auth_1.authMiddleware, auth_2.AuthController.getCurrentUser);
    app.post('/api/accounts', auth_1.authMiddleware, AccountController.createAccount);
    app.get('/api/accounts', auth_1.authMiddleware, AccountController.getAllAccounts);
    app.get('/api/accounts/:id', auth_1.authMiddleware, AccountController.getAccountById);
    app.put('/api/accounts/:id', auth_1.authMiddleware, AccountController.updateAccount);
    app.delete('/api/accounts/:id', auth_1.authMiddleware, AccountController.deleteAccount);
    app.use('/api/keka-sync', keka_sync_1.default);
    app.use('/api/keka', auth_1.authMiddleware, keka_dashboard_1.default);
    app.use('/api/keka-employees', auth_1.authMiddleware, keka_employees_1.default);
    app.use('/api/keka-clients', auth_1.authMiddleware, keka_clients_1.default);
    app.use('/api/keka-projects', auth_1.authMiddleware, keka_projects_1.default);
    app.use('/api/resource-planning', auth_1.authMiddleware, resource_planning_1.default);
    app.get('/api/dashboard', auth_1.authMiddleware, (_req, res) => {
        res.json({ message: 'Dashboard data - to be implemented' });
    });
    app.use(auth_1.errorHandler);
};
exports.createRoutes = createRoutes;
//# sourceMappingURL=index.js.map