"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
const firebase_1 = require("../../config/firebase");
async function verifyToken(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        const [, token] = header.split(' ');
        if (!token)
            return res.status(401).json({ error: 'Token requerido' });
        const decoded = await firebase_1.auth.verifyIdToken(token);
        req.user = { uid: decoded.uid, email: decoded.email || undefined };
        // cargar rol desde colección usuarios
        const snap = await firebase_1.firestore.collection('usuarios').where('uid', '==', decoded.uid).limit(1).get();
        if (!snap.empty) {
            const data = snap.docs[0].data();
            req.user.rol = data.rol;
        }
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}
