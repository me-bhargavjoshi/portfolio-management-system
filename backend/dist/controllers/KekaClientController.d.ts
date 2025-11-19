import { Request, Response } from 'express';
export declare class KekaClientController {
    static getClients(req: Request, res: Response): Promise<void>;
    static getClientById(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getClientProjects(req: Request, res: Response): Promise<void>;
    static getClientAnalytics(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=KekaClientController.d.ts.map