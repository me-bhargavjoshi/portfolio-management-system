interface Config {
    nodeEnv: string;
    port: number;
    databaseUrl: string;
    redisUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    bcryptRounds: number;
}
declare const config: Config;
export default config;
//# sourceMappingURL=index.d.ts.map