"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateKekaConfig = exports.kekaConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.kekaConfig = {
    companyName: process.env.KEKA_COMPANY_NAME || 'dynamicelements',
    clientId: process.env.KEKA_CLIENT_ID || 'ad066272-fc26-4cb6-8013-0c917b338282',
    clientSecret: process.env.KEKA_CLIENT_SECRET || 'L0lrngtVKLGBMimNzYNk',
    apiKey: process.env.KEKA_API_KEY || '_fofSwKapMl6SJsizaEsxNhzZJrYrJHta4n55YJ3b2M=',
    psaBaseUrl: 'https://dynamicelements.keka.com/api/v1/psa',
    hrisBaseUrl: 'https://dynamicelements.keka.com/api/v1/hris',
    hrisBearerToken: process.env.KEKA_HRIS_BEARER || '',
    timeout: parseInt(process.env.KEKA_TIMEOUT || '30000', 10),
};
const validateKekaConfig = () => {
    if (!exports.kekaConfig.clientId || !exports.kekaConfig.clientSecret || !exports.kekaConfig.apiKey) {
        console.warn('⚠️  Keka configuration incomplete. Some features may not work.');
        return false;
    }
    console.log('✅ Keka configuration validated');
    return true;
};
exports.validateKekaConfig = validateKekaConfig;
exports.default = exports.kekaConfig;
//# sourceMappingURL=keka.js.map