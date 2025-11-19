import { Request, Response } from 'express';
export declare class KekaProjectController {
    static getProjects(req: Request, res: Response): Promise<void>;
    static getProjectById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getProjectTasks(req: Request, res: Response): Promise<void>;
    static getProjectTimeEntries(req: Request, res: Response): Promise<void>;
    static getProjectAnalytics(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=KekaProjectController.d.ts.map