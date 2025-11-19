import { Request, Response } from 'express';
export declare class KekaDashboardController {
    static getDashboardMetrics(_req: Request, res: Response): Promise<void>;
    static getRecentTimesheets(req: Request, res: Response): Promise<void>;
    static getTopProjects(req: Request, res: Response): Promise<void>;
    static getEmployeeUtilization(req: Request, res: Response): Promise<void>;
    static getTimesheetAnalytics(req: Request, res: Response): Promise<void>;
    static getAllTimesheets(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=KekaDashboardController.d.ts.map