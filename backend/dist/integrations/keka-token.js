"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KekaTokenManager = void 0;
const axios_1 = __importDefault(require("axios"));
const querystring_1 = __importDefault(require("querystring"));
const redis_1 = require("../config/redis");
const REDIS_TOKEN_KEY = 'keka:access_token';
const REDIS_EXPIRY_KEY = 'keka:token_expiry';
class KekaTokenManager {
    constructor(config) {
        this.config = config;
        this.accessToken = null;
        this.expiresAt = 0;
        this.inFlight = null;
        this.useRedis = false;
        this.checkRedisAvailability();
    }
    async checkRedisAvailability() {
        try {
            const redis = (0, redis_1.getRedis)();
            if (redis && redis.isOpen) {
                await redis.ping();
                this.useRedis = true;
                console.log('✅ Redis available for Keka token caching');
            }
        }
        catch (err) {
            this.useRedis = false;
        }
    }
    async getCachedToken() {
        if (this.useRedis) {
            try {
                const redis = (0, redis_1.getRedis)();
                if (redis) {
                    const [token, expiry] = await Promise.all([
                        redis.get(REDIS_TOKEN_KEY),
                        redis.get(REDIS_EXPIRY_KEY),
                    ]);
                    if (token && expiry) {
                        return { token, expiresAt: parseInt(expiry, 10) };
                    }
                }
            }
            catch (err) {
                console.warn('Redis cache read failed, using in-memory cache');
            }
        }
        return { token: this.accessToken, expiresAt: this.expiresAt };
    }
    async setCachedToken(token, expiresAt) {
        this.accessToken = token;
        this.expiresAt = expiresAt;
        if (this.useRedis) {
            try {
                const redis = (0, redis_1.getRedis)();
                if (redis) {
                    const ttl = Math.floor((expiresAt - Date.now()) / 1000);
                    await Promise.all([
                        redis.set(REDIS_TOKEN_KEY, token, { EX: ttl }),
                        redis.set(REDIS_EXPIRY_KEY, expiresAt.toString(), { EX: ttl }),
                    ]);
                }
            }
            catch (err) {
                console.warn('Redis cache write failed, token stored in-memory only');
            }
        }
    }
    tokenUrl() {
        return 'https://login.keka.com/connect/token';
    }
    async getToken() {
        if (this.config.hrisBearerToken) {
            return this.config.hrisBearerToken;
        }
        const cached = await this.getCachedToken();
        const now = Date.now();
        if (cached.token && now < cached.expiresAt - 20000) {
            return cached.token;
        }
        if (this.inFlight)
            return this.inFlight;
        this.inFlight = this.requestToken()
            .then((t) => {
            this.inFlight = null;
            return t;
        })
            .catch((err) => {
            this.inFlight = null;
            console.error('Keka token request failed:', err?.message || err);
            return null;
        });
        return this.inFlight;
    }
    async requestToken() {
        const url = this.tokenUrl();
        const body = {
            grant_type: 'kekaapi',
            scope: 'kekaapi',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
            api_key: this.config.apiKey,
        };
        try {
            const resp = await axios_1.default.post(url, querystring_1.default.stringify(body), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: Math.min(this.config.timeout || 30000, 15000),
            });
            const data = resp.data;
            if (!data || !data.access_token) {
                console.error('Keka token endpoint returned unexpected response', data);
                return null;
            }
            const accessToken = data.access_token;
            const expiresIn = parseInt(String(data.expires_in || data.expires || 3600), 10);
            const expiresAt = Date.now() + (expiresIn * 1000);
            await this.setCachedToken(accessToken, expiresAt);
            console.log('🔑 Obtained Keka access token, expires in', expiresIn, 'seconds');
            return accessToken;
        }
        catch (error) {
            console.error('❌ Error fetching Keka token:', error?.response?.data || error?.message || error);
            return null;
        }
    }
}
exports.KekaTokenManager = KekaTokenManager;
exports.default = KekaTokenManager;
//# sourceMappingURL=keka-token.js.map