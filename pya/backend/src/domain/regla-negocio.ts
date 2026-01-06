// Entidad ReglaNegocio según diagrama de clases
export interface ReglaNegocio {
  idRegla: string; // String para compatibilidad con Firestore
  nombre: string;
  descripcion: string;
  estado: boolean; // activa o inactiva
  valor: number; // valor numérico de la regla (ej. monto máximo, días mínimos, etc.)
  // Método de negocio
  aplicarRegla?: (tramite: any) => { cumple: boolean; mensaje?: string };
}

// Función de dominio para aplicar una regla
export function aplicarRegla(
  regla: ReglaNegocio,
  tramite: any
): { cumple: boolean; mensaje?: string } {
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
