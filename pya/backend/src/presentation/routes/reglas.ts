import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { ReglasService } from '../../application/reglas/reglas.service';

const reglasRouter = Router();
const service = new ReglasService();

// Listar todas las reglas
reglasRouter.get('/', verifyToken, requireRole(['ADMIN', 'GESTOR']), async (req: RequestWithUser, res: Response) => {
  try {
    const reglas = await service.listar();
    res.json(reglas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener reglas activas
reglasRouter.get('/activas', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const reglas = await service.obtenerActivas();
    res.json(reglas);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener por ID
reglasRouter.get('/:id', verifyToken, requireRole(['ADMIN', 'GESTOR']), async (req: RequestWithUser, res: Response) => {
  try {
    const regla = await service.obtenerPorId(req.params.id);
    if (!regla) {
      return res.status(404).json({ error: 'Regla no encontrada' });
    }
    res.json(regla);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Crear regla
reglasRouter.post('/', verifyToken, requireRole(['ADMIN']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const regla = await service.crear(req.body, uid);
    res.status(201).json(regla);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar regla
reglasRouter.put('/:id', verifyToken, requireRole(['ADMIN']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const regla = await service.actualizar(req.params.id, req.body, uid);
    res.json(regla);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Activar regla
reglasRouter.patch('/:id/activar', verifyToken, requireRole(['ADMIN']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const regla = await service.activar(req.params.id, uid);
    res.json(regla);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Desactivar regla
reglasRouter.patch('/:id/desactivar', verifyToken, requireRole(['ADMIN']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const regla = await service.desactivar(req.params.id, uid);
    res.json(regla);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export { reglasRouter };
// Eliminar regla
reglasRouter.delete('/:id', verifyToken, requireRole(['ADMIN']), async (req: RequestWithUser, res: Response) => {
  try {
    await service.eliminar(req.params.id, req.user?.uid as string);
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});
