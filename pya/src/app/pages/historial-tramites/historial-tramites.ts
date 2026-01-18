import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TramitesHttpService } from '../../services/tramites-http.service';

interface TramiteHistorial {
  id: string;
  codigoUnico: string;
  estudiante?: {
    nombreCompleto: string;
    cedula: string;
  };
  motivo: string;
  estadoCaso: string;
  fechaRegistro: Date;
  fechaCierre?: Date;
  montoAprobado?: number;
  respuestaAseguradora?: {
    aprobado: boolean;
    observaciones?: string;
  };
  seleccionado?: boolean; // Para efectos visuales
}

@Component({
  selector: 'app-historial-tramites',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './historial-tramites.html'
})
export class HistorialTramitesComponent implements OnInit {
  tramites: TramiteHistorial[] = [];
  tramitesFiltrados: TramiteHistorial[] = [];
  cargando = true;
  role = '';
  
  // Filtros
  filtroEstado: 'todos' | 'aprobados' | 'rechazados' = 'todos';
  filtroTermino = '';
  filtroFechaInicio = '';
  filtroFechaFin = '';

  get homeLink(): string {
    return this.role === 'CLIENTE' ? '/cliente-inicio' : '/gestor-dashboard';
  }

  constructor(
    private tramitesHttp: TramitesHttpService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.role = (localStorage.getItem('role') || localStorage.getItem('userRole') || '').toUpperCase();
    await this.cargarTramites();
  }

  async cargarTramites() {
    this.cargando = true;
    try {
      // Usamos firstValueFrom para manejar la suscripción de forma limpia
      const data: any = await firstValueFrom(this.tramitesHttp.listar());
      
      // Filtrar solo trámites cerrados (aprobados o rechazados)
      this.tramites = data.filter((t: any) => {
        const estado = (t.estadoCaso || '').toLowerCase();
        return estado === 'aprobado' || estado === 'rechazado';
      }).map((t: any) => ({
        ...t,
        seleccionado: false,
        fechaRegistro: this.convertirFecha(t.fechaRegistro),
        fechaCierre: t.fechaCierre ? this.convertirFecha(t.fechaCierre) : undefined
      }));
      
      // Ordenar por fecha de cierre más reciente
      this.tramites.sort((a, b) => {
        const fechaA = a.fechaCierre || a.fechaRegistro;
        const fechaB = b.fechaCierre || b.fechaRegistro;
        return fechaB.getTime() - fechaA.getTime();
      });
      
      this.aplicarFiltros();
    } catch (error) {
      console.error('Error cargando trámites:', error);
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date();
    if (fecha instanceof Date) return fecha;
    if (fecha._seconds) return new Date(fecha._seconds * 1000);
    if (typeof fecha === 'string') return new Date(fecha);
    return new Date();
  }

  aplicarFiltros() {
    let resultado = [...this.tramites];

    // Filtro por estado
    if (this.filtroEstado === 'aprobados') {
      resultado = resultado.filter(t => (t.estadoCaso || '').toLowerCase() === 'aprobado');
    } else if (this.filtroEstado === 'rechazados') {
      resultado = resultado.filter(t => (t.estadoCaso || '').toLowerCase() === 'rechazado');
    }

    // Filtro por término de búsqueda
    if (this.filtroTermino) {
      const termino = this.filtroTermino.toLowerCase();
      resultado = resultado.filter(t => 
        (t.codigoUnico || '').toLowerCase().includes(termino) ||
        (t.estudiante?.nombreCompleto || '').toLowerCase().includes(termino) ||
        (t.estudiante?.cedula || '').toLowerCase().includes(termino) ||
        (t.motivo || '').toLowerCase().includes(termino)
      );
    }

    // Filtro por rango de fechas
    if (this.filtroFechaInicio) {
      const fechaInicio = new Date(this.filtroFechaInicio);
      fechaInicio.setHours(0, 0, 0, 0);
      resultado = resultado.filter(t => (t.fechaCierre || t.fechaRegistro) >= fechaInicio);
    }

    if (this.filtroFechaFin) {
      const fechaFin = new Date(this.filtroFechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      resultado = resultado.filter(t => (t.fechaCierre || t.fechaRegistro) <= fechaFin);
    }

    this.tramitesFiltrados = resultado;
    this.cdr.markForCheck();
  }

  // Getters para los KPIs del Dashboard
  get totalAprobados(): number {
    return this.tramites.filter(t => (t.estadoCaso || '').toLowerCase() === 'aprobado').length;
  }

  get totalRechazados(): number {
    return this.tramites.filter(t => (t.estadoCaso || '').toLowerCase() === 'rechazado').length;
  }

  get montoTotalAprobado(): number {
    return this.tramites
      .filter(t => (t.estadoCaso || '').toLowerCase() === 'aprobado')
      .reduce((sum, t) => sum + (t.montoAprobado || 0), 0);
  }
}