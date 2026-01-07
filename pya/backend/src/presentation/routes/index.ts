import { Router } from 'express';
import { tramitesRouter } from './tramites';
import { estudiantesRouter } from './estudiantes';
import { beneficiariosRouter } from './beneficiarios';
import { documentosRouter } from './documentos';
import { notificacionesRouter } from './notificaciones';
import { reglasRouter } from './reglas';
import { auditoriaRouter } from './auditoria';
import { aseguradorasRouter } from './aseguradoras';

const router = Router();

// Montar todas las rutas del sistema
router.use('/tramites', tramitesRouter);
router.use('/estudiantes', estudiantesRouter);
router.use('/beneficiarios', beneficiariosRouter);
router.use('/documentos', documentosRouter);
router.use('/notificaciones', notificacionesRouter);
router.use('/reglas', reglasRouter);
router.use('/auditoria', auditoriaRouter);
router.use('/aseguradoras', aseguradorasRouter);

export { router };
