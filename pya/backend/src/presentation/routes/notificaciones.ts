import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { NotificacionesService } from '../../application/notificaciones/notificaciones.service';
import { firestore } from '../../config/firebase';

const notificacionesRouter = Router();
const service = new NotificacionesService();

// Obtener notificaciones del usuario autenticado
notificacionesRouter.get('/mis-notificaciones', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const notificaciones = await service.obtenerPorDestinatario(uid);
    res.json(notificaciones);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener notificaciones no leídas
notificacionesRouter.get('/no-leidas', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const notificaciones = await service.obtenerNoLeidas(uid);
    res.json(notificaciones);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener notificaciones de un trámite
notificacionesRouter.get('/tramite/:tramiteId', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const notificaciones = await service.obtenerPorTramite(req.params.tramiteId);
    res.json(notificaciones);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar como leída
notificacionesRouter.patch('/:id/leer', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const notificacion = await service.marcarComoLeida(req.params.id);
    res.json(notificacion);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener por ID
notificacionesRouter.get('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const notificaciones = await service.obtenerPorDestinatario(uid);
    const notificacion = notificaciones.find(n => n.idNotificacion === req.params.id);
    
    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    res.json(notificacion);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Crear notificación de prueba (para testing)
notificacionesRouter.post('/test/crear', async (req: RequestWithUser, res: Response) => {
  try {
    const { destinatario, titulo, mensaje, tipo = 'DOCUMENTO_SUBIDO', idTramite } = req.body;
    
    if (!destinatario || !titulo || !mensaje) {
      return res.status(400).json({ error: 'destinatario, titulo y mensaje son requeridos' });
    }
    
    const notificacionId = await firestore.collection('notificaciones').add({
      destinatario,
      titulo,
      mensaje,
      tipo,
      idTramite: idTramite || null,
      origen: 'TESTING',
      leida: false,
      fechaEnvio: new Date(),
      fechaLectura: null
    });
    
    res.status(201).json({
      success: true,
      notificacionId: notificacionId.id,
      message: 'Notificación de prueba creada exitosamente'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export { notificacionesRouter };
