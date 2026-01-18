// Servicio de Trámites con lógica de negocio completa
import { Tramite, EstadoCaso, TipoTramite, cambiarEstado, validarTransicion } from '../../domain/tramite';
import { TramitesRepository } from '../../infrastructure/repositories/tramites.repo';
import { EstudiantesService } from '../estudiantes/estudiantes.service';
import { ReglasService } from '../reglas/reglas.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { TipoNotificacion } from '../../domain/notificacion';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repo';
import { BeneficiariosRepository } from '../../infrastructure/repositories/beneficiarios.repo';
import { DocumentosRepository } from '../../infrastructure/repositories/documentos.repo';
import { Beneficiario } from '../../domain/beneficiario';
import { Documento } from '../../domain/documento';

// Función auxiliar para limpiar valores undefined de objetos
function limpiarUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const limpio: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      limpio[key] = obj[key];
    }
  }
  return limpio;
}

interface CrearTramiteDTO {
  cedulaEstudiante: string;
  tipoTramite: TipoTramite;
  motivo: string;
  descripcion?: string;
  beneficiario?: Omit<Beneficiario, 'idBeneficiario'>;
  medioNotificacionPreferido?: string;
  // Datos financieros opcionales para calcular copago
  copagoCategoria?: 'personal' | 'grupo_especial' | 'licencia_sin_sueldo' | 'estudiante';
  montoFacturaReferencial?: number;
}

export class TramiteService {
  private repo = new TramitesRepository();
  private estudiantesService = new EstudiantesService();
  private reglasService = new ReglasService();
  private notificacionesService = new NotificacionesService();
  private auditoriaRepo = new AuditoriaRepository();
  private beneficiariosRepo = new BeneficiariosRepository();
  private documentosRepo = new DocumentosRepository();
  private gestorFallbackUid = process.env.GESTOR_UID_DEFAULT || 'UAGpe4hb4gXKsVEK97fn3MFQKK53';

  private calcularCopago(
    categoria: CrearTramiteDTO['copagoCategoria'] | undefined,
    montoFacturaReferencial?: number
  ): { categoria: string; porcentaje: number; baseCalculo?: number; valorEstimado?: number; fuente: 'TDR' | 'manual' } {
    const mapa: Record<string, number> = {
      personal: 0.30,
      grupo_especial: 0.65,
      licencia_sin_sueldo: 1,
      estudiante: 0
    };
    const key = (categoria || 'estudiante').toLowerCase();
    const porcentaje = mapa[key] ?? 0;
    const baseCalculo = typeof montoFacturaReferencial === 'number' && montoFacturaReferencial > 0
      ? Number(montoFacturaReferencial)
      : undefined;
    const valorEstimado = baseCalculo !== undefined ? Number((baseCalculo * porcentaje).toFixed(2)) : undefined;
    return {
      categoria: key,
      porcentaje,
      baseCalculo,
      valorEstimado,
      fuente: 'TDR'
    };
  }

  async crearTramite(dto: CrearTramiteDTO, creadoPor: string, rol: string) {
    if (!dto?.cedulaEstudiante?.trim()) throw new Error('cedulaEstudiante es requerida');
    if (!dto?.tipoTramite) throw new Error('tipoTramite es requerido');
    if (!dto?.motivo?.trim()) throw new Error('motivo es requerido');

    // 1. Verificar elegibilidad del estudiante (según diagrama de secuencia)
    const { elegible, razon, estudiante } = await this.estudiantesService.verificarElegibilidad(dto.cedulaEstudiante);
    
    if (!elegible || !estudiante) {
      throw new Error(razon || 'Estudiante no elegible');
    }

    // 2. Consultar y aplicar reglas activas
    const tramiteTemp: Partial<Tramite> = {
      tipoTramite: dto.tipoTramite,
      motivo: dto.motivo,
      estudiante: {
        cedula: estudiante.cedula,
        nombreCompleto: estudiante.nombreCompleto,
        periodoAcademico: estudiante.periodoAcademico,
        estadoAcademico: estudiante.estadoAcademico,
        estadoCobertura: estudiante.estadoCobertura,
        idEstudiante: estudiante.idEstudiante
      }
    };

    const { cumple, errores } = await this.reglasService.aplicarReglasATramite(tramiteTemp as Tramite);
    
    if (!cumple) {
      throw new Error(`No cumple condiciones del seguro: ${errores.join(', ')}`);
    }

    // 3. Crear trámite
    const codigoUnico = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // 3.1. Asignar automáticamente la primera aseguradora disponible
    let aseguradoraAsignada = null;
    try {
      const db = require('../../config/firebase').firestore;
      const aseguradorasSnapshot = await db.collection('aseguradoras').limit(1).get();
      if (!aseguradorasSnapshot.empty) {
        const primeraAseg = aseguradorasSnapshot.docs[0].data();
        aseguradoraAsignada = {
          idAseguradora: aseguradorasSnapshot.docs[0].id,
          nombre: primeraAseg.nombre || 'Aseguradora Principal',
          correoContacto: primeraAseg.correoContacto || primeraAseg.email || ''
        };
        console.log('[TramiteService] Aseguradora asignada:', aseguradoraAsignada);
      } else {
        console.warn('[TramiteService] No hay aseguradoras disponibles en Firestore');
      }
    } catch (asegErr) {
      console.error('[TramiteService] Error asignando aseguradora:', asegErr);
    }
    
    const tramite: Omit<Tramite, 'id'> = {
      codigoUnico,
      idTramite: codigoUnico,
      estadoCaso: EstadoCaso.REGISTRADO,
      tipoTramite: dto.tipoTramite,
      fechaRegistro: new Date(),
      estudiante: tramiteTemp.estudiante!,
      motivo: dto.motivo,
      descripcion: dto.descripcion,
      documentos: [],
      aseguradora: aseguradoraAsignada || undefined,
      historial: [{
        estadoAnterior: EstadoCaso.BORRADOR,
        estadoNuevo: EstadoCaso.REGISTRADO,
        fecha: new Date(),
        actor: creadoPor,
        rol,
        nota: 'Trámite registrado'
      }],
      creadoPor,
      actorUltimo: creadoPor,
      rolUltimo: rol,
      medioNotificacionPreferido: dto.medioNotificacionPreferido || 'email',
      validaciones: {
        reglasNegocio: { valida: true }
      },
      copago: this.calcularCopago(dto.copagoCategoria, dto.montoFacturaReferencial)
    };

    // 4. Agregar beneficiario si se proporciona
    if (dto.beneficiario) {
      tramite.beneficiario = {
        ...dto.beneficiario,
        idBeneficiario: `BEN-${Date.now()}`
      };
    }

    const tramiteId = await this.repo.crear(tramite);

    // 5. Generar notificación inicial al estudiante (usando UID del creador)
    const idNotificacion = await this.notificacionesService.notificarInicio(
      tramiteId,
      codigoUnico,
      creadoPor // UID del usuario que creó el trámite
    );

    await this.repo.actualizar(tramiteId, { notificacionInicial: idNotificacion });

    // 5.1. Notificar al gestor sobre el nuevo trámite
    try {
      await this.notificacionesService.crear({
        tipo: TipoNotificacion.EMAIL,
        destinatario: this.gestorFallbackUid,
        mensaje: `Nuevo trámite ${codigoUnico} creado por ${estudiante.nombreCompleto}. Estado: REGISTRADO. Requiere validación.`,
        tramiteId,
        leida: false
      });
      console.log(`[TramiteService] Notificación enviada al gestor (UID: ${this.gestorFallbackUid})`);
    } catch (notifError) {
      console.error('[TramiteService] Error enviando notificación al gestor:', notifError);
      // No lanzamos el error para no bloquear la creación del trámite
    }

    // 6. Registrar en auditoría
    await this.auditoriaRepo.registrar({
      accion: 'REGISTRAR_TRAMITE',
      usuario: creadoPor,
      rol,
      tramiteId,
      entidad: 'tramites',
      estadoNuevo: tramite,
      detalles: `Trámite ${codigoUnico} registrado`
    });

    return { id: tramiteId, ...tramite };
  }

  async obtenerDashboardCliente(uid: string) {
    const tramites = await this.repo.listarPorCreador(uid);
    const tramiteIds = tramites.map(t => t.id || t.idTramite).filter(Boolean);

    // Obtener documentos por cada trámite en paralelo
    const documentosPorTramite = await Promise.all(
      tramiteIds.map(async (id) => ({ id, docs: await this.documentosRepo.obtenerPorTramite(id) }))
    );
    const documentos = documentosPorTramite.flatMap(d => d.docs);

    // Notificaciones recientes para el cliente
    const notificaciones = await this.notificacionesService.obtenerPorDestinatario(uid, 50).catch(() => []);

    // Derivar datos del estudiante embebidos en el último trámite
    const estudiante = tramites[0]?.estudiante || null;
    const estadoCobertura = estudiante?.estadoCobertura || 'desconocido';

    // Resumen por estado para métricas rápidas en UI
    const resumenEstados = tramites.reduce<Record<string, number>>((acc, t) => {
      const key = (t.estadoCaso || 'desconocido').toString();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      estudiante,
      tramites,
      documentos,
      notificaciones,
      estadoCobertura,
      resumenEstados
    };
  }

  async validarTramite(id: string, actorUid: string, rol: string) {
    const tramite = await this.repo.obtenerPorId(id);
    if (!tramite) throw new Error('Trámite no encontrado');

    // Validar vigencia de matrícula (stub)
    const vigenciaMatricula = { valida: true, mensaje: 'Matrícula vigente' };
    
    // Validar requisitos del siniestro (stub - se debe extender según tipo)
    const requisitosSiniestro = { valida: true, mensaje: 'Requisitos cumplidos' };

    const validaciones = {
      vigenciaMatricula,
      requisitosSiniestro,
      reglasNegocio: tramite.validaciones?.reglasNegocio || { valida: true }
    };

    const todasValidas = vigenciaMatricula.valida && requisitosSiniestro.valida;
    const nuevoEstado = todasValidas ? EstadoCaso.VALIDADO : EstadoCaso.OBSERVADO;

    await this.repo.cambiarEstado(id, nuevoEstado, actorUid, rol, 
      todasValidas ? 'Validación exitosa' : 'Trámite observado por validaciones pendientes'
    );

    await this.repo.actualizar(id, { validaciones });

    await this.auditoriaRepo.registrar({
      accion: 'VALIDAR_TRAMITE',
      usuario: actorUid,
      rol,
      tramiteId: id,
      entidad: 'tramites',
      estadoNuevo: { validaciones, estadoCaso: nuevoEstado },
      detalles: `Trámite validado: ${nuevoEstado}`
    });

    // Notificar al creador del trámite usando su UID
    await this.notificacionesService.notificarCambioEstadoTramite(
      id,
      tramite.codigoUnico,
      nuevoEstado,
      tramite.creadoPor // UID del creador
    );

    return { validaciones, estado: nuevoEstado };
  }

  async enviarAAseguradora(id: string, idAseguradora: number, actorUid: string, rol: string) {
    const tramite = await this.repo.obtenerPorId(id);
    if (!tramite) throw new Error('Trámite no encontrado');

    if (tramite.estadoCaso !== EstadoCaso.VALIDADO) {
      throw new Error('El trámite debe estar validado antes de enviarlo a la aseguradora');
    }

    // Mock de aseguradora
    const aseguradora = {
      idAseguradora,
      nombre: 'Aseguradora Example',
      correoContacto: 'contacto@aseguradora.com'
    };

    await this.repo.cambiarEstado(id, EstadoCaso.ENVIADO_ASEGURADORA, actorUid, rol, 
      `Enviado a ${aseguradora.nombre}`
    );

    await this.repo.actualizar(id, { aseguradora });

    await this.auditoriaRepo.registrar({
      accion: 'ENVIAR_ASEGURADORA',
      usuario: actorUid,
      rol,
      tramiteId: id,
      entidad: 'tramites',
      estadoNuevo: { estadoCaso: EstadoCaso.ENVIADO_ASEGURADORA, aseguradora },
      detalles: `Enviado a aseguradora ${aseguradora.nombre}`
    });

    return { aseguradora, estado: EstadoCaso.ENVIADO_ASEGURADORA };
  }

  async registrarResultadoAseguradora(
    id: string, 
    resultado: { aprobado: boolean; montoAprobado?: number; observaciones?: string },
    actorUid: string,
    rol: string
  ) {
    const tramite = await this.repo.obtenerPorId(id);
    if (!tramite) throw new Error('Trámite no encontrado');

    // Limpiar undefined del resultado antes de crear respuestaAseguradora
    const respuestaAseguradora = limpiarUndefined({
      fecha: new Date(),
      aprobado: resultado.aprobado,
      montoAprobado: resultado.montoAprobado,
      observaciones: resultado.observaciones
    });

    let nuevoEstado: EstadoCaso;
    if (resultado.aprobado) {
      nuevoEstado = EstadoCaso.APROBADO;
    } else if (resultado.observaciones) {
      nuevoEstado = EstadoCaso.CON_OBSERVACIONES;
    } else {
      nuevoEstado = EstadoCaso.RECHAZADO;
    }

    await this.repo.cambiarEstado(id, nuevoEstado, actorUid, rol, resultado.observaciones);
    
    // Limpiar undefined de los datos de actualización
    const datosActualizacion: any = {
      respuestaAseguradora,
      montoAprobado: resultado.montoAprobado
    };
    
    if (nuevoEstado === EstadoCaso.RECHAZADO) {
      datosActualizacion.fechaCierre = new Date();
    }
    
    await this.repo.actualizar(id, limpiarUndefined(datosActualizacion));

    await this.auditoriaRepo.registrar({
      accion: 'RESULTADO_ASEGURADORA',
      usuario: actorUid,
      rol,
      tramiteId: id,
      entidad: 'tramites',
      estadoNuevo: { estadoCaso: nuevoEstado, respuestaAseguradora },
      detalles: `Resultado: ${nuevoEstado}`
    });

    // Notificar al creador del trámite usando su UID
    await this.notificacionesService.notificarCambioEstadoTramite(
      id,
      tramite.codigoUnico,
      nuevoEstado,
      tramite.creadoPor
    );

    // Notificar también al gestor que llevó el caso (o al gestor por defecto)
    const destinatarioGestor = (tramite.rolUltimo === 'GESTOR' && tramite.actorUltimo) 
      ? tramite.actorUltimo 
      : this.gestorFallbackUid;

    if (destinatarioGestor) {
      await this.notificacionesService.notificarCambioEstadoTramite(
        id,
        tramite.codigoUnico,
        nuevoEstado,
        destinatarioGestor,
        TipoNotificacion.SISTEMA
      );
    }

    return { estado: nuevoEstado, respuestaAseguradora };
  }

  async solicitarCorrecciones(id: string, descripcion: string, actorUid: string, rol: string) {
    const tramite = await this.repo.obtenerPorId(id);
    if (!tramite) throw new Error('Trámite no encontrado');

    const correccion = {
      id: `CORR-${Date.now()}`,
      solicitudFecha: new Date(),
      solicitadoPor: actorUid,
      descripcion,
      resuelta: false
    };

    const correcciones = [...(tramite.correcciones || []), correccion];
    
    await this.repo.cambiarEstado(id, EstadoCaso.CORRECCIONES_PENDIENTES, actorUid, rol, descripcion);
    await this.repo.actualizar(id, { correcciones });

    await this.auditoriaRepo.registrar({
      accion: 'SOLICITAR_CORRECCIONES',
      usuario: actorUid,
      rol,
      tramiteId: id,
      entidad: 'tramites',
      estadoNuevo: { correcciones },
      detalles: `Corrección solicitada: ${descripcion}`
    });

    // Notificar al creador del trámite usando su UID
    await this.notificacionesService.notificarCambioEstadoTramite(
      id,
      tramite.codigoUnico,
      EstadoCaso.CORRECCIONES_PENDIENTES,
      tramite.creadoPor
    );

    return { correccion };
  }

  async confirmarPago(id: string, actorUid: string, rol: string) {
    const tramite = await this.repo.obtenerPorId(id);
    if (!tramite) throw new Error('Trámite no encontrado');

    if (tramite.estadoCaso !== EstadoCaso.PAGO_PENDIENTE) {
      // Si está aprobado, cambiar a pago pendiente primero
      if (tramite.estadoCaso === EstadoCaso.APROBADO) {
        await this.repo.cambiarEstado(id, EstadoCaso.PAGO_PENDIENTE, actorUid, rol);
      } else {
        throw new Error('El trámite debe estar en estado de pago pendiente');
      }
    }

    await this.repo.cambiarEstado(id, EstadoCaso.PAGADO, actorUid, rol, 'Pago confirmado');
    await this.repo.actualizar(id, { 
      estadoPago: 'confirmado',
      fechaPago: new Date()
    });

    // Cerrar trámite
    await this.repo.cambiarEstado(id, EstadoCaso.CERRADO, actorUid, rol, 'Trámite completado');
    await this.repo.actualizar(id, { fechaCierre: new Date() });

    await this.auditoriaRepo.registrar({
      accion: 'CONFIRMAR_PAGO',
      usuario: actorUid,
      rol,
      tramiteId: id,
      entidad: 'tramites',
      estadoNuevo: { estadoPago: 'confirmado', estadoCaso: EstadoCaso.CERRADO },
      detalles: 'Pago confirmado y trámite cerrado'
    });

    // Notificar al creador del trámite usando su UID
    await this.notificacionesService.notificarCambioEstadoTramite(
      id,
      tramite.codigoUnico,
      EstadoCaso.CERRADO,
      tramite.creadoPor
    );

    return { estado: EstadoCaso.CERRADO };
  }

  async obtenerHistorial(id: string) {
    const tramite = await this.repo.obtenerPorId(id);
    if (!tramite) throw new Error('Trámite no encontrado');

    const auditoria = await this.auditoriaRepo.obtenerPorTramite(id);
    
    return {
      historial: tramite.historial,
      auditoria
    };
  }

  async listarTramites(params: { rol?: string; uid: string; estudiante?: string }) {
    try {
      const rolUpper = (params.rol || '').toUpperCase();
      if (rolUpper === 'GESTOR' || rolUpper === 'ADMIN') {
        // GESTOR y ADMIN ven todos
        return this.repo.listarTodos();
      }
      // CLIENTE solo ve sus propios (por uid creador)
      console.log('[TramiteService] Listando tramites para uid:', params.uid);
      const tramites = await this.repo.listarPorCreador(params.uid);
      console.log('[TramiteService] Tramites encontrados:', tramites.length);
      return tramites;
    } catch (error: any) {
      console.error('[TramiteService] Error listando tramites:', error.message);
      throw new Error('Error al listar tramites: ' + error.message);
    }
  }

  async obtenerPorId(id: string) {
    return this.repo.obtenerPorId(id);
  }

  async listarPorEstado(estado: EstadoCaso) {
    return this.repo.listarPorEstado(estado);
  }
}
