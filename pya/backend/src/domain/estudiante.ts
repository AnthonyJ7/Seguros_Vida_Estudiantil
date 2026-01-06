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
  if (estudiante.estadoAcademico !== EstadoAcademico.ACTIVO) {
    return { elegible: false, razon: 'Estudiante no está en estado activo' };
  }
  
  if (estudiante.estadoCobertura !== EstadoCobertura.VIGENTE) {
    return { elegible: false, razon: 'Cobertura del estudiante no está vigente' };
  }
  
  return { elegible: true };
}
