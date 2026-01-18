import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { DocumentosHttpService } from '../../services/documentos-http.service';
import { firstValueFrom } from 'rxjs';

interface Aseguradora {
  id?: string;
  nombre: string;
  correoContacto: string;
  telefono?: string;
  direccion?: string;
  activa: boolean;
}

interface Tramite {
  id: string;
  codigoUnico: string;
  estadoCaso: string;
  tipoTramite: string;
  descripcion: string;
  fechaRegistro: any;
  idAseguradora?: string;
  motivoRechazo?: string;
  motivoRevisionAseguradora?: string;
  fechaAprobacion?: any;
  fechaRechazo?: any;
  fechaRevisionAseguradora?: any;
  aprobadoPor?: string;
  rechazadoPor?: string;
  aseguradoraRevisado?: boolean;
  estudiante?: {
    nombreCompleto: string;
    cedula: string;
  };
}

@Component({
  selector: 'app-aseguradoras',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aseguradoras.html',
  styleUrl: './aseguradoras.css',
})
export class AseguradorasPage implements OnInit {
  tramitesPendientes: Tramite[] = [];
  tramitesHistorial: Tramite[] = [];
  notificacionesPendientes: any[] = [];
  notificacionesRegistro: any[] = [];
  
  cargando = false;
  cargandoHistorial = false;
  cargandoNotificaciones = false;
  mensaje = '';
  error = '';
  motivoRechazo = '';
  tramiteSeleccionado: Tramite | null = null;
  mostrarHistorial = false;
  mostrarRegistroNotificaciones = false;
  marcandoNotificacionId: string | null = null;
  usuarioId: string | null = null;
  documentosPorTramite: Record<string, any[]> = {};
  documentosVisibles: Record<string, boolean> = {};
  documentosCargandoId: string | null = null;

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private documentosService: DocumentosHttpService
  ) {
    // Obtener el ID del usuario actual desde localStorage o desde el servicio
    this.usuarioId = localStorage.getItem('uid') || null;
    console.log('[aseguradoras] ID Usuario:', this.usuarioId);
  }

  async ngOnInit() {
    await this.cargarTramitesPendientes();
    await this.cargarHistorial();
    await this.cargarNotificaciones();
  }

  async cargarTramitesPendientes() {
    this.cargando = true;
    this.error = '';
    try {
      const todosTramites = await this.firestoreService.getDocuments('tramites');
      console.log('[aseguradoras] Total trámites obtenidos:', todosTramites.length);
      console.log('[aseguradoras] Trámites:', todosTramites);
      
      // Mostrar los estados únicos para debugging
      const estadosUnicos = [...new Set(todosTramites.map((t: any) => t.estadoCaso))];
      console.log('[aseguradoras] Estados únicos encontrados:', estadosUnicos);
      
      // Filtrar trámites que:
      // 1. No hayan sido revisados por aseguradoras (no tengan estado REVISADO_ASEGURADORA)
      // 2. Estén listos para ser revisados (ENVIADO_ASEGURADORA, EN_VALIDACION, etc)
      this.tramitesPendientes = todosTramites
        .filter((t: any) => {
          const estado = (t.estadoCaso || '').toLowerCase();
          // Excluir trámites ya revisados o con estados finales
          const esRevisado = estado === 'revisado_aseguradora';
          const esAprobado = estado === 'aprobado';
          const esRechazado = estado === 'rechazado';
          
          // Incluir si NO está revisado y tiene alguno de estos estados
          const incluyentes = estado.includes('enviado') || 
                             estado.includes('validacion') || 
                             estado === 'en_validacion' ||
                             estado.includes('revision');
          
          return !esRevisado && !esAprobado && !esRechazado && incluyentes;
        })
        .map((t: any) => ({
          ...t,
          fechaRegistro: this.convertirFecha(t.fechaRegistro),
          fechaIncidente: this.convertirFecha(t.fechaIncidente)
        }));
      
      console.log('[aseguradoras] Trámites filtrados:', this.tramitesPendientes.length);
    } catch (err: any) {
      this.error = 'Error cargando trámites: ' + (err?.message || 'Error desconocido');
      console.error('[aseguradoras] Error:', err);
    }
    this.cargando = false;
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date();
    if (fecha.toDate) return fecha.toDate(); // Timestamp de Firestore
    if (fecha instanceof Date) return fecha;
    if (typeof fecha === 'string') return new Date(fecha);
    return new Date();
  }

  async cargarHistorial() {
    this.cargandoHistorial = true;
    try {
      const todosTramites = await this.firestoreService.getDocuments('tramites');
      
      // Filtrar trámites ya revisados por aseguradoras o con estados finales
      this.tramitesHistorial = todosTramites
        .filter((t: any) => {
          const estado = (t.estadoCaso || '').toLowerCase();
          return estado === 'revisado_aseguradora' || 
                 estado === 'aprobado' || 
                 estado === 'rechazado' ||
                 estado === 'aprobado_aseguradora' ||
                 estado === 'rechazado_aseguradora';
        })
        .map((t: any) => ({
          ...t,
          fechaRegistro: this.convertirFecha(t.fechaRegistro),
          fechaIncidente: this.convertirFecha(t.fechaIncidente),
          fechaAprobacion: this.convertirFecha(t.fechaAprobacion),
          fechaRechazo: this.convertirFecha(t.fechaRechazo),
          fechaRevisionAseguradora: this.convertirFecha(t.fechaRevisionAseguradora)
        }))
        .sort((a: any, b: any) => {
          const fechaA = a.fechaRevisionAseguradora || a.fechaAprobacion || a.fechaRechazo || a.fechaRegistro;
          const fechaB = b.fechaRevisionAseguradora || b.fechaAprobacion || b.fechaRechazo || b.fechaRegistro;
          return fechaB.getTime() - fechaA.getTime();
        });
      
      console.log('[aseguradoras] Historial cargado:', this.tramitesHistorial.length);
    } catch (err: any) {
      console.error('[aseguradoras] Error cargando historial:', err);
    }
    this.cargandoHistorial = false;
  }

  toggleHistorial() {
    this.mostrarHistorial = !this.mostrarHistorial;
  }

  async toggleDocumentos(tramite: Tramite) {
    const id = tramite.id;
    console.log('[aseguradoras] Toggle documentos para trámite:', id, 'Código:', tramite.codigoUnico);
    const visible = !!this.documentosVisibles[id];
    if (!visible && !this.documentosPorTramite[id]) {
      console.log('[aseguradoras] Cargando documentos para:', id);
      await this.cargarDocumentosTramite(id);
    }
    this.documentosVisibles[id] = !visible;
    console.log('[aseguradoras] Estado visible:', this.documentosVisibles);
  }

  private toDate(v: any): Date | null {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (v.toDate) return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  async cargarDocumentosTramite(tramiteId: string) {
    this.documentosCargandoId = tramiteId;
    console.log('[aseguradoras] Solicitando documentos para tramiteId:', tramiteId);
    try {
      const docs = await firstValueFrom(this.documentosService.listarPorTramite(tramiteId));
      console.log('[aseguradoras] Documentos recibidos para', tramiteId, ':', docs);
      // Normalizar campos esperados por UI
      const normalizados = (docs || []).map((d: any) => ({
        idDocumento: d.idDocumento || d.id,
        tramiteId: d.tramiteId,
        tipo: d.tipo,
        nombreArchivo: d.nombreArchivo || d.nombre || 'Documento',
        url: d.urlArchivo || d.url,
        fechaCarga: this.toDate(d.fechaCarga || d.fechaSubida) || new Date(),
        validado: !!d.validado
      }));
      this.documentosPorTramite[tramiteId] = normalizados;
      console.log('[aseguradoras] Documentos normalizados guardados para', tramiteId, ':', normalizados);
    } catch (err) {
      console.error('[aseguradoras] Error cargando documentos:', err);
      this.documentosPorTramite[tramiteId] = [];
    } finally {
      this.documentosCargandoId = null;
    }
  }

  abrirModalRechazo(tramite: Tramite) {
    this.tramiteSeleccionado = tramite;
    this.motivoRechazo = '';
  }

  cerrarModal() {
    this.tramiteSeleccionado = null;
    this.motivoRechazo = '';
  }

  async aprobarTramite(tramite: Tramite) {
    if (!confirm('¿Está seguro de marcar este trámite como listo para aprobación?')) return;

    this.error = '';
    this.mensaje = '';

    try {
      // Actualizar estado a REVISADO_ASEGURADORA
      await this.firestoreService.updateDocument('tramites', tramite.id, {
        estadoCaso: 'REVISADO_ASEGURADORA',
        fechaRevisionAseguradora: new Date(),
        aseguradoraRevisado: true
      });

      // Crear notificación para el gestor para que apruebe
      await this.crearNotificacion(
        tramite.id,
        `Trámite ${tramite.codigoUnico} listo para aprobación`,
        `El trámite ${tramite.codigoUnico} ha sido revisado por la aseguradora y está listo para ser aprobado. Por favor, revise y apruebe en su dashboard.`,
        'LISTO_APROBACION'
      );

      this.mensaje = `Trámite movido a historial y notificación enviada al gestor`;
      await this.cargarTramitesPendientes();
      await this.cargarHistorial();
      setTimeout(() => this.mensaje = '', 3000);
    } catch (err: any) {
      this.error = 'Error procesando trámite: ' + (err?.message || 'Error desconocido');
      console.error('Error:', err);
    }
  }

  async rechazarTramite() {
    if (!this.tramiteSeleccionado) return;
    
    if (!this.motivoRechazo.trim()) {
      this.error = 'Debe proporcionar un motivo';
      return;
    }

    this.error = '';
    this.mensaje = '';

    try {
      // Actualizar estado a REVISADO_ASEGURADORA con motivo
      await this.firestoreService.updateDocument('tramites', this.tramiteSeleccionado.id, {
        estadoCaso: 'REVISADO_ASEGURADORA',
        fechaRevisionAseguradora: new Date(),
        aseguradoraRevisado: true,
        motivoRevisionAseguradora: this.motivoRechazo
      });

      // Crear notificación para el gestor para que corrija
      await this.crearNotificacion(
        this.tramiteSeleccionado.id,
        `Trámite ${this.tramiteSeleccionado.codigoUnico} requiere correcciones`,
        `La aseguradora ha indicado que el trámite ${this.tramiteSeleccionado.codigoUnico} requiere correcciones. Motivo: ${this.motivoRechazo}`,
        'REQUIERE_CORRECCIONES'
      );

      this.mensaje = `Trámite movido a historial y notificación de correcciones enviada al gestor`;
      await this.cargarTramitesPendientes();
      await this.cargarHistorial();
      this.cerrarModal();
      setTimeout(() => this.mensaje = '', 3000);
    } catch (err: any) {
      this.error = 'Error procesando notificación: ' + (err?.message || 'Error desconocido');
      console.error('Error:', err);
    }
  }

  async crearNotificacion(idTramite: string, titulo: string, mensaje: string, tipo: string) {
    try {
      await this.firestoreService.addDocument('notificaciones', {
        idTramite,
        titulo,
        mensaje,
        tipo,
        destinatario: 'UAGpe4hb4gXKsVEK97fn3MFQKK53',
        leida: false,
        fechaEnvio: new Date(),
        origen: 'ASEGURADORA'
      });
      console.log('[aseguradoras] Notificación creada para el gestor');
    } catch (err) {
      console.error('[aseguradoras] Error creando notificación:', err);
    }
  }

  getEstadoColor(estado: string): string {
    const estadoUpper = (estado || '').toUpperCase();
    if (estadoUpper.includes('VALIDACION')) return 'bg-amber-100 text-amber-700';
    if (estadoUpper.includes('APROBADO')) return 'bg-emerald-100 text-emerald-700';
    if (estadoUpper.includes('RECHAZADO')) return 'bg-red-100 text-red-700';
    if (estadoUpper.includes('CORRECCIONES')) return 'bg-orange-100 text-orange-700';
    return 'bg-slate-100 text-slate-700';
  }

  getTipoLabel(tipo: string): string {
    const tipos: Record<string, string> = {
      'SEGURO_VIDA': 'Seguro de Vida',
      'REEMBOLSO_MEDICO': 'Reembolso Médico',
      'ACCIDENTE': 'Accidente',
      'ENFERMEDAD': 'Enfermedad',
      'FALLECIMIENTO': 'Fallecimiento'
    };
    return tipos[tipo] || tipo;
  }

  async cargarNotificaciones() {
    this.cargandoNotificaciones = true;
    try {
      const notificaciones = await this.firestoreService.getDocuments('notificaciones');
      
      // Filtrar notificaciones destinadas a este usuario asegurador
      const miasNotificaciones = notificaciones
        .filter((n: any) => n.destinatario === this.usuarioId)
        .map((n: any) => ({
          ...n,
          fechaEnvio: this.convertirFecha(n.fechaEnvio)
        }))
        .sort((a: any, b: any) => (b.fechaEnvio as Date).getTime() - (a.fechaEnvio as Date).getTime());
      
      // Separar en pendientes (no leídas) y registro (todas)
      this.notificacionesPendientes = miasNotificaciones.filter((n: any) => !n.leida);
      this.notificacionesRegistro = miasNotificaciones;
      
      console.log('[aseguradoras] Notificaciones cargadas - Pendientes:', this.notificacionesPendientes.length, 'Total:', this.notificacionesRegistro.length);
    } catch (err: any) {
      console.error('[aseguradoras] Error cargando notificaciones:', err);
    }
    this.cargandoNotificaciones = false;
  }

  async marcarNotificacionLeida(notif: any) {
    const notifId = notif.id || notif.idNotificacion;
    
    if (!notifId) {
      console.error('No se puede marcar notificación sin ID');
      return;
    }
    
    this.marcandoNotificacionId = notifId;
    
    try {
      await this.firestoreService.updateDocument('notificaciones', notifId, {
        leida: true,
        fechaLectura: new Date()
      });
      
      console.log('[aseguradoras] Notificación marcada como leída');
      await this.cargarNotificaciones();
    } catch (err: any) {
      this.error = 'Error marcando notificación como leída: ' + (err?.message || 'Error desconocido');
      console.error('[aseguradoras] Error:', err);
    } finally {
      this.marcandoNotificacionId = null;
    }
  }

  toggleRegistroNotificaciones() {
    this.mostrarRegistroNotificaciones = !this.mostrarRegistroNotificaciones;
  }

  getEstadoNotificacion(notif: any): string {
    if (notif.leida) {
      return 'bg-slate-50 border-slate-200';
    }
    return 'bg-amber-50 border-amber-200';
  }

  getIconoNotificacion(notif: any): string {
    const tipo = (notif.tipo || '').toUpperCase();
    if (tipo.includes('DOCUMENTO')) return '📄';
    if (tipo.includes('APROBACION')) return '✅';
    if (tipo.includes('CORRECCIONES')) return '⚠️';
    return '📨';
  }

  trackByTramiteId(index: number, tramite: Tramite): string {
    return tramite.id;
  }
}
