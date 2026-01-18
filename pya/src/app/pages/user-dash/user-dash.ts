import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { DashboardService, DashboardClienteData, DashboardGestorData } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { TramitesHttpService } from '../../services/tramites-http.service';

@Component({
  selector: 'app-user-dash',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-dash.html'
})
export class UserDashComponent implements OnInit {
  // Datos según rol
  datosCliente: DashboardClienteData | null = null;
  datosGestor: DashboardGestorData | null = null;
  cargando = true;
  rol: string = '';
  creando = false;
  errorCrear = '';
  nuevoTramite = {
    tipoTramite: '',
    motivo: '',
    descripcion: '',
    copagoCategoria: 'estudiante',
    montoFacturaReferencial: undefined as number | undefined
  };

  constructor(
    private dashboardService: DashboardService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private tramitesHttp: TramitesHttpService
  ) {}

  async ngOnInit() {
    this.rol = this.authService.getRole();
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando = true;
    const uid = localStorage.getItem('uid') || '';

    try {
      console.log('[user-dash] rol detectado:', this.rol, 'uid:', uid);
      if (this.rol === 'GESTOR') {
        this.datosGestor = await this.dashboardService.getDatosGestor();
        console.log('[user-dash] datos gestor', this.datosGestor);
      } else if (this.rol === 'CLIENTE') {
        this.datosCliente = await this.dashboardService.getDatosCliente(uid);
        console.log('[user-dash] datos cliente', this.datosCliente);
      } else {
        console.warn('Rol no reconocido:', this.rol);
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
    this.cargando = false;
    this.cdr.detectChanges();
  }

  async validarTramite(idTramite: string) {
    if (!confirm('¿Aprobar este trámite y cambiar su estado a VALIDADO?')) return;
    
    try {
      await this.tramitesHttp.validarTramite(idTramite).toPromise();
      alert('Trámite validado correctamente');
      await this.cargarDatos(); // Recargar
    } catch (error: any) {
      console.error('Error validando trámite:', error);
      alert('Error validando trámite: ' + (error?.error?.error || error?.message || 'Error desconocido'));
    }
  }

  async rechazarTramite(idTramite: string) {
    const motivo = prompt('Ingresa el motivo del rechazo:');
    if (!motivo) return;
    
    try {
      await this.tramitesHttp.rechazarTramite(idTramite, motivo).toPromise();
      alert('Trámite rechazado correctamente');
      await this.cargarDatos(); // Recargar
    } catch (error: any) {
      console.error('Error rechazando trámite:', error);
      alert('Error rechazando trámite: ' + (error?.error?.error || error?.message || 'Error desconocido'));
    }
  }

  navegarEstudiantes() {
    this.router.navigate(['/estudiantes']);
  }

  estadoCoberturaTexto(): string {
    if (!this.datosCliente) return 'Pendiente';
    const cobertura = this.datosCliente.estadoCobertura;
    if (typeof cobertura === 'number') return `$${cobertura.toFixed(2)}`;
    return cobertura || 'Pendiente';
  }

  badgeClass(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('valid')) return 'bg-amber-100 text-amber-700';
    if (e.includes('aprob')) return 'bg-emerald-100 text-emerald-700';
    if (e.includes('rechaz')) return 'bg-red-100 text-red-700';
    if (e.includes('observ')) return 'bg-orange-100 text-orange-700';
    return 'bg-slate-100 text-slate-700';
  }

  async crearTramiteRapido() {
    this.errorCrear = '';
    if (!this.datosCliente?.estudiante?.cedula) {
      this.errorCrear = 'No se encontró información del estudiante. Revisa que exista en Firestore.';
      return;
    }
    if (!this.nuevoTramite.tipoTramite) {
      this.errorCrear = 'Selecciona un tipo de seguro.';
      return;
    }
    if (!this.nuevoTramite.motivo.trim()) {
      this.errorCrear = 'Ingresa un motivo.';
      return;
    }

    try {
      this.creando = true;
      await this.tramitesHttp.crearTramite({
        cedulaEstudiante: this.datosCliente.estudiante.cedula,
        tipoTramite: this.nuevoTramite.tipoTramite,
        motivo: this.nuevoTramite.motivo,
        descripcion: this.nuevoTramite.descripcion,
        copagoCategoria: this.nuevoTramite.copagoCategoria as any,
        montoFacturaReferencial: this.nuevoTramite.montoFacturaReferencial,
      }).toPromise();
      await this.cargarDatos();
      this.nuevoTramite = { tipoTramite: '', motivo: '', descripcion: '', copagoCategoria: 'estudiante', montoFacturaReferencial: undefined };
    } catch (err: any) {
      this.errorCrear = err?.error?.error || err?.message || 'Error creando trámite';
    } finally {
      this.creando = false;
      this.cdr.detectChanges();
    }
  }
}
