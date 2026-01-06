/**
 * CONFIGURACIÓN CENTRALIZADA DE REGLAS DE NEGOCIO
 * Parámetros y constantes del sistema
 */

export const BUSINESS_CONFIG = {
  /**
   * VALIDACIONES DE ESTUDIANTES
   */
  ESTUDIANTE: {
    EDAD_MINIMA: 18,
    DOCUMENTO_REGEX: /^\d{6,10}$/, // 6-10 dígitos
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    TELEFONO_REGEX: /^[\d\s\-\+\(\)]{7,15}$/,
    CAMPOS_OBLIGATORIOS: ['nombre', 'apellido', 'documento', 'email', 'telefonoContacto']
  },

  /**
   * VALIDACIONES DE PÓLIZAS
   */
  POLIZA: {
    PRIMA_MINIMA: 0.01,
    COBERTURA_MINIMA: 1000,
    COBERTURA_MAXIMA: 1000000,
    RELACION_PRIMA_COBERTURA_MAX: 0.10, // 10%
    ESTADOS_VALIDOS: ['PENDIENTE', 'ACTIVA', 'VIGENTE', 'VENCIDA', 'CANCELADA', 'SUSPENDIDA'],
    CAMPO_OBLIGATORIOS: ['idEstudiante', 'idAseguradora', 'fechaInicio', 'fechaVencimiento', 'prima', 'montoCobertura']
  },

  /**
   * VALIDACIONES DE SINIESTROS
   */
  SINIESTRO: {
    TIPOS_VALIDOS: ['MUERTE', 'INVALIDEZ', 'ENFERMEDAD', 'ACCIDENTE'],
    DESCRIPCION_MINIMA: 10,
    DESCRIPCION_MAXIMA: 1000,
    ESTADOS_VALIDOS: ['REGISTRADO', 'PENDIENTE_REVISION', 'APROBADO', 'RECHAZADO', 'PAGADO'],
    DIAS_VALIDACION_DUPLICADO: 30,
    MONTO_MINIMO: 0.01,
    CAMPOS_OBLIGATORIOS: ['idPoliza', 'tipo', 'descripcion', 'fechaOcurrencia', 'montoReclamado']
  },

  /**
   * VALIDACIONES DE USUARIOS
   */
  USUARIO: {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBER: true,
    PASSWORD_REQUIRE_SPECIAL: true,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    ROLES_VALIDOS: ['ADMIN', 'INSURER', 'GESTOR', 'CLIENTE', 'AUDITOR'],
    CAMPOS_OBLIGATORIOS: ['nombre', 'email', 'rol'],
    MAX_INTENTOS_LOGIN: 5,
    BLOQUEO_DURACION_MINUTOS: 15
  },

  /**
   * VALIDACIONES DE DOCUMENTOS
   */
  DOCUMENTO: {
    TIPOS_PERMITIDOS: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    EXTENSIONES_PERMITIDAS: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx'],
    TAMANIO_MAXIMO_MB: 10,
    TAMANIO_MAXIMO_BYTES: 10 * 1024 * 1024,
    CAMPOS_OBLIGATORIOS: ['nombreArchivo', 'tipo', 'idTramite']
  },

  /**
   * VALIDACIONES DE BENEFICIARIOS
   */
  BENEFICIARIO: {
    PARENTESCOS_VALIDOS: ['ESPOSO/A', 'HIJO/A', 'PADRE', 'MADRE', 'HERMANO/A', 'OTRO'],
    PORCENTAJE_MINIMO: 1,
    PORCENTAJE_MAXIMO: 100,
    PORCENTAJE_TOTAL_MAXIMO: 100,
    CAMPOS_OBLIGATORIOS: ['nombre', 'apellido', 'documento', 'parentesco', 'porcentaje']
  },

  /**
   * CONFIGURACIÓN GENERAL
   */
  GENERAL: {
    // Tiempos
    TIMEOUT_SESION_MINUTOS: 30,
    DURACION_MENSAJE_EXITO_MS: 3000,
    DURACION_MENSAJE_ERROR_MS: 5000,

    // Paginación
    ITEMS_POR_PAGINA: 10,
    MAX_ITEMS_EXPORT: 1000,

    // Auditoría
    REGISTRAR_AUDITORÍA: true,
    DIAS_RETENCIÓN_AUDITORÍA: 365,

    // Reportes
    FORMATO_FECHA: 'DD/MM/YYYY',
    FORMATO_HORA: 'HH:mm:ss',
    FORMATO_MONEDA: 'COP',
    DECIMALES_MONEDA: 2
  }
};

/**
 * MENSAJES DE VALIDACIÓN AMIGABLES
 */
export const VALIDATION_MESSAGES = {
  // Estudiantes
  ESTUDIANTE: {
    EDAD_MINIMA: 'El estudiante debe ser mayor de 18 años',
    DOCUMENTO_DUPLICADO: 'Este documento ya está registrado en el sistema',
    DOCUMENTO_INVALIDO: 'Formato de documento inválido',
    EMAIL_DUPLICADO: 'Este email ya está registrado',
    EMAIL_INVALIDO: 'El formato del email no es válido',
    TELEFONO_INVALIDO: 'El formato del teléfono no es válido',
    NOMBRE_REQUERIDO: 'El nombre es requerido',
    APELLIDO_REQUERIDO: 'El apellido es requerido',
    DOCUMENTO_REQUERIDO: 'El documento es requerido',
    TELEFONO_REQUERIDO: 'El teléfono es requerido'
  },

  // Pólizas
  POLIZA: {
    ESTUDIANTE_NO_EXISTE: 'El estudiante seleccionado no existe',
    POLIZA_DUPLICADA: 'Este estudiante ya tiene una póliza vigente',
    ASEGURADORA_NO_EXISTE: 'La aseguradora seleccionada no existe',
    FECHAS_INVALIDAS: 'La fecha de inicio debe ser anterior a la fecha de vencimiento',
    PRIMA_INVALIDA: 'La prima debe ser un valor positivo',
    COBERTURA_INVALIDA: 'El monto de cobertura debe ser un valor positivo',
    PRIMA_COBERTURA_RATIO: 'La prima es muy alta en relación a la cobertura',
    COBERTURA_BAJA: 'El monto de cobertura es inferior al mínimo requerido'
  },

  // Siniestros
  SINIESTRO: {
    POLIZA_NO_EXISTE: 'La póliza especificada no existe',
    POLIZA_NO_VIGENTE: 'La póliza no está vigente',
    FECHA_FUERA_COBERTURA: 'La fecha del siniestro está fuera del período de cobertura',
    MONTO_EXCEDE_COBERTURA: 'El monto reclamado excede la cobertura de la póliza',
    DESCRIPCION_INSUFICIENTE: 'La descripción debe tener al menos 10 caracteres',
    TIPO_INVALIDO: 'El tipo de siniestro seleccionado no es válido',
    SINIESTRO_DUPLICADO: 'Ya existe un siniestro del mismo tipo en los últimos 30 días'
  },

  // Usuarios
  USUARIO: {
    EMAIL_DUPLICADO: 'Ya existe un usuario con este email',
    EMAIL_INVALIDO: 'El formato del email no es válido',
    ROL_INVALIDO: 'El rol seleccionado no es válido',
    PASSWORD_DEBIL: 'La contraseña debe incluir mayúscula, número y símbolo',
    PASSWORD_REQUERIDO: 'La contraseña es requerida',
    NOMBRE_REQUERIDO: 'El nombre es requerido',
    ROL_REQUERIDO: 'El rol es requerido',
    PERMISO_ADMIN_DENEGADO: 'Solo un administrador puede crear otros administradores'
  },

  // Documentos
  DOCUMENTO: {
    TIPO_INVALIDO: 'El tipo de archivo no está permitido',
    TAMANIO_EXCEDIDO: 'El archivo es demasiado grande (máximo 10MB)',
    TRAMITE_NO_EXISTE: 'El trámite especificado no existe',
    NOMBRE_VACIO: 'El nombre del archivo es requerido'
  },

  // Beneficiarios
  BENEFICIARIO: {
    PARENTESCO_INVALIDO: 'El parentesco seleccionado no es válido',
    PORCENTAJE_INVALIDO: 'El porcentaje debe estar entre 1 y 100',
    DOCUMENTO_REQUERIDO: 'El documento del beneficiario es requerido',
    NOMBRE_REQUERIDO: 'El nombre del beneficiario es requerido',
    APELLIDO_REQUERIDO: 'El apellido del beneficiario es requerido',
    POLIZA_NO_EXISTE: 'La póliza especificada no existe'
  },

  // Seguridad
  SEGURIDAD: {
    ACCESO_DENEGADO: 'No tiene permisos para realizar esta acción',
    NO_AUTENTICADO: 'Debe autenticarse para continuar',
    SESION_EXPIRADA: 'Su sesión ha expirado, inicie sesión nuevamente',
    INTENTO_FALLIDO: 'Usuario o contraseña incorrectos',
    USUARIO_BLOQUEADO: 'La cuenta está bloqueada temporalmente por exceso de intentos fallidos'
  }
};

/**
 * COLORES PARA MENSAJES
 */
export const MESSAGE_COLORS = {
  ERROR: '#dc3545',      // Rojo
  WARNING: '#ffc107',    // Amarillo
  SUCCESS: '#28a745',    // Verde
  INFO: '#17a2b8'        // Azul
};

/**
 * CONSTANTES DE ESTADO
 */
export const ESTADOS = {
  POLIZA: {
    PENDIENTE: 'PENDIENTE',
    ACTIVA: 'ACTIVA',
    VIGENTE: 'VIGENTE',
    VENCIDA: 'VENCIDA',
    CANCELADA: 'CANCELADA',
    SUSPENDIDA: 'SUSPENDIDA'
  },
  SINIESTRO: {
    REGISTRADO: 'REGISTRADO',
    PENDIENTE_REVISION: 'PENDIENTE_REVISION',
    APROBADO: 'APROBADO',
    RECHAZADO: 'RECHAZADO',
    PAGADO: 'PAGADO'
  },
  TRAMITE: {
    PENDIENTE: 'PENDIENTE',
    ENVIADO: 'ENVIADO',
    RECIBIDO: 'RECIBIDO',
    EN_PROCESO: 'EN_PROCESO',
    COMPLETADO: 'COMPLETADO',
    RECHAZADO: 'RECHAZADO'
  }
};

/**
 * FUNCIONES AUXILIARES
 */
export class ConfigHelper {
  /**
   * Validar contraseña según requisitos
   */
  static validarContrasena(password: string): {
    esValida: boolean;
    errores: string[];
  } {
    const errores: string[] = [];

    if (password.length < BUSINESS_CONFIG.USUARIO.PASSWORD_MIN_LENGTH) {
      errores.push(`Mínimo ${BUSINESS_CONFIG.USUARIO.PASSWORD_MIN_LENGTH} caracteres`);
    }

    if (BUSINESS_CONFIG.USUARIO.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
      errores.push('Debe incluir al menos una mayúscula (A-Z)');
    }

    if (BUSINESS_CONFIG.USUARIO.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
      errores.push('Debe incluir al menos una minúscula (a-z)');
    }

    if (BUSINESS_CONFIG.USUARIO.PASSWORD_REQUIRE_NUMBER && !/[0-9]/.test(password)) {
      errores.push('Debe incluir al menos un número (0-9)');
    }

    if (BUSINESS_CONFIG.USUARIO.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errores.push('Debe incluir al menos un símbolo (!@#$%^&*...)');
    }

    return {
      esValida: errores.length === 0,
      errores
    };
  }

  /**
   * Formatear moneda
   */
  static formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: BUSINESS_CONFIG.GENERAL.FORMATO_MONEDA,
      minimumFractionDigits: BUSINESS_CONFIG.GENERAL.DECIMALES_MONEDA,
      maximumFractionDigits: BUSINESS_CONFIG.GENERAL.DECIMALES_MONEDA
    }).format(valor);
  }

  /**
   * Formatear fecha
   */
  static formatearFecha(fecha: Date | string): string {
    const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const año = d.getFullYear();
    return `${dia}/${mes}/${año}`;
  }

  /**
   * Obtener edad a partir de fecha de nacimiento
   */
  static calcularEdad(fechaNacimiento: Date | string): number {
    const hoy = new Date();
    const nacimiento = typeof fechaNacimiento === 'string' ? new Date(fechaNacimiento) : fechaNacimiento;
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }

    return edad;
  }

  /**
   * Validar documento
   */
  static validarDocumento(documento: string): boolean {
    return BUSINESS_CONFIG.ESTUDIANTE.DOCUMENTO_REGEX.test(documento);
  }
}
