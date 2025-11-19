import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    static register(req: Request, res: Response, next: NextFunction): Promise<void>;
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static refreshToken(req: Request, res: Response, _next: NextFunction): Promise<void>;
    static logout(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=auth.d.ts.map