import { KekaConfig } from '../config/keka';
export declare class KekaTokenManager {
    private readonly config;
    private accessToken;
    private expiresAt;
    private inFlight;
    private useRedis;
    constructor(config: KekaConfig);
    private checkRedisAvailability;
    private getCachedToken;
    private setCachedToken;
    private tokenUrl;
    getToken(): Promise<string | null>;
    private requestToken;
}
export default KekaTokenManager;
//# sourceMappingURL=keka-token.d.ts.map