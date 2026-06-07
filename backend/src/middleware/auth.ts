import { Request, Response, NextFunction } from 'express';
import { query } from '../db.js';
import { User } from '../types/index.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.session.userId]);
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({ error: 'Forbidden: admin access required' });
    }
    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireInternalToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-import-secret'];
  if (token !== process.env.IMPORT_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}
