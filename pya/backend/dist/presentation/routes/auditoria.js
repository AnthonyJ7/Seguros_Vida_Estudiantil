"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditoriaRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const roles_1 = require("../middlewares/roles");
const auditoria_repo_1 = require("../../infrastructure/repositories/auditoria.repo");
const auditoriaRouter = (0, express_1.Router)();
exports.auditoriaRouter = auditoriaRouter;
const repo = new auditoria_repo_1.AuditoriaRepository();
// Listar auditoría reciente
auditoriaRouter.get('/', auth_1.verifyToken, (0, roles_1.requireRole)(['ADMIN']), async (_req, res) => {
    try {
        const registros = await repo.listar();
        res.json(registros);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener auditoría por trámite
auditoriaRouter.get('/tramite/:tramiteId', auth_1.verifyToken, (0, roles_1.requireRole)(['ADMIN', 'GESTOR']), async (req, res) => {
    try {
        const registros = await repo.obtenerPorTramite(req.params.tramiteId);
        res.json(registros);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener auditoría por usuario
auditoriaRouter.get('/usuario/:usuarioId', auth_1.verifyToken, (0, roles_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const registros = await repo.obtenerPorUsuario(req.params.usuarioId);
        res.json(registros);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener auditoría por entidad
auditoriaRouter.get('/entidad/:entidad', auth_1.verifyToken, (0, roles_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const registros = await repo.obtenerPorEntidad(req.params.entidad);
        res.json(registros);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener auditoría por rango de fechas
auditoriaRouter.get('/fecha/:fechaInicio/:fechaFin', auth_1.verifyToken, (0, roles_1.requireRole)(['ADMIN']), async (req, res) => {
    try {
        const fechaInicio = new Date(req.params.fechaInicio);
        const fechaFin = new Date(req.params.fechaFin);
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
            return res.status(400).json({ error: 'Fechas inválidas' });
        }
        const registros = await repo.obtenerPorFecha(fechaInicio, fechaFin);
        res.json(registros);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Registrar evento manualmente (caso especial)
auditoriaRouter.post('/', auth_1.verifyToken, (0, roles_1.requireRole)(['admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const registro = await repo.registrar({
            ...req.body,
            usuarioId: uid,
            fecha: new Date()
        });
        res.status(201).json(registro);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
