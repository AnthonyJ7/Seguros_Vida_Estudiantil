import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, DashboardAdminData } from '../../services/dashboard.service';

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dash.html',
  styleUrl: './admin-dash.css',
})
export class AdminDashComponent implements OnInit {
  datosAdmin: DashboardAdminData | null = null;
  cargando = true;

  config = {
    diasGracia: 15,
    limiteDocumentosHoras: 48
  };

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargarDatos();
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
}
