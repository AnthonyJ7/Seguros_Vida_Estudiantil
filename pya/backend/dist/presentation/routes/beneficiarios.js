"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beneficiariosRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const beneficiarios_repo_1 = require("../../infrastructure/repositories/beneficiarios.repo");
const beneficiariosRouter = (0, express_1.Router)();
exports.beneficiariosRouter = beneficiariosRouter;
const repo = new beneficiarios_repo_1.BeneficiariosRepository();
// Obtener beneficiarios de un trámite
beneficiariosRouter.get('/tramite/:tramiteId', auth_1.verifyToken, async (req, res) => {
    try {
        const beneficiarios = await repo.obtenerPorTramite(req.params.tramiteId);
        res.json(beneficiarios);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener por ID
beneficiariosRouter.get('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const beneficiario = await repo.obtenerPorId(req.params.id);
        if (!beneficiario) {
            return res.status(404).json({ error: 'Beneficiario no encontrado' });
        }
        res.json(beneficiario);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Crear beneficiario
beneficiariosRouter.post('/', auth_1.verifyToken, async (req, res) => {
    try {
        const beneficiario = await repo.crear(req.body);
        res.status(201).json(beneficiario);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Actualizar beneficiario
beneficiariosRouter.put('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const beneficiario = await repo.actualizar(req.params.id, req.body);
        res.json(beneficiario);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Eliminar beneficiario
beneficiariosRouter.delete('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        await repo.eliminar(req.params.id);
        res.json({ mensaje: 'Beneficiario eliminado correctamente' });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
