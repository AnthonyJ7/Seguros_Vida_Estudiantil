import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { TramiteService } from '../../application/tramites/tramite.service';

const dashboardRouter = Router();
const tramitesService = new TramiteService();

// Dashboard para cliente: datos agregados (tramites, documentos, notificaciones, cobertura)
dashboardRouter.get('/cliente', verifyToken, requireRole(['cliente']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const data = await tramitesService.obtenerDashboardCliente(uid);
    res.json(data);
  } catch (err: any) {
    console.error('[dashboard/cliente] Error:', err?.message);
    res.status(500).json({ error: err.message || 'No se pudo obtener el dashboard del cliente' });
  }
});

export { dashboardRouter };
