import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repo';

const auditoriaRouter = Router();
const repo = new AuditoriaRepository();

// Listar auditoría reciente
auditoriaRouter.get('/', verifyToken, requireRole(['ADMIN']), async (_req: RequestWithUser, res: Response) => {
  try {
    const registros = await repo.listar();
    res.json(registros);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener auditoría por trámite
auditoriaRouter.get('/tramite/:tramiteId', verifyToken, requireRole(['ADMIN', 'GESTOR']), async (req: RequestWithUser, res: Response) => {
  try {
    const registros = await repo.obtenerPorTramite(req.params.tramiteId);
    res.json(registros);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener auditoría por usuario
auditoriaRouter.get('/usuario/:usuarioId', verifyToken, requireRole(['ADMIN']), async (req: RequestWithUser, res: Response) => {
  try {
    const registros = await repo.obtenerPorUsuario(req.params.usuarioId);
    res.json(registros);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener auditoría por entidad
auditoriaRouter.get('/entidad/:entidad', verifyToken, requireRole(['ADMIN']), async (req: RequestWithUser, res: Response) => {
  try {
    const registros = await repo.obtenerPorEntidad(req.params.entidad);
    res.json(registros);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener auditoría por rango de fechas
auditoriaRouter.get('/fecha/:fechaInicio/:fechaFin', verifyToken, requireRole(['ADMIN']), async (req: RequestWithUser, res: Response) => {
  try {
    const fechaInicio = new Date(req.params.fechaInicio);
    const fechaFin = new Date(req.params.fechaFin);
    
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return res.status(400).json({ error: 'Fechas inválidas' });
    }
    
    const registros = await repo.obtenerPorFecha(fechaInicio, fechaFin);
    res.json(registros);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Registrar evento manualmente (caso especial)
auditoriaRouter.post('/', verifyToken, requireRole(['admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const registro = await repo.registrar({
      ...req.body,
      usuarioId: uid,
      fecha: new Date()
    });
    res.status(201).json(registro);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export { auditoriaRouter };
