"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuariosRouter = void 0;
const express_1 = require("express");
const firebase_1 = require("../../config/firebase");
const auth_1 = require("../middlewares/auth");
const roles_1 = require("../middlewares/roles");
exports.usuariosRouter = (0, express_1.Router)();
// GET /api/usuarios/me - Perfil del usuario autenticado
exports.usuariosRouter.get('/me', auth_1.verifyToken, async (req, res) => {
    try {
        const uid = req.user.uid;
        const snap = await firebase_1.firestore.collection('usuarios').where('uid', '==', uid).limit(1).get();
        if (snap.empty)
            return res.status(404).json({ error: 'Perfil de usuario no encontrado' });
        const doc = snap.docs[0];
        res.json({ id: doc.id, ...doc.data() });
    }
    catch (err) {
        res.status(500).json({ error: 'Error obteniendo perfil de usuario' });
    }
});
// GET /api/usuarios - Listado (solo ADMIN)
exports.usuariosRouter.get('/', auth_1.verifyToken, (0, roles_1.requireRole)(['ADMIN']), async (_req, res) => {
    try {
        const snap = await firebase_1.firestore.collection('usuarios').get();
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json(items);
    }
    catch (err) {
        res.status(500).json({ error: 'Error listando usuarios' });
    }
});
// GET /api/usuarios/:uid - Por UID (solo ADMIN)
exports.usuariosRouter.get('/:uid', auth_1.verifyToken, (0, roles_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const uid = req.params.uid;
        const snap = await firebase_1.firestore.collection('usuarios').where('uid', '==', uid).limit(1).get();
        if (snap.empty)
            return res.status(404).json({ error: 'Usuario no encontrado' });
        const doc = snap.docs[0];
        res.json({ id: doc.id, ...doc.data() });
    }
    catch (err) {
        res.status(500).json({ error: 'Error obteniendo usuario' });
    }
});
