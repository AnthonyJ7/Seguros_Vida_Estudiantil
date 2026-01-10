import { Component, OnInit, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, DashboardAdminData } from '../../services/dashboard.service';
import { FirestoreService } from '../../services/firestore.service';
import { ReglasNegocio } from '../../components/reglas-negocio/reglas-negocio';

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [CommonModule, FormsModule, ReglasNegocio],
  templateUrl: './admin-dash.html',
  styleUrl: './admin-dash.css',
})
export class AdminDashComponent implements OnInit, AfterViewInit {
  @ViewChild(ReglasNegocio) reglasComponent!: ReglasNegocio;

  datosAdmin: DashboardAdminData | null = null;
  notificacionesDocumentos: any[] = [];
  cargando = true;
  cargandoNotificaciones = false;

  config = {
    diasGracia: 15,
    limiteDocumentosHoras: 48
  };

  constructor(
    private dashboardService: DashboardService,
    private firestoreService: FirestoreService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
    await this.cargarNotificacionesDocumentos();
  }

  ngAfterViewInit() {
    // Activar modo solo lectura en el componente de reglas
    if (this.reglasComponent) {
      this.reglasComponent.setSoloLectura(true);
    }
  }

  async cargarDatos() {
    this.cargando = true;
    try {
      this.datosAdmin = await this.dashboardService.getDatosAdmin();
      console.log('[admin-dash] datos admin', this.datosAdmin);
    } catch (error) {
      console.error('Error cargando datos del admin dashboard:', error);
    }
    this.cargando = false;
    this.cdr.detectChanges();
  }

  async cargarNotificacionesDocumentos() {
    this.cargandoNotificaciones = true;
    try {
      const notificaciones = await this.firestoreService.getDocuments('notificaciones');
      
      // Filtrar notificaciones de tipo DOCUMENTO_SUBIDO y mostrar solo las más recientes
      this.notificacionesDocumentos = notificaciones
        .filter((n: any) => n.tipo === 'DOCUMENTO_SUBIDO')
        .map((n: any) => ({
          ...n,
          fechaEnvio: this.convertirFecha(n.fechaEnvio)
        }))
        .sort((a: any, b: any) => (b.fechaEnvio as Date).getTime() - (a.fechaEnvio as Date).getTime())
        .slice(0, 10); // Solo las 10 más recientes
      
      console.log('[admin-dash] Notificaciones de documentos:', this.notificacionesDocumentos.length);
    } catch (err: any) {
      console.error('[admin-dash] Error cargando notificaciones:', err);
    }
    this.cargandoNotificaciones = false;
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date();
    if (fecha.toDate) return fecha.toDate(); // Timestamp de Firestore
    if (fecha instanceof Date) return fecha;
    if (typeof fecha === 'string') return new Date(fecha);
    return new Date();
  }

  getAseguradoraInfo(aseguradora: any): string {
    return `${aseguradora.nombre || 'N/A'} - ${aseguradora.correoContacto || 'sin contacto'}`;
  }
}
