import { Request, Response } from 'express';
export declare class KekaEmployeeController {
    static getEmployees(req: Request, res: Response): Promise<void>;
    static getEmployeeById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getDepartments(_req: Request, res: Response): Promise<void>;
    static getEmployeeTimeEntries(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=KekaEmployeeController.d.ts.map