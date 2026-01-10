import { Response, NextFunction } from 'express';
import { RequestWithUser } from './auth';

export function requireRole(roles: string[]) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const rol = req.user?.rol?.toUpperCase();
    const rolesUpper = roles.map(r => r.toUpperCase());
    if (!rol || !rolesUpper.includes(rol)) {
      return res.status(403).json({ error: `Acceso denegado. Rol requerido: ${roles.join(', ')}. Rol actual: ${req.user?.rol}` });
    }
    next();
  };
}
