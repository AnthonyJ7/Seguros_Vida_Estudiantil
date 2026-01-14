import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService, DashboardGestorData } from '../../services/dashboard.service';
import { TramitesHttpService } from '../../services/tramites-http.service';
import { DocumentosHttpService } from '../../services/documentos-http.service';
import { NotificacionesHttpService } from '../../services/notificaciones-http.service';

@Component({
  selector: 'app-gestor-dash',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestor-dash.html',
  styleUrl: './gestor-dash.css',
})
export class GestorDashComponent implements OnInit {
  datosGestor: DashboardGestorData | null = null;
  cargando = true;
  filtroTermino = '';
  filtroFecha = '';
  selectedTramite: any | null = null;
  procesandoId: string | null = null;
  marcandoNotificacionId: string | null = null;
  notificacionesColapsadas = true; // Colapsadas por defecto
  
  // Carga de documentos
  documentoSeleccionado = {
    tipo: '',
    archivo: null as File | null
  };
  subiendo = false;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private tramitesHttp: TramitesHttpService,
    private documentosHttp: DocumentosHttpService,
    private notificacionesHttp: NotificacionesHttpService
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      this.datosGestor = await this.dashboardService.getDatosGestor();
      console.log('[gestor-dash] datos gestor', this.datosGestor);
    } catch (error) {
      console.error('Error cargando datos del gestor dashboard:', error);
    }
    this.cargando = false;
    this.cdr.detectChanges();
  }

  getTramitesFiltrados(): any[] {
    const lista = this.datosGestor?.tramitesEnValidacion || [];
    const termino = (this.filtroTermino || '').toLowerCase();
    const fecha = this.filtroFecha ? new Date(this.filtroFecha) : null;
    return lista.filter(t => {
      const matchTerm = !termino || (
        (t.codigoUnico || '').toLowerCase().includes(termino) ||
        (t.estudiante?.cedula || '').toLowerCase().includes(termino) ||
        (t.estudiante?.nombreCompleto || '').toLowerCase().includes(termino)
      );
      const matchFecha = !fecha || (() => {
        const d = new Date(t.fechaRegistro);
        d.setHours(0,0,0,0);
        const f = new Date(fecha);
        f.setHours(0,0,0,0);
        return d.getTime() === f.getTime();
      })();
      return matchTerm && matchFecha;
    });
  }

  getUltimasNotificaciones(): any[] {
    const lista = (this.datosGestor?.notificacionesPendientes || []).slice();
    lista.sort((a, b) => {
      const ta = a?.fechaEnvio ? new Date(a.fechaEnvio).getTime() : 0;
      const tb = b?.fechaEnvio ? new Date(b.fechaEnvio).getTime() : 0;
      return tb - ta; // más recientes primero
    });
    return lista.slice(0, 4);
  }

  abrirDetalle(tramite: any) {
    this.selectedTramite = tramite;
    this.documentoSeleccionado = { tipo: '', archivo: null };
  }

  async abrirDetallePorNotificacion(notif: any) {
    const id = notif?.tramiteId || notif?.tramite || notif?.tramiteId;
    if (!id) {
      alert('No hay trámite asociado a esta notificación');
      return;
    }

    // Buscar localmente
    const local = this.datosGestor?.tramitesEnValidacion?.find(t => t.id === id || t.codigoUnico === id);
    if (local) {
      this.abrirDetalle(local);
      return;
    }

    // Si no está local, obtener desde el servicio
    try {
      this.cargando = true;
      const tramite = await this.dashboardService.getTramiteConEstudiante(id);
      if (tramite) {
        this.selectedTramite = {
          ...tramite,
          estudiante: { nombreCompleto: tramite.nombreEstudiante, cedula: tramite.cedulaEstudiante }
        };
        this.documentoSeleccionado = { tipo: '', archivo: null };
      } else {
        alert('No se encontró el trámite asociado a la notificación');
      }
    } catch (err) {
      console.error('Error obteniendo trámite por notificación:', err);
      alert('Error al obtener el trámite');
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  marcarNotificacionLeida(notif: any) {
    const id = notif?.idNotificacion || notif?.id;
    if (!id) return;
    this.marcandoNotificacionId = id;

    this.notificacionesHttp.marcarLeida(id).subscribe({
      next: () => {
        this.cargarDatos();
        this.marcandoNotificacionId = null;
      },
      error: (err) => {
        console.error('Error marcando notificación como leída:', err);
        alert('No se pudo marcar la notificación');
        this.marcandoNotificacionId = null;
      }
    });
  }

  irANotificaciones() {
    this.router.navigate(['../notificaciones']);
  }

  cerrarDetalle() {
    this.selectedTramite = null;
    this.documentoSeleccionado = { tipo: '', archivo: null };
  }

  onDocumentoChange(event: any) {
    const f: File | undefined = event?.target?.files?.[0];
    this.documentoSeleccionado.archivo = f || null;
  }

  subirDocumento() {
    if (!this.selectedTramite || !this.documentoSeleccionado.archivo || !this.documentoSeleccionado.tipo) {
      alert('Por favor selecciona tipo de documento y archivo');
      return;
    }

    // IMPORTANTE: Usar el ID de Firestore del trámite, NO el codigoUnico
    const tramiteId = this.selectedTramite.id;
    
    if (!tramiteId) {
      console.error('[gestor-dash] Error: El trámite no tiene ID de Firestore', this.selectedTramite);
      alert('Error: El trámite seleccionado no tiene un ID válido');
      return;
    }
    
    this.subiendo = true;

    console.log(`[gestor-dash] Subiendo documento tipo=${this.documentoSeleccionado.tipo} para tramite ID=${tramiteId}, codigo=${this.selectedTramite.codigoUnico}`);

    this.documentosHttp.subirArchivo(tramiteId, this.documentoSeleccionado.archivo, this.documentoSeleccionado.tipo).subscribe({
      next: () => {
        alert('Documento subido correctamente');
        this.cargarDatos();
        this.documentoSeleccionado = { tipo: '', archivo: null };
        this.subiendo = false;
        // Reabrir modal con datos actualizados
        const tramiteActualizado = this.datosGestor?.tramitesEnValidacion.find(
          t => t.id === tramiteId
        );
        if (tramiteActualizado) {
          this.selectedTramite = tramiteActualizado;
        }
      },
      error: (err) => {
        console.error('Error subiendo documento:', err);
        alert('Error al subir documento: ' + (err?.error?.error || err?.message || 'Error desconocido'));
        this.subiendo = false;
      }
    });
  }

  validar(tramite: any) {
    const tramiteId = tramite.id;
    if (!tramiteId) {
      console.error('[gestor-dash] Error: Trámite sin ID', tramite);
      alert('Error: Trámite sin ID válido');
      return;
    }
    this.procesandoId = tramiteId;
    
    this.tramitesHttp.validarTramite(tramiteId).subscribe({
      next: () => {
        this.cargarDatos();
        this.procesandoId = null;
        this.cerrarDetalle();
      },
      error: (err) => {
        console.error('Error al validar trámite:', err);
        alert('Error al validar el trámite');
        this.procesandoId = null;
      }
    });
  }

  aprobar(tramite: any) {
    const montoAprobado = prompt('Ingrese el monto aprobado (ej: 50000):');
    if (!montoAprobado || isNaN(Number(montoAprobado))) {
      alert('Monto inválido');
      return;
    }

    const tramiteId = tramite.id;
    if (!tramiteId) {
      console.error('[gestor-dash] Error: Trámite sin ID', tramite);
      alert('Error: Trámite sin ID válido');
      return;
    }
    this.procesandoId = tramiteId;
    
    this.tramitesHttp.aprobarTramite(tramiteId, Number(montoAprobado)).subscribe({
      next: () => {
        alert('Trámite aprobado exitosamente');
        this.cargarDatos();
        this.procesandoId = null;
        this.cerrarDetalle();
      },
      error: (err) => {
        console.error('Error al aprobar trámite:', err);
        alert('Error al aprobar el trámite: ' + (err?.error?.error || 'Error desconocido'));
        this.procesandoId = null;
      }
    });
  }

  rechazar(tramite: any) {
    const descripcion = prompt('Ingrese el motivo del rechazo:');
    if (!descripcion || descripcion.trim() === '') {
      alert('Debe proporcionar un motivo');
      return;
    }

    const tramiteId = tramite.id;
    if (!tramiteId) {
      console.error('[gestor-dash] Error: Trámite sin ID', tramite);
      alert('Error: Trámite sin ID válido');
      return;
    }
    this.procesandoId = tramiteId;
    
    this.tramitesHttp.solicitarCorrecciones(tramiteId, descripcion).subscribe({
      next: () => {
        alert('Trámite rechazado. Se solicitaron correcciones');
        this.cargarDatos();
        this.procesandoId = null;
        this.cerrarDetalle();
      },
      error: (err) => {
        console.error('Error al rechazar trámite:', err);
        alert('Error al rechazar el trámite');
        this.procesandoId = null;
      }
    });
  }
}
