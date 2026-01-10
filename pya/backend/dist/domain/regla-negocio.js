"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aplicarRegla = aplicarRegla;
// Función de dominio para aplicar una regla
function aplicarRegla(regla, tramite) {
    if (!regla.estado) {
        return { cumple: true }; // Regla inactiva, se considera cumplida
    }
    // Lógica personalizada según el tipo de regla
    // Esto se puede extender con un patrón Strategy
    switch (regla.nombre) {
        case 'MONTO_MAXIMO':
            if (tramite.montoAprobado && tramite.montoAprobado > regla.valor) {
                return { cumple: false, mensaje: `El monto excede el máximo permitido: ${regla.valor}` };
            }
            break;
        case 'DIAS_MINIMOS_MATRICULA':
            // Validación de días mínimos desde matrícula
            break;
        // Añadir más reglas según necesidad
    }
    return { cumple: true };
}
