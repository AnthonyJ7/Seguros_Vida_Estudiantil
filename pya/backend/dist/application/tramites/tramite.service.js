"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TramiteService = void 0;
// Servicio de Trámites con lógica de negocio completa
const tramite_1 = require("../../domain/tramite");
const tramites_repo_1 = require("../../infrastructure/repositories/tramites.repo");
const estudiantes_service_1 = require("../estudiantes/estudiantes.service");
const reglas_service_1 = require("../reglas/reglas.service");
const notificaciones_service_1 = require("../notificaciones/notificaciones.service");
const notificacion_1 = require("../../domain/notificacion");
const auditoria_repo_1 = require("../../infrastructure/repositories/auditoria.repo");
const beneficiarios_repo_1 = require("../../infrastructure/repositories/beneficiarios.repo");
const documentos_repo_1 = require("../../infrastructure/repositories/documentos.repo");
// Función auxiliar para limpiar valores undefined de objetos
function limpiarUndefined(obj) {
    const limpio = {};
    for (const key in obj) {
        if (obj[key] !== undefined) {
            limpio[key] = obj[key];
        }
    }
    return limpio;
}
class TramiteService {
    constructor() {
        this.repo = new tramites_repo_1.TramitesRepository();
        this.estudiantesService = new estudiantes_service_1.EstudiantesService();
        this.reglasService = new reglas_service_1.ReglasService();
        this.notificacionesService = new notificaciones_service_1.NotificacionesService();
        this.auditoriaRepo = new auditoria_repo_1.AuditoriaRepository();
        this.beneficiariosRepo = new beneficiarios_repo_1.BeneficiariosRepository();
        this.documentosRepo = new documentos_repo_1.DocumentosRepository();
        this.gestorFallbackUid = process.env.GESTOR_UID_DEFAULT || 'UAGpe4hb4gXKsVEK97fn3MFQKK53';
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
            }
            else {
                console.warn('[TramiteService] No hay aseguradoras disponibles en Firestore');
            }
        }
        catch (asegErr) {
            console.error('[TramiteService] Error asignando aseguradora:', asegErr);
        }
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
            aseguradora: aseguradoraAsignada || undefined,
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
        // 5. Generar notificación inicial al estudiante (usando UID del creador)
        const idNotificacion = await this.notificacionesService.notificarInicio(tramiteId, codigoUnico, creadoPor // UID del usuario que creó el trámite
        );
        await this.repo.actualizar(tramiteId, { notificacionInicial: idNotificacion });
        // 5.1. Notificar al gestor sobre el nuevo trámite
        try {
            await this.notificacionesService.crear({
                tipo: notificacion_1.TipoNotificacion.EMAIL,
                destinatario: this.gestorFallbackUid,
                mensaje: `Nuevo trámite ${codigoUnico} creado por ${estudiante.nombreCompleto}. Estado: REGISTRADO. Requiere validación.`,
                tramiteId,
                leida: false
            });
            console.log(`[TramiteService] Notificación enviada al gestor (UID: ${this.gestorFallbackUid})`);
        }
        catch (notifError) {
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
        // Notificar al creador del trámite usando su UID
        await this.notificacionesService.notificarCambioEstadoTramite(id, tramite.codigoUnico, nuevoEstado, tramite.creadoPor // UID del creador
        );
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
        // Limpiar undefined del resultado antes de crear respuestaAseguradora
        const respuestaAseguradora = limpiarUndefined({
            fecha: new Date(),
            aprobado: resultado.aprobado,
            montoAprobado: resultado.montoAprobado,
            observaciones: resultado.observaciones
        });
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
        // Limpiar undefined de los datos de actualización
        const datosActualizacion = {
            respuestaAseguradora,
            montoAprobado: resultado.montoAprobado
        };
        if (nuevoEstado === tramite_1.EstadoCaso.RECHAZADO) {
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
        await this.notificacionesService.notificarCambioEstadoTramite(id, tramite.codigoUnico, nuevoEstado, tramite.creadoPor);
        // Notificar también al gestor que llevó el caso (o al gestor por defecto)
        const destinatarioGestor = (tramite.rolUltimo === 'GESTOR' && tramite.actorUltimo)
            ? tramite.actorUltimo
            : this.gestorFallbackUid;
        if (destinatarioGestor) {
            await this.notificacionesService.notificarCambioEstadoTramite(id, tramite.codigoUnico, nuevoEstado, destinatarioGestor, notificacion_1.TipoNotificacion.SISTEMA);
        }
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
        // Notificar al creador del trámite usando su UID
        await this.notificacionesService.notificarCambioEstadoTramite(id, tramite.codigoUnico, tramite_1.EstadoCaso.CORRECCIONES_PENDIENTES, tramite.creadoPor);
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
        // Notificar al creador del trámite usando su UID
        await this.notificacionesService.notificarCambioEstadoTramite(id, tramite.codigoUnico, tramite_1.EstadoCaso.CERRADO, tramite.creadoPor);
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
        }
        catch (error) {
            console.error('[TramiteService] Error listando tramites:', error.message);
            throw new Error('Error al listar tramites: ' + error.message);
        }
    }
    async obtenerPorId(id) {
        return this.repo.obtenerPorId(id);
    }
    async listarPorEstado(estado) {
        return this.repo.listarPorEstado(estado);
    }
}
exports.TramiteService = TramiteService;
