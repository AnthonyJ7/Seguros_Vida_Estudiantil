// Entidad Estudiante según diagrama de clases
export enum EstadoAcademico {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  GRADUADO = 'graduado',
  RETIRADO = 'retirado'
}

export enum EstadoCobertura {
  VIGENTE = 'vigente',
  VENCIDA = 'vencida',
  SUSPENDIDA = 'suspendida'
}

export interface Estudiante {
  cedula: string;
  estadoAcademico: EstadoAcademico;
  estadoCobertura: EstadoCobertura;
  idEstudiante: string;
  nombreCompleto: string;
  periodoAcademico: string;
  // Métodos de negocio
  actualizarEstadoAcademico?: (nuevoEstado: EstadoAcademico) => void;
  verificarElegibilidad?: () => boolean;
}

// Función de dominio para verificar elegibilidad
export function verificarElegibilidad(estudiante: Estudiante): { elegible: boolean; razon?: string } {
  // Normalizar estado académico (aceptar mayúsculas/minúsculas)
  const estadoAcad = typeof estudiante.estadoAcademico === 'string'
    ? estudiante.estadoAcademico.toLowerCase()
    : estudiante.estadoAcademico;

  if (estadoAcad !== EstadoAcademico.ACTIVO) {
    return { elegible: false, razon: 'Estudiante no está en estado activo' };
  }
  
  // Permitir que estadoCobertura sea string enum o un número (monto de cobertura)
  if (typeof estudiante.estadoCobertura === 'number') {
    if (estudiante.estadoCobertura > 0) return { elegible: true };
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
