"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificacionesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const notificaciones_service_1 = require("../../application/notificaciones/notificaciones.service");
const firebase_1 = require("../../config/firebase");
const notificacionesRouter = (0, express_1.Router)();
exports.notificacionesRouter = notificacionesRouter;
const service = new notificaciones_service_1.NotificacionesService();
// Obtener notificaciones del usuario autenticado
notificacionesRouter.get('/mis-notificaciones', auth_1.verifyToken, async (req, res) => {
    try {
        const uid = req.user?.uid;
        const notificaciones = await service.obtenerPorDestinatario(uid);
        res.json(notificaciones);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener notificaciones no leídas
notificacionesRouter.get('/no-leidas', auth_1.verifyToken, async (req, res) => {
    try {
        const uid = req.user?.uid;
        const notificaciones = await service.obtenerNoLeidas(uid);
        res.json(notificaciones);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener notificaciones de un trámite
notificacionesRouter.get('/tramite/:tramiteId', auth_1.verifyToken, async (req, res) => {
    try {
        const notificaciones = await service.obtenerPorTramite(req.params.tramiteId);
        res.json(notificaciones);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Marcar como leída
notificacionesRouter.patch('/:id/leer', auth_1.verifyToken, async (req, res) => {
    try {
        const notificacion = await service.marcarComoLeida(req.params.id);
        res.json(notificacion);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Obtener por ID
notificacionesRouter.get('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const uid = req.user?.uid;
        const notificaciones = await service.obtenerPorDestinatario(uid);
        const notificacion = notificaciones.find(n => n.idNotificacion === req.params.id);
        if (!notificacion) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        res.json(notificacion);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Crear notificación de prueba (para testing)
notificacionesRouter.post('/test/crear', async (req, res) => {
    try {
        const { destinatario, titulo, mensaje, tipo = 'DOCUMENTO_SUBIDO', idTramite } = req.body;
        if (!destinatario || !titulo || !mensaje) {
            return res.status(400).json({ error: 'destinatario, titulo y mensaje son requeridos' });
        }
        const notificacionId = await firebase_1.firestore.collection('notificaciones').add({
            destinatario,
            titulo,
            mensaje,
            tipo,
            idTramite: idTramite || null,
            origen: 'TESTING',
            leida: false,
            fechaEnvio: new Date(),
            fechaLectura: null
        });
        res.status(201).json({
            success: true,
            notificacionId: notificacionId.id,
            message: 'Notificación de prueba creada exitosamente'
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
