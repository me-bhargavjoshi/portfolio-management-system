export interface SyncRun {
    id: string;
    company_id: string;
    entity_type: 'clients' | 'projects' | 'employees' | 'all';
    status: 'running' | 'completed' | 'failed' | 'partial';
    records_synced: number;
    records_failed: number;
    errors?: any[];
    started_at: Date;
    completed_at?: Date;
    duration_ms?: number;
    triggered_by?: string;
}
export interface SyncRunCreate {
    company_id: string;
    entity_type: 'clients' | 'projects' | 'employees' | 'all';
    triggered_by?: string;
}
export interface SyncRunUpdate {
    status: 'completed' | 'failed' | 'partial';
    records_synced: number;
    records_failed: number;
    errors?: any[];
}
export declare class SyncTrackingService {
    startSyncRun(data: SyncRunCreate): Promise<string>;
    completeSyncRun(syncRunId: string, data: SyncRunUpdate): Promise<void>;
    getSyncHistory(companyId: string, entityType?: string, limit?: number): Promise<SyncRun[]>;
    getLastSync(companyId: string, entityType: string): Promise<SyncRun | null>;
    isSyncRunning(companyId: string, entityType: string): Promise<boolean>;
    getSyncStats(companyId: string): Promise<{
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        totalRecordsSynced: number;
        lastSyncByType: Record<string, Date | null>;
    }>;
}
declare const _default: SyncTrackingService;
export default _default;
//# sourceMappingURL=sync-tracking.d.ts.map