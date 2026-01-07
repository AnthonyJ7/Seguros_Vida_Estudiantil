"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoCobertura = exports.EstadoAcademico = void 0;
exports.verificarElegibilidad = verificarElegibilidad;
// Entidad Estudiante según diagrama de clases
var EstadoAcademico;
(function (EstadoAcademico) {
    EstadoAcademico["ACTIVO"] = "activo";
    EstadoAcademico["INACTIVO"] = "inactivo";
    EstadoAcademico["GRADUADO"] = "graduado";
    EstadoAcademico["RETIRADO"] = "retirado";
})(EstadoAcademico || (exports.EstadoAcademico = EstadoAcademico = {}));
var EstadoCobertura;
(function (EstadoCobertura) {
    EstadoCobertura["VIGENTE"] = "vigente";
    EstadoCobertura["VENCIDA"] = "vencida";
    EstadoCobertura["SUSPENDIDA"] = "suspendida";
})(EstadoCobertura || (exports.EstadoCobertura = EstadoCobertura = {}));
// Función de dominio para verificar elegibilidad
function verificarElegibilidad(estudiante) {
    // Normalizar estado académico (aceptar mayúsculas/minúsculas)
    const estadoAcad = typeof estudiante.estadoAcademico === 'string'
        ? estudiante.estadoAcademico.toLowerCase()
        : estudiante.estadoAcademico;
    if (estadoAcad !== EstadoAcademico.ACTIVO) {
        return { elegible: false, razon: 'Estudiante no está en estado activo' };
    }
    // Permitir que estadoCobertura sea string enum o un número (monto de cobertura)
    if (typeof estudiante.estadoCobertura === 'number') {
        if (estudiante.estadoCobertura > 0)
            return { elegible: true };
        return { elegible: false, razon: 'Cobertura sin monto' };
    }
    const estadoCob = typeof estudiante.estadoCobertura === 'string'
        ? estudiante.estadoCobertura.toLowerCase()
        : estudiante.estadoCobertura;
    if (estadoCob !== EstadoCobertura.VIGENTE) {
        return { elegible: false, razon: 'Cobertura del estudiante no está vigente' };
    }
    return { elegible: true };
}
