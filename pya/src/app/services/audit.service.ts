import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';

/**
 * SERVICIO DE AUDITORÍA Y LOGS
 * Registra todas las operaciones críticas del sistema
 */

export interface AuditLog {
  id?: string;
  timestamp: Date;
  usuario: string;
  accion: string;
  entidad: string;
  idEntidad: string;
  antes?: any;
  despues?: any;
  resultado: 'EXITOSO' | 'FALLIDO';
  razon?: string;
  ipAddress?: string;
  userAgent?: string;
  detalles?: any;
}

export interface SeguridadLog {
  id?: string;
  timestamp: Date;
  tipo: 'LOGIN' | 'LOGOUT' | 'INTENTO_FALLIDO' | 'ACCESO_DENEGADO' | 'CAMBIO_PERMISO';
  usuario: string;
  detalles: string;
  ipAddress?: string;
  resultado: 'EXITOSO' | 'FALLIDO';
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  constructor(private firestore: FirestoreService) {}

  /**
   * REGISTRAR OPERACIONES EN AUDITORÍA
   */

  async registrarCreacion(usuario: string, entidad: string, idEntidad: string, datos: any, detalles?: any): Promise<void> {
    const log: AuditLog = {
      timestamp: new Date(),
      usuario,
      accion: 'CREAR',
      entidad,
      idEntidad,
      despues: datos,
      resultado: 'EXITOSO',
      detalles
    };

    await this.guardarAuditLog(log);
  }

  async registrarActualizacion(usuario: string, entidad: string, idEntidad: string, antes: any, despues: any, detalles?: any): Promise<void> {
    const log: AuditLog = {
      timestamp: new Date(),
      usuario,
      accion: 'ACTUALIZAR',
      entidad,
      idEntidad,
      antes,
      despues,
      resultado: 'EXITOSO',
      detalles
    };

    await this.guardarAuditLog(log);
  }

  async registrarEliminacion(usuario: string, entidad: string, idEntidad: string, datosEliminados: any, detalles?: any): Promise<void> {
    const log: AuditLog = {
      timestamp: new Date(),
      usuario,
      accion: 'ELIMINAR',
      entidad,
      idEntidad,
      antes: datosEliminados,
      resultado: 'EXITOSO',
      detalles
    };

    await this.guardarAuditLog(log);
  }

  async registrarOperacionFallida(usuario: string, entidad: string, idEntidad: string, accion: string, razon: string, detalles?: any): Promise<void> {
    const log: AuditLog = {
      timestamp: new Date(),
      usuario,
      accion,
      entidad,
      idEntidad,
      resultado: 'FALLIDO',
      razon,
      detalles
    };

    await this.guardarAuditLog(log);
  }

  private async guardarAuditLog(log: AuditLog): Promise<void> {
    try {
      await this.firestore.addDocument('auditoria', log);
    } catch (error) {
      console.error('Error guardando log de auditoría:', error);
    }
  }

  /**
   * REGISTRAR EVENTOS DE SEGURIDAD
   */

  async registrarLogin(usuario: string, exitoso: boolean, razon?: string): Promise<void> {
    const log: SeguridadLog = {
      timestamp: new Date(),
      tipo: 'LOGIN',
      usuario,
      detalles: exitoso ? 'Login exitoso' : `Login fallido: ${razon || 'Credenciales inválidas'}`,
      resultado: exitoso ? 'EXITOSO' : 'FALLIDO',
      ipAddress: this.obtenerIPLocal()
    };

    await this.guardarSeguridadLog(log);
  }

  async registrarLogout(usuario: string): Promise<void> {
    const log: SeguridadLog = {
      timestamp: new Date(),
      tipo: 'LOGOUT',
      usuario,
      detalles: 'Usuario cerró sesión',
      resultado: 'EXITOSO',
      ipAddress: this.obtenerIPLocal()
    };

    await this.guardarSeguridadLog(log);
  }

  async registrarIntentofallido(usuario: string, razon: string): Promise<void> {
    const log: SeguridadLog = {
      timestamp: new Date(),
      tipo: 'INTENTO_FALLIDO',
      usuario,
      detalles: razon,
      resultado: 'FALLIDO',
      ipAddress: this.obtenerIPLocal()
    };

    await this.guardarSeguridadLog(log);
  }

  async registrarAccesoDenegado(usuario: string, recurso: string, razon: string): Promise<void> {
    const log: SeguridadLog = {
      timestamp: new Date(),
      tipo: 'ACCESO_DENEGADO',
      usuario,
      detalles: `Acceso denegado a ${recurso}: ${razon}`,
      resultado: 'FALLIDO',
      ipAddress: this.obtenerIPLocal()
    };

    await this.guardarSeguridadLog(log);
  }

  async registrarCambioPermiso(usuario: string, usuarioAfectado: string, permisoAnterior: string, permisoNuevo: string): Promise<void> {
    const log: SeguridadLog = {
      timestamp: new Date(),
      tipo: 'CAMBIO_PERMISO',
      usuario,
      detalles: `Cambio de permiso para ${usuarioAfectado}: ${permisoAnterior} -> ${permisoNuevo}`,
      resultado: 'EXITOSO'
    };

    await this.guardarSeguridadLog(log);
  }

  private async guardarSeguridadLog(log: SeguridadLog): Promise<void> {
    try {
      await this.firestore.addDocument('seguridad_logs', log);
    } catch (error) {
      console.error('Error guardando log de seguridad:', error);
    }
  }

  /**
   * OBTENER REGISTROS DE AUDITORÍA
   */

  async obtenerAuditoriaPorEntidad(entidad: string, idEntidad: string): Promise<AuditLog[]> {
    const logs = await this.firestore.getDocumentsWithCondition('auditoria', 'entidad', '==', entidad);
    return logs.filter(log => log.idEntidad === idEntidad).sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
  }

  async obtenerAuditoriaDelUsuario(usuario: string, dias: number = 30): Promise<AuditLog[]> {
    const hace_n_dias = new Date();
    hace_n_dias.setDate(hace_n_dias.getDate() - dias);

    const logs = await this.firestore.getDocumentsWithCondition('auditoria', 'usuario', '==', usuario);
    return logs.filter(log => new Date(log.timestamp) > hace_n_dias).sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
  }

  async obtenerOperacionesRecientes(limite: number = 50): Promise<AuditLog[]> {
    const logs = await this.firestore.getDocuments('auditoria');
    return logs.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    }).slice(0, limite);
  }

  async obtenerOperacionesPorRango(fechaInicio: Date, fechaFin: Date): Promise<AuditLog[]> {
    const logs = await this.firestore.getDocuments('auditoria');
    return logs.filter(log => {
      const fecha = new Date(log.timestamp);
      return fecha >= fechaInicio && fecha <= fechaFin;
    }).sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
  }

  /**
   * ESTADÍSTICAS DE AUDITORÍA
   */

  async obtenerEstadisticasAuditoria(): Promise<any> {
    const logs = await this.firestore.getDocuments('auditoria');
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    const logsHoy = logs.filter(log => {
      const fecha = new Date(log.timestamp);
      return fecha.toDateString() === hoy.toDateString();
    });

    const operacionesPorAccion: any = {};
    const operacionesPorEntidad: any = {};

    logs.forEach(log => {
      operacionesPorAccion[log.accion] = (operacionesPorAccion[log.accion] || 0) + 1;
      operacionesPorEntidad[log.entidad] = (operacionesPorEntidad[log.entidad] || 0) + 1;
    });

    return {
      totalOperaciones: logs.length,
      operacionesHoy: logsHoy.length,
      operacionesPorAccion,
      operacionesPorEntidad,
      operacionesFallidas: logs.filter(log => log.resultado === 'FALLIDO').length
    };
  }

  /**
   * OBTENER IP LOCAL (simulado para navegador)
   */

  private obtenerIPLocal(): string {
    return 'CLIENT_IP';
  }

  /**
   * GENERAR REPORTE DE AUDITORÍA
   */

  async generarReporteDiario(): Promise<string> {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(hoy);
    fin.setHours(23, 59, 59, 999);

    const operaciones = await this.obtenerOperacionesPorRango(inicio, fin);
    const seguridad = await this.firestore.getDocuments('seguridad_logs');
    const seguridadHoy = seguridad.filter(log => {
      const fecha = new Date(log.timestamp);
      return fecha >= inicio && fecha <= fin;
    });

    let reporte = `
╔════════════════════════════════════════════════════════════════╗
║                   REPORTE DE AUDITORÍA DIARIO                  ║
║                  ${hoy.toLocaleDateString()}                      ║
╚════════════════════════════════════════════════════════════════╝

RESUMEN EJECUTIVO
─────────────────
Total de Operaciones: ${operaciones.length}
Operaciones Exitosas: ${operaciones.filter(o => o.resultado === 'EXITOSO').length}
Operaciones Fallidas: ${operaciones.filter(o => o.resultado === 'FALLIDO').length}
Eventos de Seguridad: ${seguridadHoy.length}

OPERACIONES POR TIPO
──────────────────`;

    const opsPorAccion: any = {};
    operaciones.forEach(op => {
      opsPorAccion[op.accion] = (opsPorAccion[op.accion] || 0) + 1;
    });

    Object.entries(opsPorAccion).forEach(([accion, count]) => {
      reporte += `\n${accion}: ${count}`;
    });

    reporte += `\n\nOPERACIONES POR ENTIDAD\n──────────────────`;

    const opsPorEntidad: any = {};
    operaciones.forEach(op => {
      opsPorEntidad[op.entidad] = (opsPorEntidad[op.entidad] || 0) + 1;
    });

    Object.entries(opsPorEntidad).forEach(([entidad, count]) => {
      reporte += `\n${entidad}: ${count}`;
    });

    reporte += `\n\nEVENTOS DE SEGURIDAD\n──────────────────`;

    const eventsPorTipo: any = {};
    seguridadHoy.forEach(event => {
      eventsPorTipo[event.tipo] = (eventsPorTipo[event.tipo] || 0) + 1;
    });

    Object.entries(eventsPorTipo).forEach(([tipo, count]) => {
      reporte += `\n${tipo}: ${count}`;
    });

    reporte += `\n\nOPERACIONES FALLIDAS\n───────────────────`;
    operaciones.filter(o => o.resultado === 'FALLIDO').forEach(op => {
      reporte += `\n• ${op.accion} en ${op.entidad}: ${op.razon || 'Sin detalles'}`;
    });

    return reporte;
  }

  /**
   * EXPORTAR AUDITORÍA A CSV
   */

  async exportarAuditoriaCsv(fechaInicio: Date, fechaFin: Date): Promise<string> {
    const logs = await this.obtenerOperacionesPorRango(fechaInicio, fechaFin);

    let csv = 'TIMESTAMP,USUARIO,ACCION,ENTIDAD,ID_ENTIDAD,RESULTADO,RAZON\n';

    logs.forEach(log => {
      csv += `"${log.timestamp}","${log.usuario}","${log.accion}","${log.entidad}","${log.idEntidad}","${log.resultado}","${log.razon || ''}"\n`;
    });

    return csv;
  }
}
