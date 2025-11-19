export interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
    message: string;
}
export declare class KekaEmployeesSyncService {
    private kekaClient;
    private syncTracking;
    syncEmployees(companyId: string): Promise<SyncResult>;
    private syncEmployee;
    getSyncStatus(): Promise<{
        lastSync: Date | null;
        count: number;
    }>;
}
export default KekaEmployeesSyncService;
//# sourceMappingURL=keka-employees-sync.d.ts.map