"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aseguradorasRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const roles_1 = require("../middlewares/roles");
const aseguradoras_repo_1 = require("../../infrastructure/repositories/aseguradoras.repo");
const aseguradorasRouter = (0, express_1.Router)();
exports.aseguradorasRouter = aseguradorasRouter;
const repo = new aseguradoras_repo_1.AseguradorasRepository();
// Listar todas las aseguradoras
aseguradorasRouter.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const aseguradoras = await repo.listarTodos();
        res.json(aseguradoras);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener por ID
aseguradorasRouter.get('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const aseguradora = await repo.obtenerPorId(req.params.id);
        if (!aseguradora) {
            return res.status(404).json({ error: 'Aseguradora no encontrada' });
        }
        res.json(aseguradora);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Crear aseguradora
aseguradorasRouter.post('/', auth_1.verifyToken, (0, roles_1.requireRole)(['admin']), async (req, res) => {
    try {
        const aseguradora = await repo.crear(req.body);
        res.status(201).json(aseguradora);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Actualizar aseguradora
aseguradorasRouter.put('/:id', auth_1.verifyToken, (0, roles_1.requireRole)(['admin']), async (req, res) => {
    try {
        const aseguradora = await repo.actualizar(req.params.id, req.body);
        res.json(aseguradora);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Eliminar aseguradora
aseguradorasRouter.delete('/:id', auth_1.verifyToken, (0, roles_1.requireRole)(['admin']), async (req, res) => {
    try {
        await repo.eliminar(req.params.id);
        res.json({ mensaje: 'Aseguradora eliminada correctamente' });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
