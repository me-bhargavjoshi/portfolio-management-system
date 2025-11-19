"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKekaClient = exports.KekaApiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const keka_1 = require("../config/keka");
const keka_token_1 = __importDefault(require("./keka-token"));
class KekaApiClient {
    constructor(config = keka_1.kekaConfig) {
        this.config = config;
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.detectedAuthHeaders = null;
        void this.config;
        this.psaClient = axios_1.default.create({
            baseURL: this.config.psaBaseUrl,
            timeout: this.config.timeout,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        this.hrisClient = axios_1.default.create({
            baseURL: this.config.hrisBaseUrl,
            timeout: this.config.timeout,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });
        if (this.config.hrisBearerToken) {
            this.hrisClient.defaults.headers.common['Authorization'] = `Bearer ${this.config.hrisBearerToken}`;
            console.log('🔒 Applied HRIS bearer token from config for Keka HRIS requests');
        }
        this.setupInterceptors();
        this.tokenManager = new keka_token_1.default(this.config);
    }
    async detectAuthMode() {
        if (this.detectedAuthHeaders)
            return this.detectedAuthHeaders;
        const credentialsBase64 = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');
        const strategies = [
            {
                name: 'basic+X-API-Key',
                headers: {
                    Authorization: `Basic ${credentialsBase64}`,
                    'X-API-Key': this.config.apiKey,
                },
            },
            {
                name: 'bearer-api-key',
                headers: {
                    Authorization: `Bearer ${this.config.apiKey}`,
                },
            },
            {
                name: 'x-api-key-only',
                headers: {
                    'X-API-Key': this.config.apiKey,
                },
            },
            {
                name: 'basic-clientid-apikey',
                headers: {
                    Authorization: `Basic ${Buffer.from(`${this.config.clientId}:${this.config.apiKey}`).toString('base64')}`,
                },
            },
            {
                name: 'client-id-secret-headers',
                headers: {
                    'X-Client-Id': this.config.clientId,
                    'X-Client-Secret': this.config.clientSecret,
                    'X-API-Key': this.config.apiKey,
                },
            },
        ];
        for (const s of strategies) {
            try {
                console.log(`🔎 Trying Keka auth strategy: ${s.name}`);
                const resp = await axios_1.default.get(`${this.config.psaBaseUrl}/clients`, {
                    headers: s.headers,
                    timeout: Math.min(this.config.timeout, 5000),
                });
                if (resp && resp.status && resp.status >= 200 && resp.status < 300) {
                    console.log(`✅ Keka auth strategy succeeded: ${s.name}`);
                    this.detectedAuthHeaders = s.headers;
                    return this.detectedAuthHeaders;
                }
            }
            catch (err) {
                console.log(`⛔ Strategy ${s.name} failed: ${err?.response?.status || err?.message || 'no response'}`);
                continue;
            }
        }
        console.warn('⚠️  No Keka auth strategy succeeded');
        return null;
    }
    setupInterceptors() {
        this.psaClient.interceptors.response.use((response) => response, (error) => this.handleError(error, 'PSA'));
        this.hrisClient.interceptors.response.use((response) => response, (error) => this.handleError(error, 'HRIS'));
    }
    applyAuthHeaders(headers) {
        if (!headers)
            return;
        Object.entries(headers).forEach(([k, v]) => {
            this.psaClient.defaults.headers.common[k] = v;
            this.hrisClient.defaults.headers.common[k] = v;
        });
    }
    async ensureAuthApplied() {
        try {
            const token = await this.tokenManager.getToken();
            if (token) {
                this.psaClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                this.hrisClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return;
            }
        }
        catch (err) {
            console.warn('Keka token manager did not return a token, falling back to header detection');
        }
        if (this.detectedAuthHeaders)
            return;
        const headers = await this.detectAuthMode();
        if (headers) {
            this.applyAuthHeaders(headers);
        }
    }
    handleError(error, api) {
        const info = {
            api,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
        };
        try {
            console.error(`❌ Keka ${api} API Error: ${JSON.stringify(info)}`);
        }
        catch (e) {
            console.error('❌ Keka API Error (logging failure)', info);
        }
        const err = new Error(JSON.stringify(info));
        return Promise.reject(err);
    }
    async retryRequest(fn, attempt = 1) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt < this.maxRetries) {
                console.log(`⏳ Retrying (attempt ${attempt + 1}/${this.maxRetries})...`);
                await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
                return this.retryRequest(fn, attempt + 1);
            }
            throw error;
        }
    }
    async getClients() {
        try {
            console.log('📥 Fetching clients from Keka PSA API...');
            await this.ensureAuthApplied();
            const response = await this.retryRequest(() => this.psaClient.get('/clients'));
            const clients = Array.isArray(response.data?.data) ? response.data.data :
                Array.isArray(response.data) ? response.data : [];
            console.log(`✅ Fetched ${clients.length} clients from Keka`);
            return {
                success: true,
                data: clients,
            };
        }
        catch (error) {
            console.error('❌ Failed to fetch clients from Keka:', error.message);
            return {
                success: false,
                error: error.message || 'Failed to fetch clients',
            };
        }
    }
    async getClient(id) {
        try {
            console.log(`📥 Fetching client ${id} from Keka PSA API...`);
            await this.ensureAuthApplied();
            const response = await this.retryRequest(() => this.psaClient.get(`/clients/${id}`));
            console.log(`✅ Fetched client ${id} from Keka`);
            return {
                success: true,
                data: response.data,
            };
        }
        catch (error) {
            console.error(`❌ Failed to fetch client ${id}:`, error.message);
            return {
                success: false,
                error: error.message || 'Failed to fetch client',
            };
        }
    }
    async getProjects() {
        try {
            console.log('📥 Fetching projects from Keka PSA API...');
            await this.ensureAuthApplied();
            const response = await this.retryRequest(() => this.psaClient.get('/projects'));
            const projects = Array.isArray(response.data?.data) ? response.data.data :
                Array.isArray(response.data) ? response.data : [];
            console.log(`✅ Fetched ${projects.length} projects from Keka`);
            return {
                success: true,
                data: projects,
            };
        }
        catch (error) {
            console.error('❌ Failed to fetch projects from Keka:', error.message);
            return {
                success: false,
                error: error.message || 'Failed to fetch projects',
            };
        }
    }
    async getProject(id) {
        try {
            console.log(`📥 Fetching project ${id} from Keka PSA API...`);
            await this.ensureAuthApplied();
            const response = await this.retryRequest(() => this.psaClient.get(`/projects/${id}`));
            console.log(`✅ Fetched project ${id} from Keka`);
            return {
                success: true,
                data: response.data,
            };
        }
        catch (error) {
            console.error(`❌ Failed to fetch project ${id}:`, error.message);
            return {
                success: false,
                error: error.message || 'Failed to fetch project',
            };
        }
    }
    async getEmployees(filters) {
        try {
            console.log('📥 Fetching employees from Keka HRIS API...');
            await this.ensureAuthApplied();
            const defaultFilters = {
                inProbation: false,
                inNoticePeriod: false,
                ...filters,
            };
            const queryParams = new URLSearchParams();
            Object.entries(defaultFilters).forEach(([k, v]) => {
                queryParams.append(k, String(v));
            });
            const queryString = queryParams.toString();
            const response = await this.retryRequest(() => this.hrisClient.get(`/employees?${queryString}`));
            const raw = response.data;
            const employees = Array.isArray(raw)
                ? raw
                : Array.isArray(raw?.data)
                    ? raw.data
                    : [];
            console.log(`✅ Fetched ${employees.length} employees from Keka`);
            return {
                success: true,
                data: employees,
            };
        }
        catch (error) {
            console.error('❌ Failed to fetch employees from Keka:', error.message);
            return {
                success: false,
                error: error.message || 'Failed to fetch employees',
            };
        }
    }
    async getEmployee(id) {
        try {
            console.log(`📥 Fetching employee ${id} from Keka HRIS API...`);
            await this.ensureAuthApplied();
            const response = await this.retryRequest(() => this.hrisClient.get(`/employees/${id}`));
            console.log(`✅ Fetched employee ${id} from Keka`);
            return {
                success: true,
                data: response.data,
            };
        }
        catch (error) {
            console.error(`❌ Failed to fetch employee ${id}:`, error.message);
            return {
                success: false,
                error: error.message || 'Failed to fetch employee',
            };
        }
    }
    async testConnection() {
        try {
            console.log('🧪 Testing Keka API connection...');
            await this.ensureAuthApplied();
            await Promise.all([
                this.psaClient.get('/clients'),
                this.hrisClient.get('/employees?inProbation=false&inNoticePeriod=false'),
            ]);
            console.log('✅ Keka API connection test successful');
            return true;
        }
        catch (error) {
            console.error('❌ Keka API connection test failed:', error.message);
            return false;
        }
    }
}
exports.KekaApiClient = KekaApiClient;
let kekaClientInstance = null;
const getKekaClient = (config) => {
    if (!kekaClientInstance) {
        kekaClientInstance = new KekaApiClient(config || keka_1.kekaConfig);
    }
    return kekaClientInstance;
};
exports.getKekaClient = getKekaClient;
exports.default = KekaApiClient;
//# sourceMappingURL=keka.js.map