import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { db, UserRecord } from '../db/firestore.js';

export interface AuthRequest extends Request {
  user?: Omit<UserRecord, 'passwordHash'>;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { id: string; email: string };
    db.getUserById(payload.id).then((user) => {
      if (!user) {
        res.status(401).json({ error: 'User no longer exists' });
        return;
      }
      const { passwordHash: _, ...safeUser } = user;
      req.user = safeUser;
      next();
    }).catch((err) => {
      console.error('Auth lookup error:', err);
      res.status(500).json({ error: 'Authentication internal error' });
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}
