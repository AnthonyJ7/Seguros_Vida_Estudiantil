// Entidad TrámiteSiniestro según diagrama de clases
import { Beneficiario } from './beneficiario';
import { Documento } from './documento';

export enum EstadoCaso {
  BORRADOR = 'borrador',
  REGISTRADO = 'registrado',
  EN_VALIDACION = 'en_validacion',
  OBSERVADO = 'observado',
  VALIDADO = 'validado',
  ENVIADO_ASEGURADORA = 'enviado_aseguradora',
  CON_RESPUESTA = 'con_respuesta',
  APROBADO = 'aprobado',
  RECHAZADO = 'rechazado',
  CON_OBSERVACIONES = 'con_observaciones',
  CORRECCIONES_PENDIENTES = 'correcciones_pendientes',
  PAGO_PENDIENTE = 'pago_pendiente',
  PAGADO = 'pagado',
  CERRADO = 'cerrado'
}

export enum TipoTramite {
  SINIESTRO = 'siniestro',
  FALLECIMIENTO = 'fallecimiento',
  ACCIDENTE = 'accidente',
  ENFERMEDAD = 'enfermedad'
}

export interface HistorialEstado {
  estadoAnterior: EstadoCaso;
  estadoNuevo: EstadoCaso;
  fecha: Date;
  actor: string; // uid
  rol: string;
  nota?: string;
}

export interface Correccion {
  id: string;
  solicitudFecha: Date;
  solicitadoPor: string;
  descripcion: string;
  resuelta: boolean;
  fechaResolucion?: Date;
}

export interface RespuestaAseguradora {
  fecha: Date;
  aprobado: boolean;
  montoAprobado?: number;
  observaciones?: string;
  idAseguradora?: number;
}

export interface Tramite {
  // Identificación
  id?: string;
  codigoUnico: string;
  idTramite: string;
  
  // Estado
  estadoCaso: EstadoCaso;
  tipoTramite: TipoTramite;
  
  // Fechas
  fechaRegistro: Date;
  fechaCierre?: Date;
  
  // Estudiante (embebido)
  estudiante: {
    cedula: string;
    nombreCompleto: string;
    periodoAcademico: string;
    estadoAcademico: string;
    estadoCobertura: string;
    idEstudiante: string;
  };
  
  // Beneficiario (opcional)
  beneficiario?: Beneficiario;
  
  // Motivo y descripción
  motivo: string;
  descripcion?: string;
  
  // Documentos
  documentos: Documento[];
  
  // Validaciones
  validaciones?: {
    vigenciaMatricula?: { valida: boolean; mensaje?: string };
    requisitosSiniestro?: { valida: boolean; mensaje?: string };
    reglasNegocio?: { valida: boolean; mensaje?: string };
  };
  
  // Aseguradora
  aseguradora?: {
    idAseguradora: number;
    nombre: string;
    correoContacto: string;
  };
  
  // Resultado
  montoAprobado?: number;
  respuestaAseguradora?: RespuestaAseguradora;
  
  // Correcciones
  correcciones?: Correccion[];
  
  // Pago
  estadoPago?: 'pendiente' | 'confirmado' | 'rechazado';
  fechaPago?: Date;
  
  // Historial
  historial: HistorialEstado[];
  
  // Notificaciones
  notificacionInicial?: string; // ID de la notificación
  medioNotificacionPreferido?: string;

  // Copago y cobertura
  copago?: {
    categoria: string;
    porcentaje: number;
    baseCalculo?: number;
    valorEstimado?: number;
    fuente: 'TDR' | 'manual';
  };
  
  // Actor último
  creadoPor: string;
  actorUltimo?: string;
  rolUltimo?: string;
}

// Transiciones válidas de estado (máquina de estados)
// Flujo simplificado para gestor: EN_VALIDACION → VALIDADO → APROBADO/RECHAZADO
export const TRANSICIONES_VALIDAS: Record<EstadoCaso, EstadoCaso[]> = {
  [EstadoCaso.BORRADOR]: [EstadoCaso.REGISTRADO],
  [EstadoCaso.REGISTRADO]: [EstadoCaso.EN_VALIDACION],
  [EstadoCaso.EN_VALIDACION]: [EstadoCaso.OBSERVADO, EstadoCaso.VALIDADO, EstadoCaso.APROBADO, EstadoCaso.RECHAZADO, EstadoCaso.CORRECCIONES_PENDIENTES],
  [EstadoCaso.OBSERVADO]: [EstadoCaso.EN_VALIDACION, EstadoCaso.REGISTRADO],
  [EstadoCaso.VALIDADO]: [EstadoCaso.ENVIADO_ASEGURADORA, EstadoCaso.APROBADO, EstadoCaso.RECHAZADO, EstadoCaso.CORRECCIONES_PENDIENTES],
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
export function validarTransicion(estadoActual: EstadoCaso, nuevoEstado: EstadoCaso): boolean {
  return TRANSICIONES_VALIDAS[estadoActual]?.includes(nuevoEstado) || false;
}

// Métodos de negocio según diagrama
export function adjuntarDocumento(tramite: Tramite, documento: Documento): void {
  tramite.documentos.push(documento);
}

export function cambiarEstado(
  tramite: Tramite,
  nuevoEstado: EstadoCaso,
  actor: string,
  rol: string,
  nota?: string
): { success: boolean; error?: string } {
  if (!validarTransicion(tramite.estadoCaso, nuevoEstado)) {
    return {
      success: false,
      error: `Transición no válida de ${tramite.estadoCaso} a ${nuevoEstado}`
    };
  }

  const historial: HistorialEstado = {
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
