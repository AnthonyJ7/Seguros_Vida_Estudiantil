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

interface CrearTramiteDTO {
  cedulaEstudiante: string;
  tipoTramite: TipoTramite;
  motivo: string;
  descripcion?: string;
  beneficiario?: Omit<Beneficiario, 'idBeneficiario'>;
  medioNotificacionPreferido?: string;
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

  async crearTramite(dto: CrearTramiteDTO, creadoPor: string, rol: string) {
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
      }
    };

    // 4. Agregar beneficiario si se proporciona
    if (dto.beneficiario) {
      tramite.beneficiario = {
        ...dto.beneficiario,
        idBeneficiario: `BEN-${Date.now()}`
      };
    }

    const tramiteId = await this.repo.crear(tramite);

    // 5. Generar notificación inicial
    const idNotificacion = await this.notificacionesService.notificarInicio(
      tramiteId,
      codigoUnico,
      estudiante.cedula // O email si lo tenemos
    );

    await this.repo.actualizar(tramiteId, { notificacionInicial: idNotificacion });

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

    await this.notificacionesService.notificarCambioEstadoTramite(
      id,
      tramite.codigoUnico,
      nuevoEstado,
      tramite.estudiante.cedula
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

    const respuestaAseguradora = {
      fecha: new Date(),
      ...resultado
    };

    let nuevoEstado: EstadoCaso;
    if (resultado.aprobado) {
      nuevoEstado = EstadoCaso.APROBADO;
    } else if (resultado.observaciones) {
      nuevoEstado = EstadoCaso.CON_OBSERVACIONES;
    } else {
      nuevoEstado = EstadoCaso.RECHAZADO;
    }

    await this.repo.cambiarEstado(id, nuevoEstado, actorUid, rol, resultado.observaciones);
    
    await this.repo.actualizar(id, { 
      respuestaAseguradora,
      montoAprobado: resultado.montoAprobado,
      fechaCierre: nuevoEstado === EstadoCaso.RECHAZADO ? new Date() : undefined
    });

    await this.auditoriaRepo.registrar({
      accion: 'RESULTADO_ASEGURADORA',
      usuario: actorUid,
      rol,
      tramiteId: id,
      entidad: 'tramites',
      estadoNuevo: { estadoCaso: nuevoEstado, respuestaAseguradora },
      detalles: `Resultado: ${nuevoEstado}`
    });

    await this.notificacionesService.notificarCambioEstadoTramite(
      id,
      tramite.codigoUnico,
      nuevoEstado,
      tramite.estudiante.cedula
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

    await this.notificacionesService.notificarCambioEstadoTramite(
      id,
      tramite.codigoUnico,
      EstadoCaso.CORRECCIONES_PENDIENTES,
      tramite.estudiante.cedula
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

    await this.notificacionesService.notificarCambioEstadoTramite(
      id,
      tramite.codigoUnico,
      EstadoCaso.CERRADO,
      tramite.estudiante.cedula
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
    const rolUpper = (params.rol || '').toUpperCase();
    if (rolUpper === 'GESTOR' || rolUpper === 'ADMIN') {
      // GESTOR y ADMIN ven todos
      return this.repo.listarTodos();
    }
    // CLIENTE solo ve sus propios (por uid creador)
    return this.repo.listarPorCreador(params.uid);
  }

  async obtenerPorId(id: string) {
    return this.repo.obtenerPorId(id);
  }

  async listarPorEstado(estado: EstadoCaso) {
    return this.repo.listarPorEstado(estado);
  }
}
