"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tramitesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const roles_1 = require("../middlewares/roles");
const tramite_service_1 = require("../../application/tramites/tramite.service");
const tramitesRouter = (0, express_1.Router)();
exports.tramitesRouter = tramitesRouter;
const service = new tramite_service_1.TramiteService();
// Crear trámite (Registrar Nuevo Trámite del diagrama de secuencia)
tramitesRouter.post('/', auth_1.verifyToken, (0, roles_1.requireRole)(['cliente', 'gestor']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const rol = req.user?.rol;
        const result = await service.crearTramite(req.body, uid, rol);
        res.status(201).json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'No se pudo crear el trámite' });
    }
});
// Listar trámites
tramitesRouter.get('/', auth_1.verifyToken, async (req, res) => {
    try {
        const rol = req.user?.rol;
        const uid = req.user?.uid;
        const result = await service.listarTramites({ rol, uid });
        res.json(result);
    }
    catch (err) {
        res.status(400).json({ error: err.message || 'No se pudo listar trámites' });
    }
});
// Obtener trámite por ID
tramitesRouter.get('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const tramite = await service.obtenerPorId(req.params.id);
        if (!tramite) {
            return res.status(404).json({ error: 'Trámite no encontrado' });
        }
        res.json(tramite);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener historial del trámite
tramitesRouter.get('/:id/historial', auth_1.verifyToken, async (req, res) => {
    try {
        const historial = await service.obtenerHistorial(req.params.id);
        res.json(historial);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Listar trámites por estado
tramitesRouter.get('/estado/:estado', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const estado = req.params.estado;
        const tramites = await service.listarPorEstado(estado);
        res.json(tramites);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Validar trámite (Validar Información del diagrama)
tramitesRouter.post('/:id/validar', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const rol = req.user?.rol;
        const resultado = await service.validarTramite(req.params.id, uid, rol);
        res.json(resultado);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Enviar a aseguradora (Procesar y Resolver del diagrama)
tramitesRouter.post('/:id/enviar-aseguradora', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const rol = req.user?.rol;
        const { idAseguradora } = req.body;
        if (!idAseguradora) {
            return res.status(400).json({ error: 'idAseguradora es requerido' });
        }
        const resultado = await service.enviarAAseguradora(req.params.id, idAseguradora, uid, rol);
        res.json(resultado);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Registrar resultado de aseguradora
tramitesRouter.post('/:id/resultado', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin', 'aseguradora']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const rol = req.user?.rol;
        const { aprobado, montoAprobado, observaciones } = req.body;
        if (typeof aprobado !== 'boolean') {
            return res.status(400).json({ error: 'aprobado (boolean) es requerido' });
        }
        const resultado = await service.registrarResultadoAseguradora(req.params.id, { aprobado, montoAprobado, observaciones }, uid, rol);
        res.json(resultado);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Solicitar correcciones (Gestionar Correcciones del diagrama)
tramitesRouter.post('/:id/correcciones', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const rol = req.user?.rol;
        const { descripcion } = req.body;
        if (!descripcion) {
            return res.status(400).json({ error: 'descripcion es requerida' });
        }
        const resultado = await service.solicitarCorrecciones(req.params.id, descripcion, uid, rol);
        res.json(resultado);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Confirmar pago (Monitorear Pago del diagrama)
tramitesRouter.post('/:id/pago', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const rol = req.user?.rol;
        const resultado = await service.confirmarPago(req.params.id, uid, rol);
        res.json(resultado);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Endpoints legacy (mantener compatibilidad, pero redirigen a nuevos métodos)
tramitesRouter.patch('/:id/aprobar', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const rol = req.user?.rol;
        const { montoAprobado, observaciones } = req.body;
        const resultado = await service.registrarResultadoAseguradora(req.params.id, { aprobado: true, montoAprobado, observaciones }, uid, rol);
        res.json(resultado);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
tramitesRouter.patch('/:id/rechazar', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const rol = req.user?.rol;
        const { motivo } = req.body;
        const resultado = await service.registrarResultadoAseguradora(req.params.id, { aprobado: false, observaciones: motivo }, uid, rol);
        res.json(resultado);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
tramitesRouter.patch('/:id/observar', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const uid = req.user?.uid;
        const rol = req.user?.rol;
        const { motivo } = req.body;
        const resultado = await service.solicitarCorrecciones(req.params.id, motivo, uid, rol);
        res.json(resultado);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
