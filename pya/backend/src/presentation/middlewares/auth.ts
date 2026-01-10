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

    let decoded;
    try {
      decoded = await auth.verifyIdToken(token);
    } catch (e: any) {
      try {
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        const aud = payload?.aud;
        const iss = payload?.iss;
        console.error('[auth] verifyIdToken failed:', e?.message || e, 'aud:', aud, 'iss:', iss, 'expected projectId:', process.env.FIREBASE_PROJECT_ID);
      } catch {}
      console.error('[auth] verifyIdToken error details end');
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    req.user = { uid: decoded.uid, email: decoded.email || undefined };

    // cargar rol desde colección usuarios, pero usar un rol por defecto si no existe
    const snap = await firestore.collection('usuarios').where('uid', '==', decoded.uid).limit(1).get();
    if (!snap.empty) {
      const data = snap.docs[0].data();
      req.user.rol = (data as any).rol;
    } else {
      // Si no existe usuario en BD, asignar rol ADMIN por defecto para desarrollo
      // En producción, esto debería ser más restrictivo
      console.warn(`[auth] Usuario ${decoded.uid} no encontrado en BD. Asignando rol ADMIN por defecto.`);
      req.user.rol = 'ADMIN';
    }

    next();
  } catch (err: any) {
    console.error('[auth] unexpected error:', err?.message || err);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
