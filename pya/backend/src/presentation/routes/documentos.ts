import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { DocumentosRepository } from '../../infrastructure/repositories/documentos.repo';
import { NotificacionesService } from '../../application/notificaciones/notificaciones.service';
import { db } from '../../config/firebase';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';

const documentosRouter = Router();
const repo = new DocumentosRepository();
const notificacionesService = new NotificacionesService();

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

// Listar documentos (GET /api/documentos)
documentosRouter.get('/', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const rol = (req.user?.rol || '').toUpperCase();
    // Solo gestores y admin ven todo. Clientes podrían filtrarse por trámite (pendiente de implementar si se requiere)
    if (rol !== 'GESTOR' && rol !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const docs = await repo.obtenerTodos();

    const toIso = (v: any) => {
      if (!v) return undefined;
      if (v instanceof Date) return v.toISOString();
      if (v._seconds) return new Date(v._seconds * 1000).toISOString();
      const d = new Date(v);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    };

    const payload = docs.map(d => ({
      idDocumento: (d as any).idDocumento,
      tramiteId: d.tramiteId,
      tipo: d.tipo,
      nombreArchivo: d.nombreArchivo,
      descripcion: (d as any).descripcion,
      url: (d as any).urlArchivo || (d as any).url,
      fechaCarga: toIso((d as any).fechaCarga || (d as any).fechaSubida),
      validado: (d as any).validado || false
    }));

    res.json(payload);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'No se pudieron listar documentos' });
  }
});

// Subir documento (caso de uso: Adjuntar Documentos)
documentosRouter.post('/upload', verifyToken, upload.single('archivo'), async (req: RequestWithUser, res: Response) => {
  let tempFilePath: string | null = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    tempFilePath = req.file.path;
    const { tramiteId, tipo, descripcion } = req.body;
    
    if (!tramiteId || !tipo) {
      return res.status(400).json({ error: 'tramiteId y tipo son requeridos' });
    }

    console.log(`[documentos] Subiendo archivo: ${req.file.originalname} para trámite ${tramiteId}`);

    // Guardar archivo y exponer endpoint de descarga
    const urlArchivo = `${process.env.API_BASE_URL || 'http://localhost:4000/api'}/documentos/${tramiteId}/descargar/${req.file.filename}`;

    // Crear registro en Firestore
    const documento = await repo.crear({
      tramiteId,
      tipo,
      nombreArchivo: req.file.originalname,
      urlArchivo,
      descripcion: descripcion || '',
      fechaSubida: new Date(),
      validado: false,
      rutaLocal: req.file.path
    } as any);

    console.log(`[documentos] Documento registrado: ${documento.idDocumento}`);

    // Crear notificación para los aseguradores
    try {
      // Obtener el trámite para obtener información
      const tramiteRef = db.collection('tramites').doc(tramiteId);
      const tramiteDoc = await tramiteRef.get();
      const tramiteData = tramiteDoc.data();

      if (tramiteData) {
        // Obtener todos los usuarios con rol ASEGURADOR
        const usuariosSnapshot = await db.collection('usuarios').where('rol', '==', 'ASEGURADOR').get();
        
        // Crear notificación para cada asegurador
        const notificacionesPromises = usuariosSnapshot.docs.map(doc => {
          const usuarioId = doc.id;
          return db.collection('notificaciones').add({
            idTramite: tramiteId,
            titulo: `Nuevo documento en trámite ${tramiteData.codigoUnico || tramiteId}`,
            mensaje: `Se ha cargado un nuevo documento (${tipo}) para el trámite. Documento: ${documento.nombreArchivo}`,
            tipo: 'DOCUMENTO_SUBIDO',
            destinatario: usuarioId,
            leida: false,
            fechaEnvio: new Date(),
            origen: 'DOCUMENTO_UPLOAD'
          });
        });

        // Crear notificación específica para VpRZEMnZZhWNnBHelZysTNCaqq62
        notificacionesPromises.push(
          db.collection('notificaciones').add({
            idTramite: tramiteId,
            titulo: `Nuevo documento en trámite ${tramiteData.codigoUnico || tramiteId}`,
            mensaje: `Se ha cargado un nuevo documento (${tipo}) para el trámite. Documento: ${documento.nombreArchivo}`,
            tipo: 'DOCUMENTO_SUBIDO',
            destinatario: 'VpRZEMnZZhWNnBHelZysTNCaqq62',
            leida: false,
            fechaEnvio: new Date(),
            origen: 'DOCUMENTO_UPLOAD'
          })
        );

        await Promise.all(notificacionesPromises);
        console.log(`[documentos] Notificaciones enviadas a ${usuariosSnapshot.size} aseguradores + usuario específico`);
      }
    } catch (notifError) {
      // No fallar la carga si hay error en notificaciones
      console.warn('[documentos] Error creando notificaciones:', notifError);
    }

    res.status(201).json(documento);
  } catch (err: any) {
    console.error('[documentos] Error en upload:', err);
    res.status(500).json({ error: err.message || 'Error al subir documento' });
  } finally {
  }
});

// Descargar archivo por filename (se guardó en uploads)
documentosRouter.get('/:tramiteId/descargar/:filename', async (req: RequestWithUser, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Archivo no encontrado');
    }
    const mimeType = mime.lookup(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType as string);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err: any) {
    console.error('[documentos] Error descargando archivo:', err);
    res.status(500).send('Error al descargar archivo');
  }
});

// Obtener documentos de un trámite
documentosRouter.get('/tramite/:tramiteId', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const tramiteId = req.params.tramiteId;
    console.log('[documentos] GET /tramite/:tramiteId - Buscando documentos para tramiteId:', tramiteId);
    
    const documentos = await repo.obtenerPorTramite(tramiteId);
    console.log('[documentos] Documentos encontrados:', documentos.length);
    
    if (documentos.length > 0) {
      console.log('[documentos] Detalles documentos:', documentos.map(d => ({
        id: (d as any).idDocumento,
        tramiteId: (d as any).tramiteId,
        nombre: (d as any).nombreArchivo,
        tipo: (d as any).tipo
      })));
    }
    
    // Normalizar URLs para que apunten al endpoint de descarga del backend
    const apiBase = process.env.API_BASE_URL || 'http://localhost:4000/api';
    const toIso = (v: any) => {
      if (!v) return undefined;
      if (v instanceof Date) return v.toISOString();
      if (v._seconds) return new Date(v._seconds * 1000).toISOString();
      const d = new Date(v);
      return isNaN(d.getTime()) ? undefined : d.toISOString();
    };
    
    const normalized = documentos.map(doc => {
      const d = doc as any;
      // Extraer filename del rutaLocal o del urlArchivo existente
      let filename = '';
      if (d.rutaLocal) {
        filename = d.rutaLocal.split(/[/\\]/).pop() || '';
      } else if (d.urlArchivo && d.urlArchivo.includes('/descargar/')) {
        filename = d.urlArchivo.split('/descargar/').pop() || '';
      }
      
      // IMPORTANTE: Usar el tramiteId del documento, NO del parámetro de la URL
      const docTramiteId = d.tramiteId || tramiteId;
      
      // Construir URL de descarga válida usando el tramiteId correcto
      const downloadUrl = filename 
        ? `${apiBase}/documentos/${docTramiteId}/descargar/${filename}`
        : d.urlArchivo || d.url;
      
      console.log('[documentos] Normalizando doc:', d.nombreArchivo, 'tramiteId:', docTramiteId, 'filename:', filename, 'url:', downloadUrl);
      
      return {
        idDocumento: d.idDocumento || d.id,
        tramiteId: docTramiteId,
        tipo: d.tipo,
        nombreArchivo: d.nombreArchivo || 'Documento',
        descripcion: d.descripcion,
        url: downloadUrl,
        urlArchivo: downloadUrl,
        fechaCarga: toIso(d.fechaCarga || d.fechaSubida),
        validado: !!d.validado
      };
    });
    
    console.log('[documentos] Enviando', normalized.length, 'documentos normalizados');
    res.json(normalized);
  } catch (err: any) {
    console.error('[documentos] Error en GET /tramite/:tramiteId:', err);
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
