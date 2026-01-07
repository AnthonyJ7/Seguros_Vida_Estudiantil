"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TramiteService = void 0;
// Servicio de Trámites con lógica de negocio completa
const tramite_1 = require("../../domain/tramite");
const tramites_repo_1 = require("../../infrastructure/repositories/tramites.repo");
const estudiantes_service_1 = require("../estudiantes/estudiantes.service");
const reglas_service_1 = require("../reglas/reglas.service");
const notificaciones_service_1 = require("../notificaciones/notificaciones.service");
const auditoria_repo_1 = require("../../infrastructure/repositories/auditoria.repo");
const beneficiarios_repo_1 = require("../../infrastructure/repositories/beneficiarios.repo");
const documentos_repo_1 = require("../../infrastructure/repositories/documentos.repo");
class TramiteService {
    constructor() {
        this.repo = new tramites_repo_1.TramitesRepository();
        this.estudiantesService = new estudiantes_service_1.EstudiantesService();
        this.reglasService = new reglas_service_1.ReglasService();
        this.notificacionesService = new notificaciones_service_1.NotificacionesService();
        this.auditoriaRepo = new auditoria_repo_1.AuditoriaRepository();
        this.beneficiariosRepo = new beneficiarios_repo_1.BeneficiariosRepository();
        this.documentosRepo = new documentos_repo_1.DocumentosRepository();
    }
    async crearTramite(dto, creadoPor, rol) {
        // 1. Verificar elegibilidad del estudiante (según diagrama de secuencia)
        const { elegible, razon, estudiante } = await this.estudiantesService.verificarElegibilidad(dto.cedulaEstudiante);
        if (!elegible || !estudiante) {
            throw new Error(razon || 'Estudiante no elegible');
        }
        // 2. Consultar y aplicar reglas activas
        const tramiteTemp = {
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
        const { cumple, errores } = await this.reglasService.aplicarReglasATramite(tramiteTemp);
        if (!cumple) {
            throw new Error(`No cumple condiciones del seguro: ${errores.join(', ')}`);
        }
        // 3. Crear trámite
        const codigoUnico = `TR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const tramite = {
            codigoUnico,
            idTramite: codigoUnico,
            estadoCaso: tramite_1.EstadoCaso.REGISTRADO,
            tipoTramite: dto.tipoTramite,
            fechaRegistro: new Date(),
            estudiante: tramiteTemp.estudiante,
            motivo: dto.motivo,
            descripcion: dto.descripcion,
            documentos: [],
            historial: [{
                    estadoAnterior: tramite_1.EstadoCaso.BORRADOR,
                    estadoNuevo: tramite_1.EstadoCaso.REGISTRADO,
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
        const idNotificacion = await this.notificacionesService.notificarInicio(tramiteId, codigoUnico, estudiante.cedula // O email si lo tenemos
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
    async validarTramite(id, actorUid, rol) {
        const tramite = await this.repo.obtenerPorId(id);
        if (!tramite)
            throw new Error('Trámite no encontrado');
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
        const nuevoEstado = todasValidas ? tramite_1.EstadoCaso.VALIDADO : tramite_1.EstadoCaso.OBSERVADO;
        await this.repo.cambiarEstado(id, nuevoEstado, actorUid, rol, todasValidas ? 'Validación exitosa' : 'Trámite observado por validaciones pendientes');
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
        await this.notificacionesService.notificarCambioEstadoTramite(id, tramite.codigoUnico, nuevoEstado, tramite.estudiante.cedula);
        return { validaciones, estado: nuevoEstado };
    }
    async enviarAAseguradora(id, idAseguradora, actorUid, rol) {
        const tramite = await this.repo.obtenerPorId(id);
        if (!tramite)
            throw new Error('Trámite no encontrado');
        if (tramite.estadoCaso !== tramite_1.EstadoCaso.VALIDADO) {
            throw new Error('El trámite debe estar validado antes de enviarlo a la aseguradora');
        }
        // Mock de aseguradora
        const aseguradora = {
            idAseguradora,
            nombre: 'Aseguradora Example',
            correoContacto: 'contacto@aseguradora.com'
        };
        await this.repo.cambiarEstado(id, tramite_1.EstadoCaso.ENVIADO_ASEGURADORA, actorUid, rol, `Enviado a ${aseguradora.nombre}`);
        await this.repo.actualizar(id, { aseguradora });
        await this.auditoriaRepo.registrar({
            accion: 'ENVIAR_ASEGURADORA',
            usuario: actorUid,
            rol,
            tramiteId: id,
            entidad: 'tramites',
            estadoNuevo: { estadoCaso: tramite_1.EstadoCaso.ENVIADO_ASEGURADORA, aseguradora },
            detalles: `Enviado a aseguradora ${aseguradora.nombre}`
        });
        return { aseguradora, estado: tramite_1.EstadoCaso.ENVIADO_ASEGURADORA };
    }
    async registrarResultadoAseguradora(id, resultado, actorUid, rol) {
        const tramite = await this.repo.obtenerPorId(id);
        if (!tramite)
            throw new Error('Trámite no encontrado');
        const respuestaAseguradora = {
            fecha: new Date(),
            ...resultado
        };
        let nuevoEstado;
        if (resultado.aprobado) {
            nuevoEstado = tramite_1.EstadoCaso.APROBADO;
        }
        else if (resultado.observaciones) {
            nuevoEstado = tramite_1.EstadoCaso.CON_OBSERVACIONES;
        }
        else {
            nuevoEstado = tramite_1.EstadoCaso.RECHAZADO;
        }
        await this.repo.cambiarEstado(id, nuevoEstado, actorUid, rol, resultado.observaciones);
        await this.repo.actualizar(id, {
            respuestaAseguradora,
            montoAprobado: resultado.montoAprobado,
            fechaCierre: nuevoEstado === tramite_1.EstadoCaso.RECHAZADO ? new Date() : undefined
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
        await this.notificacionesService.notificarCambioEstadoTramite(id, tramite.codigoUnico, nuevoEstado, tramite.estudiante.cedula);
        return { estado: nuevoEstado, respuestaAseguradora };
    }
    async solicitarCorrecciones(id, descripcion, actorUid, rol) {
        const tramite = await this.repo.obtenerPorId(id);
        if (!tramite)
            throw new Error('Trámite no encontrado');
        const correccion = {
            id: `CORR-${Date.now()}`,
            solicitudFecha: new Date(),
            solicitadoPor: actorUid,
            descripcion,
            resuelta: false
        };
        const correcciones = [...(tramite.correcciones || []), correccion];
        await this.repo.cambiarEstado(id, tramite_1.EstadoCaso.CORRECCIONES_PENDIENTES, actorUid, rol, descripcion);
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
        await this.notificacionesService.notificarCambioEstadoTramite(id, tramite.codigoUnico, tramite_1.EstadoCaso.CORRECCIONES_PENDIENTES, tramite.estudiante.cedula);
        return { correccion };
    }
    async confirmarPago(id, actorUid, rol) {
        const tramite = await this.repo.obtenerPorId(id);
        if (!tramite)
            throw new Error('Trámite no encontrado');
        if (tramite.estadoCaso !== tramite_1.EstadoCaso.PAGO_PENDIENTE) {
            // Si está aprobado, cambiar a pago pendiente primero
            if (tramite.estadoCaso === tramite_1.EstadoCaso.APROBADO) {
                await this.repo.cambiarEstado(id, tramite_1.EstadoCaso.PAGO_PENDIENTE, actorUid, rol);
            }
            else {
                throw new Error('El trámite debe estar en estado de pago pendiente');
            }
        }
        await this.repo.cambiarEstado(id, tramite_1.EstadoCaso.PAGADO, actorUid, rol, 'Pago confirmado');
        await this.repo.actualizar(id, {
            estadoPago: 'confirmado',
            fechaPago: new Date()
        });
        // Cerrar trámite
        await this.repo.cambiarEstado(id, tramite_1.EstadoCaso.CERRADO, actorUid, rol, 'Trámite completado');
        await this.repo.actualizar(id, { fechaCierre: new Date() });
        await this.auditoriaRepo.registrar({
            accion: 'CONFIRMAR_PAGO',
            usuario: actorUid,
            rol,
            tramiteId: id,
            entidad: 'tramites',
            estadoNuevo: { estadoPago: 'confirmado', estadoCaso: tramite_1.EstadoCaso.CERRADO },
            detalles: 'Pago confirmado y trámite cerrado'
        });
        await this.notificacionesService.notificarCambioEstadoTramite(id, tramite.codigoUnico, tramite_1.EstadoCaso.CERRADO, tramite.estudiante.cedula);
        return { estado: tramite_1.EstadoCaso.CERRADO };
    }
    async obtenerHistorial(id) {
        const tramite = await this.repo.obtenerPorId(id);
        if (!tramite)
            throw new Error('Trámite no encontrado');
        const auditoria = await this.auditoriaRepo.obtenerPorTramite(id);
        return {
            historial: tramite.historial,
            auditoria
        };
    }
    async listarTramites(params) {
        if (params.rol === 'gestor' || params.rol === 'admin') {
            return this.repo.listarTodos();
        }
        return this.repo.listarPorCreador(params.uid);
    }
    async obtenerPorId(id) {
        return this.repo.obtenerPorId(id);
    }
    async listarPorEstado(estado) {
        return this.repo.listarPorEstado(estado);
    }
}
exports.TramiteService = TramiteService;
