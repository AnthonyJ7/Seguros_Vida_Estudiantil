import { Router, Response } from 'express';
import { verifyToken, RequestWithUser } from '../middlewares/auth';
import { requireRole } from '../middlewares/roles';
import { EstudiantesService } from '../../application/estudiantes/estudiantes.service';

const estudiantesRouter = Router();
const service = new EstudiantesService();

// Verificar elegibilidad (caso de uso: Verificar Elegibilidad)
estudiantesRouter.post('/verificar-elegibilidad', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const { cedula } = req.body;
    if (!cedula) {
      return res.status(400).json({ error: 'Cédula es requerida' });
    }
    const resultado = await service.verificarElegibilidad(cedula);
    res.json(resultado);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener por cédula
estudiantesRouter.get('/cedula/:cedula', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const estudiante = await service.obtenerPorCedula(req.params.cedula);
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json(estudiante);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener por ID
estudiantesRouter.get('/:id', verifyToken, async (req: RequestWithUser, res: Response) => {
  try {
    const estudiante = await service.obtenerPorId(req.params.id);
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.json(estudiante);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar estudiantes
estudiantesRouter.get('/', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const estudiantes = await service.listar();
    res.json(estudiantes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Crear estudiante
estudiantesRouter.post('/', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const estudiante = await service.crear(req.body, uid);
    res.status(201).json(estudiante);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar estado académico
estudiantesRouter.patch('/:id/estado', verifyToken, requireRole(['gestor', 'admin']), async (req: RequestWithUser, res: Response) => {
  try {
    const uid = req.user?.uid as string;
    const { estadoAcademico } = req.body;
    
    if (!estadoAcademico) {
      return res.status(400).json({ error: 'estadoAcademico es requerido' });
    }
    
    const estudiante = await service.actualizarEstadoAcademico(req.params.id, estadoAcademico, uid);
    res.json(estudiante);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export { estudiantesRouter };
