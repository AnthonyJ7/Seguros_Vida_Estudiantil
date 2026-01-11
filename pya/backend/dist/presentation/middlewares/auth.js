"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = verifyToken;
const firebase_1 = require("../../config/firebase");
async function verifyToken(req, res, next) {
    try {
        const header = req.headers.authorization || '';
        console.log('[auth] Authorization header:', header ? `${header.substring(0, 20)}...` : 'empty');
        const [, token] = header.split(' ');
        if (!token) {
            console.log('[auth] No token found in header');
            return res.status(401).json({ error: 'Token requerido' });
        }
        let decoded;
        try {
            console.log('[auth] Verifying token with Firebase...');
            decoded = await firebase_1.auth.verifyIdToken(token);
            console.log('[auth] Token verified successfully for uid:', decoded.uid);
        }
        catch (e) {
            try {
                const parts = token.split('.');
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                const aud = payload?.aud;
                const iss = payload?.iss;
                console.error('[auth] verifyIdToken failed:', e?.message || e, 'aud:', aud, 'iss:', iss, 'expected projectId:', process.env.FIREBASE_PROJECT_ID);
            }
            catch { }
            console.error('[auth] verifyIdToken error details end');
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }
        req.user = { uid: decoded.uid, email: decoded.email || undefined };
        // cargar rol desde colección usuarios, pero usar un rol por defecto si no existe
        const snap = await firebase_1.firestore.collection('usuarios').where('uid', '==', decoded.uid).limit(1).get();
        if (!snap.empty) {
            const data = snap.docs[0].data();
            req.user.rol = data.rol;
            console.log('[auth] User role from DB:', req.user.rol);
        }
        else {
            // Si no existe usuario en BD, asignar rol ADMIN por defecto para desarrollo
            // En producción, esto debería ser más restrictivo
            console.warn(`[auth] Usuario ${decoded.uid} no encontrado en BD. Asignando rol ADMIN por defecto.`);
            req.user.rol = 'ADMIN';
        }
        next();
    }
    catch (err) {
        console.error('[auth] unexpected error:', err?.message || err);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}
