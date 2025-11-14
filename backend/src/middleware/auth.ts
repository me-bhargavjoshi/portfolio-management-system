import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { JWTPayload } from '../types';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authMiddleware = (_req: AuthRequest, res: Response, _next: NextFunction): void => {
  const token = _req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    _req.user = decoded;
    _next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const roleMiddleware = (allowedRoles: string[]) => {
  return (_req: AuthRequest, res: Response, _next: NextFunction): void => {
    if (!_req.user || !allowedRoles.includes(_req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    _next();
  };
};

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
