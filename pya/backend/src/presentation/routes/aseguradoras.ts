import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { AseguradorasRepository } from '../../infrastructure/repositories/aseguradoras.repo';

const aseguradorasRouter = Router();
const repo = new AseguradorasRepository();

// Listar todas las aseguradoras
aseguradorasRouter.get('/', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const aseguradoras = await repo.listarTodos();
    res.json(aseguradoras);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener por ID
aseguradorasRouter.get('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const aseguradora = await repo.obtenerPorId(req.params.id);
    if (!aseguradora) {
      return res.status(404).json({ error: 'Aseguradora no encontrada' });
    }
    res.json(aseguradora);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Crear aseguradora
aseguradorasRouter.post('/', verifyToken, requireRole(['admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const aseguradora = await repo.crear(req.body);
    res.status(201).json(aseguradora);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar aseguradora
aseguradorasRouter.put('/:id', verifyToken, requireRole(['admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const aseguradora = await repo.actualizar(req.params.id, req.body);
    res.json(aseguradora);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar aseguradora
aseguradorasRouter.delete('/:id', verifyToken, requireRole(['admin']), async (req: RequestWithUser, res: Response) => {
  try {
    await repo.eliminar(req.params.id);
    res.json({ mensaje: 'Aseguradora eliminada correctamente' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export { aseguradorasRouter };
