import { Request, Response, NextFunction } from 'express';
import { JWTPayload } from '../types';
export interface AuthRequest extends Request {
    user?: JWTPayload;
}
export declare const authMiddleware: (_req: AuthRequest, res: Response, _next: NextFunction) => void;
export declare const roleMiddleware: (allowedRoles: string[]) => (_req: AuthRequest, res: Response, _next: NextFunction) => void;
export declare const errorHandler: (err: Error, _req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map