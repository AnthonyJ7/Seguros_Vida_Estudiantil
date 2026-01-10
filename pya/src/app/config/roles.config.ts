/**
 * CONFIGURACIÓN DE ROLES Y PERMISOS DEL SISTEMA
 * Define los 3 tipos de usuarios principales: ADMIN, GESTOR, CLIENTE
 */

export interface RoleConfig {
  id: string;
  nombre: string;
  descripcion: string;
    nivel: 'ADMINISTRADOR' | 'GESTIÓN' | 'CLIENTE';
  color: string;
  icono: string;
  permisos: string[];
  acceso: {
    dashboard?: boolean;
    usuarios?: boolean;
    estudiantes?: boolean;
    polizas?: boolean;
    siniestros?: boolean;
    documentos?: boolean;
    reportes?: boolean;
    auditoria?: boolean;
    configuracion?: boolean;
    aseguradoras?: boolean;
  };
}

export interface RoleStyles {
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeColor: string;
  buttonColor: string;
}

export const ROLES_CONFIG: { [key: string]: RoleConfig } = {
  /**
   * ADMIN - Nivel Administrador
   * Control total del sistema
   */
  ADMIN: {
    id: 'ADMIN',
    nombre: 'Administrador',
    descripcion: 'Control total del sistema',
    nivel: 'ADMINISTRADOR',
    color: '#EF4444', // red-500
    icono: '👨‍💼',
    permisos: [
      'sistema.acceso_total',
      'usuarios.crud',
      'estudiantes.crud',
      'polizas.crud',
      'siniestros.crud',
      'documentos.crud',
      'auditoria.leer',
      'reportes.generar',
      'configuracion.modificar',
    ],
    acceso: {
      dashboard: true,
      usuarios: true,
      estudiantes: true,
      polizas: true,
      siniestros: true,
      documentos: true,
      reportes: true,
      auditoria: true,
      configuracion: true,
      aseguradoras: true,
    },
  },

  /**
   * GESTOR - Nivel Gestión
   * Gestión de operaciones administrativas
   */
  GESTOR: {
    id: 'GESTOR',
    nombre: 'Gestor Administrativo',
    descripcion: 'Gestión de estudiantes, trámites y documentos',
    nivel: 'GESTIÓN',
    color: '#F59E0B', // amber-500
    icono: '👨‍💻',
    permisos: [
      'estudiantes.crear',
      'estudiantes.leer',
      'estudiantes.actualizar',
      'documentos.crear',
      'documentos.leer',
      'documentos.eliminar',
      'siniestros.crear',
      'siniestros.leer',
      'siniestros.actualizar',
      'polizas.leer',
      'reportes.generar_basicos',
    ],
    acceso: {
      dashboard: true,
      usuarios: false,
      estudiantes: true,
      polizas: true,
      siniestros: true,
      documentos: true,
      reportes: true,
      auditoria: false,
      configuracion: false,
    },
  },

  /**
   * CLIENTE - Nivel Cliente
   * Acceso limitado a datos propios
   */
  CLIENTE: {
    id: 'CLIENTE',
    nombre: 'Estudiante Asegurado',
    descripcion: 'Acceso a información personal y pólizas',
    nivel: 'CLIENTE',
    color: '#10B981', // emerald-500
    icono: '👨‍🎓',
    permisos: [
      'perfil.leer_propio',
      'perfil.actualizar_propio',
      'polizas.leer_propias',
      'siniestros.crear',
      'siniestros.leer_propios',
      'documentos.crear',
      'documentos.leer_propios',
      'notificaciones.leer',
    ],
    acceso: {
      dashboard: true,
      usuarios: false,
      estudiantes: false,
      polizas: false,
      siniestros: true,
      documentos: true,
      reportes: false,
      auditoria: false,
      configuracion: false,
    },
  },

};

/**
 * Matriz de jerarquía de roles
 * Mayor número = Mayor privilegio
 */
export const ROLE_HIERARCHY: { [key: string]: number } = {
  CLIENTE: 1,
    GESTOR: 2,
    ADMIN: 3,
};

/**
 * Mapeo de estilos por rol
 */
export const ROLE_STYLES: { [key: string]: RoleStyles } = {
  ADMIN: {
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeColor: 'bg-red-100 text-red-800',
    buttonColor: 'bg-red-600 hover:bg-red-700',
  },
  GESTOR: {
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-100 text-amber-800',
    buttonColor: 'bg-amber-600 hover:bg-amber-700',
  },
  CLIENTE: {
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
  },
};

/**
 * Permisos por operación
 */
export const OPERATION_PERMISSIONS: { [key: string]: string[] } = {
  'estudiantes.crear': ['ADMIN', 'GESTOR'],
    'estudiantes.leer': ['ADMIN', 'GESTOR'],
  'estudiantes.actualizar': ['ADMIN', 'GESTOR'],
  'estudiantes.eliminar': ['ADMIN'],

    'polizas.crear': ['ADMIN', 'GESTOR'],
    'polizas.leer': ['ADMIN', 'GESTOR', 'CLIENTE'],
    'polizas.actualizar': ['ADMIN', 'GESTOR'],
  'polizas.eliminar': ['ADMIN'],

  'siniestros.crear': ['ADMIN', 'GESTOR', 'CLIENTE'],
    'siniestros.leer': ['ADMIN', 'GESTOR'],
    'siniestros.actualizar': ['ADMIN', 'GESTOR'],
  'siniestros.eliminar': ['ADMIN'],
    'siniestros.aprobar': ['ADMIN', 'GESTOR'],

  'documentos.crear': ['ADMIN', 'GESTOR', 'CLIENTE'],
    'documentos.leer': ['ADMIN', 'GESTOR'],
  'documentos.eliminar': ['ADMIN', 'GESTOR'],

  'usuarios.crear': ['ADMIN'],
    'usuarios.leer': ['ADMIN'],
  'usuarios.actualizar': ['ADMIN'],
  'usuarios.eliminar': ['ADMIN'],

    'auditoria.leer': ['ADMIN'],
    'reportes.generar': ['ADMIN', 'GESTOR'],

  'configuracion.modificar': ['ADMIN'],
};

/**
 * Helper para obtener rol por ID
 */
export function getRoleConfig(roleId: string): RoleConfig | null {
  return ROLES_CONFIG[roleId.toUpperCase()] || null;
}

/**
 * Helper para verificar si un usuario puede realizar una operación
 */
export function canPerformOperation(userRole: string, operation: string): boolean {
  const allowedRoles = OPERATION_PERMISSIONS[operation] || [];
  return allowedRoles.includes(userRole.toUpperCase());
}

/**
 * Helper para comparar jerarquía de roles
 */
export function isHigherRank(role1: string, role2: string): boolean {
  const rank1 = ROLE_HIERARCHY[role1.toUpperCase()] || 0;
  const rank2 = ROLE_HIERARCHY[role2.toUpperCase()] || 0;
  return rank1 > rank2;
}
