"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estudiantesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const roles_1 = require("../middlewares/roles");
const estudiantes_service_1 = require("../../application/estudiantes/estudiantes.service");
const estudiantesRouter = (0, express_1.Router)();
exports.estudiantesRouter = estudiantesRouter;
const service = new estudiantes_service_1.EstudiantesService();
// Verificar elegibilidad (caso de uso: Verificar Elegibilidad)
estudiantesRouter.post('/verificar-elegibilidad', auth_1.verifyToken, async (req, res) => {
    try {
        const { cedula } = req.body;
        if (!cedula) {
            return res.status(400).json({ error: 'Cédula es requerida' });
        }
        const resultado = await service.verificarElegibilidad(cedula);
        res.json(resultado);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener por cédula
estudiantesRouter.get('/cedula/:cedula', auth_1.verifyToken, async (req, res) => {
    try {
        const estudiante = await service.obtenerPorCedula(req.params.cedula);
        if (!estudiante) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        res.json(estudiante);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener por ID
estudiantesRouter.get('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const estudiante = await service.obtenerPorId(req.params.id);
        if (!estudiante) {
            return res.status(404).json({ error: 'Estudiante no encontrado' });
        }
        res.json(estudiante);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Listar estudiantes
estudiantesRouter.get('/', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const estudiantes = await service.listar();
        res.json(estudiantes);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Crear estudiante
estudiantesRouter.post('/', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const estudiante = await service.crear(req.body, uid);
        res.status(201).json(estudiante);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Actualizar estado académico
estudiantesRouter.patch('/:id/estado', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const { estadoAcademico } = req.body;
        if (!estadoAcademico) {
            return res.status(400).json({ error: 'estadoAcademico es requerido' });
        }
        const estudiante = await service.actualizarEstadoAcademico(req.params.id, estadoAcademico, uid);
        res.json(estudiante);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
