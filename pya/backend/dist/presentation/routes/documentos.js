"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentosRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const roles_1 = require("../middlewares/roles");
const documentos_repo_1 = require("../../infrastructure/repositories/documentos.repo");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const documentosRouter = (0, express_1.Router)();
exports.documentosRouter = documentosRouter;
const repo = new documentos_repo_1.DocumentosRepository();
// Configuración de multer para almacenamiento temporal
const uploadDir = path_1.default.join(__dirname, '../../../uploads');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Tipo de archivo no permitido. Solo PDF, JPEG, PNG'));
        }
    }
});
// Subir documento (caso de uso: Adjuntar Documentos)
documentosRouter.post('/upload', auth_1.verifyToken, upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se recibió archivo' });
        }
        const { tramiteId, tipo, descripcion } = req.body;
        if (!tramiteId || !tipo) {
            // Eliminar archivo temporal
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'tramiteId y tipo son requeridos' });
        }
        // Subir a Firebase Storage
        const urlArchivo = await repo.subirArchivo(req.file.path, tramiteId);
        // Eliminar archivo temporal
        fs_1.default.unlinkSync(req.file.path);
        // Crear registro en Firestore
        const documento = await repo.crear({
            tramiteId,
            tipo,
            nombreArchivo: req.file.originalname,
            urlArchivo,
            descripcion: descripcion || '',
            fechaSubida: new Date(),
            validado: false
        });
        res.status(201).json(documento);
    }
    catch (err) {
        // Limpiar archivo temporal en caso de error
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: err.message });
    }
});
// Obtener documentos de un trámite
documentosRouter.get('/tramite/:tramiteId', auth_1.verifyToken, async (req, res) => {
    try {
        const documentos = await repo.obtenerPorTramite(req.params.tramiteId);
        res.json(documentos);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Obtener por ID
documentosRouter.get('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const documento = await repo.obtenerPorId(req.params.id);
        if (!documento) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }
        res.json(documento);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Marcar como validado (caso de uso: Validar Información)
documentosRouter.patch('/:id/validar', auth_1.verifyToken, (0, roles_1.requireRole)(['gestor', 'admin']), async (req, res) => {
    try {
        const documento = await repo.marcarComoValidado(req.params.id);
        res.json(documento);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Actualizar documento
documentosRouter.put('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        const documento = await repo.actualizar(req.params.id, req.body);
        res.json(documento);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// Eliminar documento
documentosRouter.delete('/:id', auth_1.verifyToken, async (req, res) => {
    try {
        await repo.eliminar(req.params.id);
        res.json({ mensaje: 'Documento eliminado correctamente' });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
