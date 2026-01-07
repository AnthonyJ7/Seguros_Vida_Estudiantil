"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reglasRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const roles_1 = require("../middlewares/roles");
const reglas_service_1 = require("../../application/reglas/reglas.service");
const reglasRouter = (0, express_1.Router)();
exports.reglasRouter = reglasRouter;
const service = new reglas_service_1.ReglasService();
// Listar todas las reglas
reglasRouter.get('/', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const reglas = await service.listar();
        res.json(reglas);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener reglas activas
reglasRouter.get('/activas', auth_1.verifyToken, async (req, res) => {
    try {
        const reglas = await service.obtenerActivas();
        res.json(reglas);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener por ID
reglasRouter.get('/:id', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const regla = await service.obtenerPorId(req.params.id);
        if (!regla) {
            return res.status(404).json({ error: 'Regla no encontrada' });
        }
        res.json(regla);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Crear regla
reglasRouter.post('/', auth_1.verifyToken, (0, roles_1.requireRole)(['admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const regla = await service.crear(req.body, uid);
        res.status(201).json(regla);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Actualizar regla
reglasRouter.put('/:id', auth_1.verifyToken, (0, roles_1.requireRole)(['admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const regla = await service.actualizar(req.params.id, req.body, uid);
        res.json(regla);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Activar regla
reglasRouter.patch('/:id/activar', auth_1.verifyToken, (0, roles_1.requireRole)(['admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const regla = await service.activar(req.params.id, uid);
        res.json(regla);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Desactivar regla
reglasRouter.patch('/:id/desactivar', auth_1.verifyToken, (0, roles_1.requireRole)(['admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const regla = await service.desactivar(req.params.id, uid);
        res.json(regla);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
