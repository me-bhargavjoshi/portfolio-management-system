export interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
    message: string;
}
export declare class KekaClientsSyncService {
    private kekaClient;
    private syncTracking;
    syncClients(companyId: string): Promise<SyncResult>;
    private syncClient;
    getSyncStatus(): Promise<{
        lastSync: Date | null;
        count: number;
    }>;
}
export default KekaClientsSyncService;
//# sourceMappingURL=keka-clients-sync.d.ts.map