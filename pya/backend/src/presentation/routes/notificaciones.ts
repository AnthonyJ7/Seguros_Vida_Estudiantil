import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { NotificacionesService } from '../../application/notificaciones/notificaciones.service';

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

export { notificacionesRouter };
