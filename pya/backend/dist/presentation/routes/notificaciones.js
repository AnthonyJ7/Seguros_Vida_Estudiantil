"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificacionesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const notificaciones_service_1 = require("../../application/notificaciones/notificaciones.service");
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
