import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  
  // Carga de documentos
  documentoSeleccionado = {
    tipo: '',
    archivo: null as File | null
  };
  subiendo = false;

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef,
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

  abrirDetalle(tramite: any) {
    this.selectedTramite = tramite;
    this.documentoSeleccionado = { tipo: '', archivo: null };
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

    const tramiteId = this.selectedTramite.id || this.selectedTramite.codigoUnico;
    this.subiendo = true;

    console.log(`[gestor-dash] Subiendo documento tipo=${this.documentoSeleccionado.tipo} para tramite=${tramiteId}`);

    this.documentosHttp.subirArchivo(tramiteId, this.documentoSeleccionado.archivo, this.documentoSeleccionado.tipo).subscribe({
      next: () => {
        alert('Documento subido correctamente');
        this.cargarDatos();
        this.documentoSeleccionado = { tipo: '', archivo: null };
        this.subiendo = false;
        // Reabrir modal con datos actualizados
        const tramiteActualizado = this.datosGestor?.tramitesEnValidacion.find(
          t => (t.id || t.codigoUnico) === tramiteId
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
    const tramiteId = tramite.id || tramite.codigoUnico;
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

    const tramiteId = tramite.id || tramite.codigoUnico;
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

    const tramiteId = tramite.id || tramite.codigoUnico;
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
