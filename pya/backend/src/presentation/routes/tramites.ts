import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { TramiteService } from '../../application/tramites/tramite.service';
import { EstadoCaso } from '../../domain/tramite';

const tramitesRouter = Router();
const service = new TramiteService();

// Crear trámite (Registrar Nuevo Trámite del diagrama de secuencia)
tramitesRouter.post('/', verifyToken, requireRole(['cliente', 'gestor']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const rol = req.user?.rol as string;
    console.log('[tramites/POST] Recibido payload:', JSON.stringify(req.body, null, 2));
    console.log('[tramites/POST] Usuario:', uid, 'Rol:', rol);
    const result = await service.crearTramite(req.body, uid, rol);
    res.status(201).json(result);
  } catch (err: any) {
    console.error('[tramites/POST] Error:', err.message);
    console.error('[tramites/POST] Stack:', err.stack);
    res.status(400).json({ error: err.message || 'No se pudo crear el trámite' });
  }
});

// Listar trámites
tramitesRouter.get('/', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const rol = req.user?.rol;
    const uid = req.user?.uid as string;
    const estudiante = req.query.estudiante as string | undefined;
    const result = await service.listarTramites({ rol, uid, estudiante });
    res.json(result);
  } catch (err: any) {
    console.error('[tramites] error listing:', err?.message);
    res.status(400).json({ error: err.message || 'No se pudo listar trámites' });
  }
});

// Obtener trámite por ID
tramitesRouter.get('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const tramite = await service.obtenerPorId(req.params.id);
    if (!tramite) {
      return res.status(404).json({ error: 'Trámite no encontrado' });
    }
    res.json(tramite);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener historial del trámite
tramitesRouter.get('/:id/historial', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const historial = await service.obtenerHistorial(req.params.id);
    res.json(historial);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar trámites por estado
tramitesRouter.get('/estado/:estado', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const estado = req.params.estado as EstadoCaso;
    const tramites = await service.listarPorEstado(estado);
    res.json(tramites);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Validar trámite (Validar Información del diagrama)
tramitesRouter.post('/:id/validar', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const rol = req.user?.rol as string;
    const resultado = await service.validarTramite(req.params.id, uid, rol);
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Enviar a aseguradora (Procesar y Resolver del diagrama)
tramitesRouter.post('/:id/enviar-aseguradora', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const rol = req.user?.rol as string;
    const { idAseguradora } = req.body;
    
    if (!idAseguradora) {
      return res.status(400).json({ error: 'idAseguradora es requerido' });
    }
    
    const resultado = await service.enviarAAseguradora(req.params.id, idAseguradora, uid, rol);
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Registrar resultado de aseguradora
tramitesRouter.post('/:id/resultado', verifyToken, requireRole(['gestor', 'admin', 'aseguradora']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const rol = req.user?.rol as string;
    const { aprobado, montoAprobado, observaciones } = req.body;
    
    if (typeof aprobado !== 'boolean') {
      return res.status(400).json({ error: 'aprobado (boolean) es requerido' });
    }
    
    const resultado = await service.registrarResultadoAseguradora(
      req.params.id,
      { aprobado, montoAprobado, observaciones },
      uid,
      rol
    );
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Solicitar correcciones (Gestionar Correcciones del diagrama)
tramitesRouter.post('/:id/correcciones', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const rol = req.user?.rol as string;
    const { descripcion } = req.body;
    
    if (!descripcion) {
      return res.status(400).json({ error: 'descripcion es requerida' });
    }
    
    const resultado = await service.solicitarCorrecciones(req.params.id, descripcion, uid, rol);
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Confirmar pago (Monitorear Pago del diagrama)
tramitesRouter.post('/:id/pago', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const rol = req.user?.rol as string;
    const resultado = await service.confirmarPago(req.params.id, uid, rol);
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoints legacy (mantener compatibilidad, pero redirigen a nuevos métodos)
tramitesRouter.patch('/:id/aprobar', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const rol = req.user?.rol as string;
    const { montoAprobado, observaciones } = req.body;
    const resultado = await service.registrarResultadoAseguradora(
      req.params.id,
      { aprobado: true, montoAprobado, observaciones },
      uid,
      rol
    );
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tramitesRouter.patch('/:id/rechazar', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const rol = req.user?.rol as string;
    const { motivo } = req.body;
    const resultado = await service.registrarResultadoAseguradora(
      req.params.id,
      { aprobado: false, observaciones: motivo },
      uid,
      rol
    );
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

tramitesRouter.patch('/:id/observar', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const rol = req.user?.rol as string;
    const { motivo } = req.body;
    const resultado = await service.solicitarCorrecciones(req.params.id, motivo, uid, rol);
    res.json(resultado);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export { tramitesRouter };
