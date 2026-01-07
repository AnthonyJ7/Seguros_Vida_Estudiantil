import { Router } from 'express';
import { firestore } from '../../config/firebase';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';

export const usuariosRouter = Router();

// GET /api/usuarios/me - Perfil del usuario autenticado
usuariosRouter.get('/me', verifyToken, async (req: RequestWithUser, res) => {
  try {
    const uid = req.user!.uid;
    const snap = await firestore.collection('usuarios').where('uid', '==', uid).limit(1).get();
    if (snap.empty) return res.status(404).json({ error: 'Perfil de usuario no encontrado' });
    const doc = snap.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo perfil de usuario' });
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
