import axios from 'axios';
import qs from 'querystring';
import { KekaConfig } from '../config/keka';
import { getRedis } from '../config/redis';

const REDIS_TOKEN_KEY = 'keka:access_token';
const REDIS_EXPIRY_KEY = 'keka:token_expiry';

/**
 * Token manager for Keka OAuth2 token endpoint with Redis caching
 * - Requests token using grant_type=kekaapi
 * - Caches token in Redis (fallback to in-memory)
 * - Proactive refresh before expiry
 */
export class KekaTokenManager {
  private accessToken: string | null = null;
  private expiresAt: number = 0; // epoch ms
  private inFlight: Promise<string | null> | null = null;
  private useRedis: boolean = false;

  constructor(private readonly config: KekaConfig) {
    this.checkRedisAvailability();
  }

  private async checkRedisAvailability(): Promise<void> {
    try {
      const redis = getRedis();
      if (redis && redis.isOpen) {
        await redis.ping();
        this.useRedis = true;
        console.log('✅ Redis available for Keka token caching');
      }
    } catch (err) {
      this.useRedis = false;
    }
  }

  private async getCachedToken(): Promise<{ token: string | null; expiresAt: number }> {
    // Try Redis first if available
    if (this.useRedis) {
      try {
        const redis = getRedis();
        if (redis) {
          const [token, expiry] = await Promise.all([
            redis.get(REDIS_TOKEN_KEY),
            redis.get(REDIS_EXPIRY_KEY),
          ]);
          if (token && expiry) {
            return { token, expiresAt: parseInt(expiry, 10) };
          }
        }
      } catch (err) {
        console.warn('Redis cache read failed, using in-memory cache');
      }
    }

    // Fallback to in-memory
    return { token: this.accessToken, expiresAt: this.expiresAt };
  }

  private async setCachedToken(token: string, expiresAt: number): Promise<void> {
    // Set in-memory first
    this.accessToken = token;
    this.expiresAt = expiresAt;

    // Try Redis
    if (this.useRedis) {
      try {
        const redis = getRedis();
        if (redis) {
          const ttl = Math.floor((expiresAt - Date.now()) / 1000);
          await Promise.all([
            redis.set(REDIS_TOKEN_KEY, token, { EX: ttl }),
            redis.set(REDIS_EXPIRY_KEY, expiresAt.toString(), { EX: ttl }),
          ]);
        }
      } catch (err) {
        console.warn('Redis cache write failed, token stored in-memory only');
      }
    }
  }

  private tokenUrl(): string {
    // login.keka.com is the documented token endpoint
    return 'https://login.keka.com/connect/token';
  }

  /**
   * Get a valid token, using cached value when possible
   */
  async getToken(): Promise<string | null> {
    // if explicit override provided in config, prefer it
    // (this allows manual testing via KEKA_HRIS_BEARER)
    // @ts-ignore
    if ((this.config as any).hrisBearerToken) {
      return (this.config as any).hrisBearerToken;
    }

    // Check cache (Redis or in-memory)
    const cached = await this.getCachedToken();
    const now = Date.now();
    if (cached.token && now < cached.expiresAt - 20000) {
      return cached.token;
    }

    if (this.inFlight) return this.inFlight;

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

  private async requestToken(): Promise<string | null> {
    const url = this.tokenUrl();
    const body = {
      grant_type: 'kekaapi',
      scope: 'kekaapi',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      api_key: this.config.apiKey,
    };

    try {
      const resp = await axios.post(url, qs.stringify(body), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: Math.min(this.config.timeout || 30000, 15000),
      });

      const data = resp.data as any;
      if (!data || !data.access_token) {
        console.error('Keka token endpoint returned unexpected response', data);
        return null;
      }

      const accessToken = data.access_token;
      const expiresIn = parseInt(String(data.expires_in || data.expires || 3600), 10);
      // set expiry slightly earlier to avoid edge cases
      const expiresAt = Date.now() + (expiresIn * 1000);

      // Store in cache (Redis + in-memory)
      await this.setCachedToken(accessToken, expiresAt);

      console.log('🔑 Obtained Keka access token, expires in', expiresIn, 'seconds');
      return accessToken;
    } catch (error: any) {
      console.error('❌ Error fetching Keka token:', error?.response?.data || error?.message || error);
      return null;
    }
  }
}

export default KekaTokenManager;
