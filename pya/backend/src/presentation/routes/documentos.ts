import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { DocumentosRepository } from '../../infrastructure/repositories/documentos.repo';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const documentosRouter = Router();
const repo = new DocumentosRepository();

// Configuración de multer para almacenamiento temporal
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo PDF, JPEG, PNG'));
    }
  }
});

// Subir documento (caso de uso: Adjuntar Documentos)
documentosRouter.post('/upload', verifyToken, upload.single('archivo'), async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const { tramiteId, tipo, descripcion } = req.body;
    
    if (!tramiteId || !tipo) {
      // Eliminar archivo temporal
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'tramiteId y tipo son requeridos' });
    }

    // Subir a Firebase Storage
    const urlArchivo = await repo.subirArchivo(req.file.path, tramiteId);
    
    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

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
  } catch (err: any) {
    // Limpiar archivo temporal en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: err.message });
  }
});

// Obtener documentos de un trámite
documentosRouter.get('/tramite/:tramiteId', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const documentos = await repo.obtenerPorTramite(req.params.tramiteId);
    res.json(documentos);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener por ID
documentosRouter.get('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const documento = await repo.obtenerPorId(req.params.id);
    if (!documento) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    res.json(documento);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar como validado (caso de uso: Validar Información)
documentosRouter.patch('/:id/validar', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const documento = await repo.marcarComoValidado(req.params.id);
    res.json(documento);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar documento
documentosRouter.put('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const documento = await repo.actualizar(req.params.id, req.body);
    res.json(documento);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar documento
documentosRouter.delete('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    await repo.eliminar(req.params.id);
    res.json({ mensaje: 'Documento eliminado correctamente' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export { documentosRouter };
