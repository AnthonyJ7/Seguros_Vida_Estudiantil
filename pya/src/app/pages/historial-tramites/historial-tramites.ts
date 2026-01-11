import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
}

@Component({
  selector: 'app-historial-tramites',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-tramites.html',
  styleUrl: './historial-tramites.css',
})
export class HistorialTramitesComponent implements OnInit {
  tramites: TramiteHistorial[] = [];
  tramitesFiltrados: TramiteHistorial[] = [];
  cargando = true;
  
  // Filtros
  filtroEstado: 'todos' | 'aprobados' | 'rechazados' = 'todos';
  filtroTermino = '';
  filtroFechaInicio = '';
  filtroFechaFin = '';

  constructor(private tramitesHttp: TramitesHttpService) {}

  async ngOnInit() {
    await this.cargarTramites();
  }

  async cargarTramites() {
    this.cargando = true;
    try {
      this.tramitesHttp.listar().subscribe({
        next: (data) => {
          // Filtrar solo trámites cerrados (aprobados o rechazados)
          this.tramites = data.filter((t: any) => {
            const estado = (t.estadoCaso || '').toLowerCase();
            return estado === 'aprobado' || estado === 'rechazado';
          }).map((t: any) => ({
            ...t,
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
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error cargando trámites:', err);
          this.cargando = false;
        }
      });
    } catch (error) {
      console.error('Error:', error);
      this.cargando = false;
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
      resultado = resultado.filter(t => {
        const fecha = t.fechaCierre || t.fechaRegistro;
        return fecha >= fechaInicio;
      });
    }

    if (this.filtroFechaFin) {
      const fechaFin = new Date(this.filtroFechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      resultado = resultado.filter(t => {
        const fecha = t.fechaCierre || t.fechaRegistro;
        return fecha <= fechaFin;
      });
    }

    this.tramitesFiltrados = resultado;
  }

  getEstadoClase(estado: string): string {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower === 'aprobado') return 'bg-emerald-100 text-emerald-700';
    if (estadoLower === 'rechazado') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  }

  getEstadoIcono(estado: string): string {
    const estadoLower = (estado || '').toLowerCase();
    if (estadoLower === 'aprobado') return '✅';
    if (estadoLower === 'rechazado') return '❌';
    return '⏸️';
  }

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
