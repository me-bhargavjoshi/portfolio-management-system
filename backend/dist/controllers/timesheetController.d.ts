import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare class TimesheetController {
    constructor();
    syncHistorical: (req: AuthRequest, res: Response) => Promise<void>;
    syncIncremental: (req: AuthRequest, res: Response) => Promise<void>;
    processRawData: (req: AuthRequest, res: Response) => Promise<void>;
    getSyncStatus: (req: AuthRequest, res: Response) => Promise<void>;
    getDailyTimesheets: (req: AuthRequest, res: Response) => Promise<void>;
    getWeeklyTimesheets: (req: AuthRequest, res: Response) => Promise<void>;
    getMonthlyTimesheets: (req: AuthRequest, res: Response) => Promise<void>;
    getTimesheetSummary: (req: AuthRequest, res: Response) => Promise<void>;
    private getTimesheetsByDate;
    private getTimesheetsByDateRange;
    private groupTimesheetsByDay;
    private calculateOverallStatus;
}
export default TimesheetController;
//# sourceMappingURL=timesheetController.d.ts.map