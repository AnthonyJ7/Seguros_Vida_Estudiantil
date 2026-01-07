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
    if (estudiante.estadoAcademico !== EstadoAcademico.ACTIVO) {
        return { elegible: false, razon: 'Estudiante no está en estado activo' };
    }
    if (estudiante.estadoCobertura !== EstadoCobertura.VIGENTE) {
        return { elegible: false, razon: 'Cobertura del estudiante no está vigente' };
    }
    return { elegible: true };
}
