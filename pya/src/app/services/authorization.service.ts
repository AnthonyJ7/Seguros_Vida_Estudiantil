import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { AuditService } from './audit.service';

/**
 * SERVICIO DE AUTORIZACIÓN Y CONTROL DE ACCESO
 * Maneja permisos basados en roles y recursos
 */

export interface RolePermission {
  role: string;
  recurso: string;
  permisos: string[]; // 'create', 'read', 'update', 'delete'
}

export interface RoleDefinition {
  nombre: string;
  descripcion: string;
  permisos: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {
  private rolesDefinidos: Map<string, RoleDefinition> = new Map();
  private permisosRecurso: Map<string, RolePermission[]> = new Map();

  constructor(
    private firestore: FirestoreService,
    private audit: AuditService
  ) {
    this.inicializarRoles();
    this.inicializarPermisos();
  }

  /**
   * INICIALIZACIÓN DE ROLES
   */

  private inicializarRoles(): void {
    // ADMIN - Control total
    this.rolesDefinidos.set('ADMIN', {
      nombre: 'ADMIN',
      descripcion: 'Administrador del sistema con acceso total',
      permisos: [
        'usuario.crear',
        'usuario.leer',
        'usuario.actualizar',
        'usuario.eliminar',
        'usuario.cambiar_rol',
        'estudiante.crear',
        'estudiante.leer',
        'estudiante.actualizar',
        'estudiante.eliminar',
        'poliza.crear',
        'poliza.leer',
        'poliza.actualizar',
        'poliza.eliminar',
        'siniestro.crear',
        'siniestro.leer',
        'siniestro.actualizar',
        'siniestro.eliminar',
        'siniestro.aprobar',
        'documento.crear',
        'documento.leer',
        'documento.eliminar',
        'auditoria.leer',
        'reportes.generar',
        'configuracion.modificar'
      ]
    });

    // GESTOR - Gestor administrativo
    this.rolesDefinidos.set('GESTOR', {
      nombre: 'GESTOR',
      descripcion: 'Gestor administrativo de trámites y documentos',
      permisos: [
        'estudiante.leer',
        'estudiante.actualizar',
        'poliza.leer',
        'siniestro.leer',
        'siniestro.crear',
        'siniestro.actualizar',
        'siniestro.aprobar',
        'documento.crear',
        'documento.leer',
        'documento.eliminar'
      ]
    });

    // CLIENTE - Estudiante asegurado
    this.rolesDefinidos.set('CLIENTE', {
      nombre: 'CLIENTE',
      descripcion: 'Estudiante asegurado',
      permisos: [
        'estudiante.leer_propio',
        'poliza.leer_propia',
        'siniestro.crear',
        'siniestro.leer_propio',
        'documento.crear',
        'documento.leer_propio'
      ]
    });
  }

  /**
   * INICIALIZACIÓN DE PERMISOS POR RECURSO
   */

  private inicializarPermisos(): void {
    // Permisos para ESTUDIANTES
    this.permisosRecurso.set('estudiante', [
      { role: 'ADMIN', recurso: 'estudiante', permisos: ['create', 'read', 'update', 'delete'] },
      { role: 'GESTOR', recurso: 'estudiante', permisos: ['read', 'update'] },
      { role: 'CLIENTE', recurso: 'estudiante', permisos: ['read_own'] }
    ]);

    // Permisos para PÓLIZAS
    this.permisosRecurso.set('poliza', [
      { role: 'ADMIN', recurso: 'poliza', permisos: ['create', 'read', 'update', 'delete'] },
      { role: 'GESTOR', recurso: 'poliza', permisos: ['read'] },
      { role: 'CLIENTE', recurso: 'poliza', permisos: ['read_own'] }
    ]);

    // Permisos para SINIESTROS
    this.permisosRecurso.set('siniestro', [
      { role: 'ADMIN', recurso: 'siniestro', permisos: ['create', 'read', 'update', 'delete', 'approve'] },
      { role: 'GESTOR', recurso: 'siniestro', permisos: ['create', 'read', 'update', 'approve'] },
      { role: 'CLIENTE', recurso: 'siniestro', permisos: ['create', 'read_own'] }
    ]);

    // Permisos para DOCUMENTOS
    this.permisosRecurso.set('documento', [
      { role: 'ADMIN', recurso: 'documento', permisos: ['create', 'read', 'delete'] },
      { role: 'GESTOR', recurso: 'documento', permisos: ['create', 'read', 'delete'] },
      { role: 'CLIENTE', recurso: 'documento', permisos: ['create', 'read_own'] }
    ]);

    // Permisos para USUARIOS
    this.permisosRecurso.set('usuario', [
      { role: 'ADMIN', recurso: 'usuario', permisos: ['create', 'read', 'update', 'delete', 'change_role'] },
      { role: 'GESTOR', recurso: 'usuario', permisos: [] },
      { role: 'CLIENTE', recurso: 'usuario', permisos: ['read_own'] }
    ]);

    // Permisos para AUDITORÍA
    this.permisosRecurso.set('auditoria', [
      { role: 'ADMIN', recurso: 'auditoria', permisos: ['read', 'delete'] },
      { role: 'GESTOR', recurso: 'auditoria', permisos: ['read'] }
    ]);

    // Permisos para REPORTES
    this.permisosRecurso.set('reportes', [
      { role: 'ADMIN', recurso: 'reportes', permisos: ['create', 'read'] },
      { role: 'GESTOR', recurso: 'reportes', permisos: ['create', 'read'] }
    ]);
  }

  /**
   * VALIDAR PERMISO DE USUARIO
   */

  async tienePermiso(usuarioId: string, recurso: string, accion: string): Promise<boolean> {
    try {
      const usuarios = await this.firestore.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioId);

      if (!usuarios || usuarios.length === 0) {
        await this.audit.registrarAccesoDenegado(usuarioId, recurso, 'Usuario no encontrado');
        return false;
      }
      const usuario = usuarios[0];

      const permisos = this.permisosRecurso.get(recurso);
      if (!permisos) {
        await this.audit.registrarAccesoDenegado(usuarioId, recurso, 'Recurso no existe');
        return false;
      }

      const rolePermiso = permisos.find(p => p.role === usuario.rol);
      if (!rolePermiso) {
        await this.audit.registrarAccesoDenegado(usuarioId, recurso, `Rol ${usuario.rol} no tiene permisos`);
        return false;
      }

      const permitido = rolePermiso.permisos.includes(accion) || rolePermiso.permisos.includes('*');

      if (!permitido) {
        await this.audit.registrarAccesoDenegado(usuarioId, recurso, `Acción ${accion} no permitida`);
      }

      return permitido;
    } catch (error) {
      console.error('Error validando permiso:', error);
      return false;
    }
  }

  /**
   * VALIDAR PERMISO CON PROPIEDAD (read_own, update_own, etc)
   */

  async tienePermisoPropio(usuarioId: string, recurso: string, accion: string, idRecurso: string): Promise<boolean> {
    try {
      const usuarios = await this.firestore.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioId);

      if (!usuarios || usuarios.length === 0) {
        return false;
      }
      const usuario = usuarios[0];

      // Si tiene permiso total, retorna true
      if (await this.tienePermiso(usuarioId, recurso, accion)) {
        return true;
      }

      // Validar acciones propias
      const accionPropia = `${accion}_own`;
      const permisos = this.permisosRecurso.get(recurso);
      const rolePermiso = permisos?.find(p => p.role === usuario.rol);

      if (!rolePermiso?.permisos.includes(accionPropia)) {
        return false;
      }

      // Validar que el recurso pertenezca al usuario
      if (recurso === 'estudiante') {
        const estudiantes = await this.firestore.getDocumentsWithCondition('estudiante', 'id', '==', idRecurso);
        if (!estudiantes || estudiantes.length === 0) return false;
        return estudiantes[0]?.uidUsuario === usuarioId;
      }

      if (recurso === 'poliza') {
        const polizas = await this.firestore.getDocumentsWithCondition('polizas', 'id', '==', idRecurso);
        if (!polizas || polizas.length === 0) return false;
        const poliza = polizas[0];
        const estudiantes = await this.firestore.getDocumentsWithCondition('estudiante', 'id', '==', poliza?.idEstudiante);
        const estudiante = estudiantes && estudiantes.length > 0 ? estudiantes[0] : null;
        return estudiante?.uidUsuario === usuarioId;
      }

      if (recurso === 'siniestro') {
        const siniestros = await this.firestore.getDocumentsWithCondition('tramites', 'id', '==', idRecurso);
        if (!siniestros || siniestros.length === 0) return false;
        const siniestro = siniestros[0];
        const estudiantes = await this.firestore.getDocumentsWithCondition('estudiante', 'id', '==', siniestro?.idEstudiante);
        const estudiante = estudiantes && estudiantes.length > 0 ? estudiantes[0] : null;
        return estudiante?.uidUsuario === usuarioId;
      }

      return false;
    } catch (error) {
      console.error('Error validando permiso propio:', error);
      return false;
    }
  }

  /**
   * VALIDAR SI EL USUARIO ES ADMIN
   */

  async esAdmin(usuarioId: string): Promise<boolean> {
    try {
      const usuarios = await this.firestore.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioId);
      return usuarios && usuarios.length > 0 && usuarios[0]?.rol === 'ADMIN';
    } catch (error) {
      return false;
    }
  }

  /**
   * OBTENER PERMISOS DEL USUARIO
   */

  async obtenerPermisosUsuario(usuarioId: string): Promise<string[]> {
    try {
      const usuarios = await this.firestore.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioId);

      if (!usuarios || usuarios.length === 0) {
        return [];
      }
      const usuario = usuarios[0];

      const rolDefinido = this.rolesDefinidos.get(usuario.rol);
      return rolDefinido?.permisos || [];
    } catch (error) {
      console.error('Error obteniendo permisos:', error);
      return [];
    }
  }

  /**
   * OBTENER PERMISOS POR RECURSO PARA UN ROL
   */

  obtenerPermisosRecursoParaRol(rol: string, recurso: string): string[] {
    const permisos = this.permisosRecurso.get(recurso);
    const rolePermiso = permisos?.find(p => p.role === rol);
    return rolePermiso?.permisos || [];
  }

  /**
   * CAMBIAR ROL DE USUARIO
   */

  async cambiarRolUsuario(usuarioId: string, usuarioObjetivoId: string, rolNuevo: string, usuarioCambia: string): Promise<boolean> {
    try {
      // Validar que quien cambia es ADMIN
      const esAdminCambia = await this.esAdmin(usuarioCambia);
      if (!esAdminCambia) {
        await this.audit.registrarAccesoDenegado(usuarioCambia, 'usuario', 'No es ADMIN para cambiar roles');
        return false;
      }

      // Validar que el rol nuevo existe
      if (!this.rolesDefinidos.has(rolNuevo)) {
        await this.audit.registrarOperacionFallida(usuarioCambia, 'usuarios', usuarioObjetivoId, 'CAMBIAR_ROL', 'Rol inválido');
        return false;
      }

      const usuariosObjetivo = await this.firestore.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioObjetivoId);
      if (!usuariosObjetivo || usuariosObjetivo.length === 0) {
        return false;
      }
      const usuarioObjetivo = usuariosObjetivo[0];
      const rolAnterior = usuarioObjetivo?.rol;

      // Actualizar rol
      await this.firestore.updateDocument('usuarios', usuarioObjetivoId, { rol: rolNuevo });

      // Registrar en auditoría
      await this.audit.registrarCambioPermiso(usuarioCambia, usuarioObjetivoId, rolAnterior, rolNuevo);

      return true;
    } catch (error) {
      console.error('Error cambiando rol:', error);
      return false;
    }
  }

  /**
   * OBTENER DEFINICIÓN COMPLETA DE ROLES
   */

  obtenerDefinicionRoles(): Map<string, RoleDefinition> {
    return this.rolesDefinidos;
  }

  /**
   * GENERAR MATRIZ DE PERMISOS
   */

  generarMatrizPermisos(): any {
    const matriz: any = {};

    const recursos = Array.from(this.permisosRecurso.keys());
    const roles = Array.from(this.rolesDefinidos.keys());

    roles.forEach(rol => {
      matriz[rol] = {};
      recursos.forEach(recurso => {
        const permisos = this.obtenerPermisosRecursoParaRol(rol, recurso);
        matriz[rol][recurso] = permisos;
      });
    });

    return matriz;
  }
}
