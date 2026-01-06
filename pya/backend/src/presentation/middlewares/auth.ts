import { Request, Response, NextFunction } from 'express';
import { auth, firestore } from '../../config/firebase';

export interface RequestWithUser extends Request {
  user?: {
    uid: string;
    email?: string;
    rol?: string;
  };
}

export async function verifyToken(req: RequestWithUser, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) return res.status(401).json({ error: 'Token requerido' });

    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email || undefined };

    // cargar rol desde colección usuarios
    const snap = await firestore.collection('usuarios').where('uid', '==', decoded.uid).limit(1).get();
    if (!snap.empty) {
      const data = snap.docs[0].data();
      req.user.rol = (data as any).rol;
    }

    next();
  } catch (err: any) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
