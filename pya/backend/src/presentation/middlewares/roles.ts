import { Response, NextFunction } from 'express';
import { RequestWithUser } from './auth';

export function requireRole(roles: string[]) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const rol = req.user?.rol;
    if (!rol || !roles.includes(rol)) {
      return res.status(403).json({ error: 'Acceso denegado para este rol' });
    }
    next();
  };
}
