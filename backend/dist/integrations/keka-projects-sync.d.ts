export interface SyncResult {
    success: boolean;
    synced: number;
    failed: number;
    errors: string[];
    message: string;
}
export declare class KekaProjectsSyncService {
    private kekaClient;
    private syncTracking;
    syncProjects(companyId: string): Promise<SyncResult>;
    private syncProject;
    getSyncStatus(): Promise<{
        lastSync: Date | null;
        count: number;
    }>;
}
export default KekaProjectsSyncService;
//# sourceMappingURL=keka-projects-sync.d.ts.map