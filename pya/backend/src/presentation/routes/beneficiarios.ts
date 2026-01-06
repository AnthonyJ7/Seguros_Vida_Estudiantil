import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { BeneficiariosRepository } from '../../infrastructure/repositories/beneficiarios.repo';

const beneficiariosRouter = Router();
const repo = new BeneficiariosRepository();

// Obtener beneficiarios de un trámite
beneficiariosRouter.get('/tramite/:tramiteId', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const beneficiarios = await repo.obtenerPorTramite(req.params.tramiteId);
    res.json(beneficiarios);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener por ID
beneficiariosRouter.get('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const beneficiario = await repo.obtenerPorId(req.params.id);
    if (!beneficiario) {
      return res.status(404).json({ error: 'Beneficiario no encontrado' });
    }
    res.json(beneficiario);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Crear beneficiario
beneficiariosRouter.post('/', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const beneficiario = await repo.crear(req.body);
    res.status(201).json(beneficiario);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar beneficiario
beneficiariosRouter.put('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const beneficiario = await repo.actualizar(req.params.id, req.body);
    res.json(beneficiario);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar beneficiario
beneficiariosRouter.delete('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    await repo.eliminar(req.params.id);
    res.json({ mensaje: 'Beneficiario eliminado correctamente' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export { beneficiariosRouter };
