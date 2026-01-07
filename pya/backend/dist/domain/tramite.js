"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRANSICIONES_VALIDAS = exports.TipoTramite = exports.EstadoCaso = void 0;
exports.validarTransicion = validarTransicion;
exports.adjuntarDocumento = adjuntarDocumento;
exports.cambiarEstado = cambiarEstado;
var EstadoCaso;
(function (EstadoCaso) {
    EstadoCaso["BORRADOR"] = "borrador";
    EstadoCaso["REGISTRADO"] = "registrado";
    EstadoCaso["EN_VALIDACION"] = "en_validacion";
    EstadoCaso["OBSERVADO"] = "observado";
    EstadoCaso["VALIDADO"] = "validado";
    EstadoCaso["ENVIADO_ASEGURADORA"] = "enviado_aseguradora";
    EstadoCaso["CON_RESPUESTA"] = "con_respuesta";
    EstadoCaso["APROBADO"] = "aprobado";
    EstadoCaso["RECHAZADO"] = "rechazado";
    EstadoCaso["CON_OBSERVACIONES"] = "con_observaciones";
    EstadoCaso["CORRECCIONES_PENDIENTES"] = "correcciones_pendientes";
    EstadoCaso["PAGO_PENDIENTE"] = "pago_pendiente";
    EstadoCaso["PAGADO"] = "pagado";
    EstadoCaso["CERRADO"] = "cerrado";
})(EstadoCaso || (exports.EstadoCaso = EstadoCaso = {}));
var TipoTramite;
(function (TipoTramite) {
    TipoTramite["SINIESTRO"] = "siniestro";
    TipoTramite["FALLECIMIENTO"] = "fallecimiento";
    TipoTramite["ACCIDENTE"] = "accidente";
    TipoTramite["ENFERMEDAD"] = "enfermedad";
})(TipoTramite || (exports.TipoTramite = TipoTramite = {}));
// Transiciones válidas de estado (máquina de estados)
exports.TRANSICIONES_VALIDAS = {
    [EstadoCaso.BORRADOR]: [EstadoCaso.REGISTRADO],
    [EstadoCaso.REGISTRADO]: [EstadoCaso.EN_VALIDACION],
    [EstadoCaso.EN_VALIDACION]: [EstadoCaso.OBSERVADO, EstadoCaso.VALIDADO],
    [EstadoCaso.OBSERVADO]: [EstadoCaso.EN_VALIDACION, EstadoCaso.REGISTRADO],
    [EstadoCaso.VALIDADO]: [EstadoCaso.ENVIADO_ASEGURADORA],
    [EstadoCaso.ENVIADO_ASEGURADORA]: [EstadoCaso.CON_RESPUESTA],
    [EstadoCaso.CON_RESPUESTA]: [EstadoCaso.APROBADO, EstadoCaso.RECHAZADO, EstadoCaso.CON_OBSERVACIONES],
    [EstadoCaso.APROBADO]: [EstadoCaso.PAGO_PENDIENTE],
    [EstadoCaso.RECHAZADO]: [EstadoCaso.CERRADO],
    [EstadoCaso.CON_OBSERVACIONES]: [EstadoCaso.CORRECCIONES_PENDIENTES],
    [EstadoCaso.CORRECCIONES_PENDIENTES]: [EstadoCaso.EN_VALIDACION],
    [EstadoCaso.PAGO_PENDIENTE]: [EstadoCaso.PAGADO],
    [EstadoCaso.PAGADO]: [EstadoCaso.CERRADO],
    [EstadoCaso.CERRADO]: []
};
// Función de dominio para validar transición
function validarTransicion(estadoActual, nuevoEstado) {
    return exports.TRANSICIONES_VALIDAS[estadoActual]?.includes(nuevoEstado) || false;
}
// Métodos de negocio según diagrama
function adjuntarDocumento(tramite, documento) {
    tramite.documentos.push(documento);
}
function cambiarEstado(tramite, nuevoEstado, actor, rol, nota) {
    if (!validarTransicion(tramite.estadoCaso, nuevoEstado)) {
        return {
            success: false,
            error: `Transición no válida de ${tramite.estadoCaso} a ${nuevoEstado}`
        };
    }
    const historial = {
        estadoAnterior: tramite.estadoCaso,
        estadoNuevo: nuevoEstado,
        fecha: new Date(),
        actor,
        rol,
        nota
    };
    tramite.historial.push(historial);
    tramite.estadoCaso = nuevoEstado;
    tramite.actorUltimo = actor;
    tramite.rolUltimo = rol;
    return { success: true };
}
