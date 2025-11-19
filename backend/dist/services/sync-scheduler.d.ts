export interface SyncSchedulerConfig {
    enabled: boolean;
    clientsSchedule?: string;
    projectsSchedule?: string;
    employeesSchedule?: string;
    allSchedule?: string;
}
export declare class SyncSchedulerService {
    private config;
    private tasks;
    private syncTracking;
    private clientsSync;
    private projectsSync;
    private employeesSync;
    constructor(config: SyncSchedulerConfig);
    start(): void;
    stop(): void;
    private scheduleSync;
    private getActiveCompanies;
    getStatus(): {
        enabled: boolean;
        tasks: Array<{
            entity: string;
            schedule: string;
            isRunning: boolean;
        }>;
    };
    private getScheduleForEntity;
}
export declare const syncScheduler: SyncSchedulerService;
export default syncScheduler;
//# sourceMappingURL=sync-scheduler.d.ts.map