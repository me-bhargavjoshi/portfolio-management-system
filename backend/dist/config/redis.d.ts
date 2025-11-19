declare let redis: any;
export declare const initRedis: () => Promise<typeof redis>;
export declare const getRedis: () => typeof redis;
export declare const closeRedis: () => Promise<void>;
export declare const isRedisConnected: () => boolean;
export {};
//# sourceMappingURL=redis.d.ts.map