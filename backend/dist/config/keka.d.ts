export interface KekaConfig {
    companyName: string;
    clientId: string;
    clientSecret: string;
    apiKey: string;
    hrisBearerToken?: string;
    psaBaseUrl: string;
    hrisBaseUrl: string;
    timeout: number;
}
export declare const kekaConfig: KekaConfig;
export declare const validateKekaConfig: () => boolean;
export default kekaConfig;
//# sourceMappingURL=keka.d.ts.map