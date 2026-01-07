import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';

/**
 * Interfaces para datos del dashboard
 */
export interface DashboardAdminData {
  totalUsuarios: number;
  totalEstudiantes: number;
  totalTramites: number;
  tramitesPorEstado: {
    enValidacion: number;
    aprobados: number;
    rechazados: number;
  };
  ultimasAuditorias: any[];
  aseguradoras: any[];
}

export interface DashboardClienteData {
  estudiante: any;
  misTramites: any[];
  misDocumentos: any[];
  misNotificaciones: any[];
  estadoCobertura: number;
}

export interface DashboardGestorData {
  tramitesEnValidacion: any[];
  documentosPendientes: any[];
  estudiantesActivos: number;
  tramitesHoy: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private firestore: FirestoreService) {}

  /**
   * Obtener datos del dashboard ADMIN
   */
  async getDatosAdmin(): Promise<DashboardAdminData> {
    try {
      // Obtener todos los datos necesarios en paralelo
      const [usuarios, estudiantes, tramites, auditorias, aseguradoras] = await Promise.all([
        this.firestore.getDocuments('usuarios'),
        this.firestore.getDocuments('estudiante'),
        this.firestore.getDocuments('tramites'),
        this.firestore.getDocuments('auditoria'),
        this.firestore.getDocuments('aseguradoras')
      ]);

      // Contar trámites por estado
      const tramitesPorEstado = {
        enValidacion: tramites.filter(t => t.estadoCaso === 'EN_VALIDACION').length,
        aprobados: tramites.filter(t => t.estadoCaso === 'APROBADO').length,
        rechazados: tramites.filter(t => t.estadoCaso === 'RECHAZADO').length
      };

      // Obtener últimas 5 auditorías
      const ultimasAuditorias = auditorias
        .sort((a, b) => {
          const dateA = this.convertirFecha(a.fechaHora);
          const dateB = this.convertirFecha(b.fechaHora);
          return dateB.getTime() - dateA.getTime();
        })
        .map(a => ({
          ...a,
          fechaHora: this.convertirFecha(a.fechaHora)
        }))
        .slice(0, 5);

      return {
        totalUsuarios: usuarios.length,
        totalEstudiantes: estudiantes.length,
        totalTramites: tramites.length,
        tramitesPorEstado,
        ultimasAuditorias,
        aseguradoras
      };
    } catch (error) {
      console.error('Error obteniendo datos admin:', error);
      return {
        totalUsuarios: 0,
        totalEstudiantes: 0,
        totalTramites: 0,
        tramitesPorEstado: { enValidacion: 0, aprobados: 0, rechazados: 0 },
        ultimasAuditorias: [],
        aseguradoras: []
      };
    }
  }

  /**
   * Obtener datos del dashboard CLIENTE
   */
  async getDatosCliente(uid: string): Promise<DashboardClienteData> {
    try {
      // Obtener estudiante del usuario
      const estudiantes = await this.firestore.getDocumentsWithCondition('estudiante', 'uidUsuario', '==', uid);
      const estudiante = estudiantes.length > 0 ? estudiantes[0] : null;
      // Obtener trámites del estudiante (si existe)
      const tramites = estudiante
        ? await this.firestore.getDocumentsWithCondition('tramites', 'idEstudiante', '==', estudiante.id)
        : [];

      // Obtener documentos asociados a los trámites del estudiante
      const todosDocs = await this.firestore.getDocuments('documentos');
      const idsTramites = new Set(tramites.map(t => t.id || t.codigoUnico));
      const documentos = todosDocs.filter(d => idsTramites.has(d.idTramite));

      // Obtener notificaciones del estudiante
      const notificaciones = estudiante
        ? await this.firestore.getDocumentsWithCondition('notificaciones', 'idEstudiante', '==', estudiante.id)
        : [];

      return {
        estudiante,
        misTramites: tramites.map(t => ({
          ...t,
          fechaRegistro: this.convertirFecha(t.fechaRegistro)
        })),
        misDocumentos: documentos.map(d => ({
          ...d,
          fechaCarga: this.convertirFecha(d.fechaCarga)
        })),
        misNotificaciones: notificaciones.sort((a, b) => {
          const dateA = this.convertirFecha(a.fechaEnvio);
          const dateB = this.convertirFecha(b.fechaEnvio);
          return dateB.getTime() - dateA.getTime();
        }),
        estadoCobertura: estudiante?.estadoCobertura || 0
      };
    } catch (error) {
      console.error('Error obteniendo datos cliente:', error);
      return {
        estudiante: null,
        misTramites: [],
        misDocumentos: [],
        misNotificaciones: [],
        estadoCobertura: 0
      };
    }
  }

  /**
   * Obtener datos del dashboard GESTOR
   */
  async getDatosGestor(): Promise<DashboardGestorData> {
    try {
      // Obtener todos los trámites
      const tramites = await this.firestore.getDocuments('tramites');
      
      // Filtrar trámites en validación
      const tramitesEnValidacion = tramites.filter(t => t.estadoCaso === 'EN_VALIDACION');

      // Obtener documentos
      const documentos = await this.firestore.getDocuments('documentos');

      // Obtener estudiantes activos
      const estudiantes = await this.firestore.getDocuments('estudiante');
      const estudiantesActivos = estudiantes.filter(e => e.estadoAcademico === 'ACTIVO').length;

      // Contar trámites de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const tramitesHoy = tramites.filter(t => {
        const fecha = this.convertirFecha(t.fechaRegistro);
        fecha.setHours(0, 0, 0, 0);
        return fecha.getTime() === hoy.getTime();
      }).length;

      return {
        tramitesEnValidacion: tramitesEnValidacion.map(t => ({
          ...t,
          fechaRegistro: this.convertirFecha(t.fechaRegistro)
        })),
        documentosPendientes: documentos.slice(0, 10), // Últimos 10
        estudiantesActivos,
        tramitesHoy
      };
    } catch (error) {
      console.error('Error obteniendo datos gestor:', error);
      return {
        tramitesEnValidacion: [],
        documentosPendientes: [],
        estudiantesActivos: 0,
        tramitesHoy: 0
      };
    }
  }

  /**
   * Obtener trámite con datos del estudiante
   */
  async getTramiteConEstudiante(idTramite: string): Promise<any> {
    try {
      const tramites = await this.firestore.getDocumentsWithCondition('tramites', 'id', '==', idTramite);
      if (tramites.length === 0) return null;

      const tramite = tramites[0];
      
      // Obtener estudiante
      const estudiantes = await this.firestore.getDocumentsWithCondition('estudiante', 'id', '==', tramite.idEstudiante);
      const estudiante = estudiantes.length > 0 ? estudiantes[0] : null;

      return {
        ...tramite,
        nombreEstudiante: estudiante?.nombreCompleto || 'N/A',
        cedulaEstudiante: estudiante?.cedula || 'N/A'
      };
    } catch (error) {
      console.error('Error obteniendo trámite con estudiante:', error);
      return null;
    }
  }

  /**
   * Obtener trámite con datos de aseguradora
   */
  async getTramiteConAseguradora(idTramite: string): Promise<any> {
    try {
      const tramites = await this.firestore.getDocumentsWithCondition('tramites', 'id', '==', idTramite);
      if (tramites.length === 0) return null;

      const tramite = tramites[0];
      
      // Obtener aseguradora
      const aseguradoras = await this.firestore.getDocumentsWithCondition('aseguradoras', 'id', '==', tramite.idAseguradora);
      const aseguradora = aseguradoras.length > 0 ? aseguradoras[0] : null;

      return {
        ...tramite,
        nombreAseguradora: aseguradora?.nombre || 'N/A',
        contactoAseguradora: aseguradora?.correoContacto || 'N/A'
      };
    } catch (error) {
      console.error('Error obteniendo trámite con aseguradora:', error);
      return null;
    }
  }

  /**
   * Helper: Convertir Timestamp de Firestore a Date
   */
  private convertirFecha(fecha: any): Date {
    if (!fecha) return new Date();
    if (fecha.toDate) return fecha.toDate();
    if (typeof fecha === 'string') {
      const parsed = new Date(fecha);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return fecha instanceof Date && !isNaN(fecha.getTime()) ? fecha : new Date();
  }
}
