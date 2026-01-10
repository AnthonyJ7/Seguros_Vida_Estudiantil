import { Router } from 'express';
import { firestore, auth } from '../../config/firebase';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';

export const usuariosRouter = Router();

// GET /api/usuarios/me - Perfil del usuario autenticado
usuariosRouter.get('/me', verifyToken, async (req: RequestWithUser, res) => {
  try {
    if (!req.user) {
      console.error('[usuarios/me] req.user is undefined');
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }
    const uid = req.user.uid;
    console.log('[usuarios/me] Obteniendo perfil para uid:', uid);
    const snap = await firestore.collection('usuarios').where('uid', '==', uid).limit(1).get();
    if (snap.empty) {
      // Retornar stub para evitar 404 en UI cuando el perfil aún no está creado
      console.log('[usuarios/me] Usuario no encontrado en BD, retornando stub');
      return res.json({ uid, mensaje: 'Perfil no encontrado en BD', rol: req.user?.rol || 'ADMIN' });
    }
    const doc = snap.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err: any) {
    console.error('[usuarios/me] Error:', err?.message || err);
    res.status(500).json({ error: 'Error obteniendo perfil de usuario', details: err?.message });
  }
});

// POST /api/usuarios/create-admin - Crear usuario en Firebase (solo para setup)
usuariosRouter.post('/create-admin', async (req, res) => {
  try {
    const { email, password, uid } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password requeridos' });
    }
    
    // Crear usuario en Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      uid: uid || undefined
    });
    
    res.json({ 
      success: true, 
      message: 'Usuario creado en Firebase',
      uid: userRecord.uid,
      email: userRecord.email
    });
  } catch (err: any) {
    console.error('[usuarios] Error creando usuario:', err);
    res.status(500).json({ 
      error: err.message || 'Error creando usuario en Firebase',
      code: err.code 
    });
  }
});

// GET /api/usuarios - Listado (solo ADMIN)
usuariosRouter.get('/', verifyToken, requireRole(['ADMIN']), async (_req, res) => {
  try {
    const snap = await firestore.collection('usuarios').get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Error listando usuarios' });
  }
});

// GET /api/usuarios/:uid - Por UID (solo ADMIN)
usuariosRouter.get('/:uid', verifyToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const uid = req.params.uid;
    const snap = await firestore.collection('usuarios').where('uid', '==', uid).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Usuario no encontrado' });
    const doc = snap.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo usuario' });
  }
});
