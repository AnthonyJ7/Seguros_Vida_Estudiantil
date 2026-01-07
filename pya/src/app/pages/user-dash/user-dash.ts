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
}
