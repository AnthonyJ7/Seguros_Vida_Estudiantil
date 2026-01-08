import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstudiantesHttpService } from '../../services/estudiantes-http.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css'
})
export class EstudiantesPage implements OnInit, OnDestroy {
  estudiantes: any[] = [];
  cargandoLista = false;
  guardando = false;
  actualizandoId: string | null = null;
  autoRefresh = true;
  ultimaActualizacion: Date | null = null;
  rol: string = '';

  cedulaElegibilidad = '';
  resultadoElegibilidad = '';

  nuevoEstudiante = {
    uidUsuario: '',
    cedula: '',
    nombreCompleto: '',
    periodoAcademico: '',
    estadoAcademico: 'activo',
    estadoCobertura: 'vigente'
  };

  estadoNuevo: Record<string, string> = {};
  borrandoId: string | null = null;

  private refreshSubscription?: Subscription;

  constructor(
    private estudiantesHttp: EstudiantesHttpService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.rol = this.authService.getRole() || '';
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.detenerAutoRefresh();
  }

  cargarDatos() {
    // Primero cargamos los datos
    this.estudiantesHttp.listar().subscribe({
      next: (data) => {
        this.estudiantes = data || [];
        this.ultimaActualizacion = new Date();
        this.cargandoLista = false;
        
        // Una vez cargados, iniciamos el auto-refresh
        if (this.autoRefresh) {
          this.iniciarAutoRefresh();
        }
      },
      error: (error) => {
        console.error('Error cargando estudiantes:', error);
        this.estudiantes = [];
        this.cargandoLista = false;
      }
    });
  }

  iniciarAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    
    // Actualizar cada 10 segundos
    this.refreshSubscription = interval(10000)
      .pipe(
        switchMap(() => this.estudiantesHttp.listar())
      )
      .subscribe({
        next: (data) => {
          if (this.autoRefresh) {
            this.estudiantes = data || [];
            this.ultimaActualizacion = new Date();
          }
        },
        error: (error) => {
          console.error('Error en auto-refresh:', error);
        }
      });
  }

  detenerAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  toggleAutoRefresh() {
    this.autoRefresh = !this.autoRefresh;
    if (!this.autoRefresh) {
      this.detenerAutoRefresh();
    } else {
      this.iniciarAutoRefresh();
    }
  }

  cargar() {
    this.cargandoLista = true;
    this.estudiantesHttp.listar().subscribe({
      next: (data) => {
        this.estudiantes = data || [];
        this.ultimaActualizacion = new Date();
        this.cargandoLista = false;
      },
      error: (error) => {
        console.error('Error cargando estudiantes:', error);
        this.estudiantes = [];
        this.cargandoLista = false;
      }
    });
  }

  verificarElegibilidad() {
    if (!this.cedulaElegibilidad.trim()) return;
    this.estudiantesHttp.verificarElegibilidad(this.cedulaElegibilidad.trim()).subscribe({
      next: (resp) => {
        if (resp?.elegible) {
          this.resultadoElegibilidad = `Elegible: ${resp.estudiante?.nombreCompleto || ''} (${resp.estudiante?.estadoAcademico})`;
        } else {
          this.resultadoElegibilidad = `No elegible: ${resp?.razon || 'Sin razón'}`;
        }
      },
      error: (error) => {
        console.error('Error verificando elegibilidad:', error);
        this.resultadoElegibilidad = 'Error verificando elegibilidad';
      }
    });
  }

  crear() {
    if (!this.nuevoEstudiante.cedula || !this.nuevoEstudiante.nombreCompleto) {
      alert('Cédula y nombre son requeridos');
      return;
    }
    this.guardando = true;
    this.estudiantesHttp.crear(this.nuevoEstudiante).subscribe({
      next: () => {
        alert('Estudiante creado');
        this.nuevoEstudiante = {
          uidUsuario: '',
          cedula: '',
          nombreCompleto: '',
          periodoAcademico: '',
          estadoAcademico: 'activo',
          estadoCobertura: 'vigente'
        };
        this.guardando = false;
        this.cargar();
      },
      error: (e: any) => {
        console.error('Error creando estudiante:', e);
        alert('Error creando estudiante: ' + (e?.error?.error || e?.message));
        this.guardando = false;
      }
    });
  }

  actualizarEstado(est: any) {
    const nuevo = this.estadoNuevo[est.idEstudiante || est.id];
    if (!nuevo) return;
    this.actualizandoId = est.idEstudiante || est.id || null;
    if (!this.actualizandoId) return;
    this.estudiantesHttp.actualizarEstado(this.actualizandoId, nuevo).subscribe({
      next: () => {
        alert('Estado actualizado');
        this.actualizandoId = null;
        this.cargar();
      },
      error: (e: any) => {
        console.error('Error actualizando estado:', e);
        alert('Error actualizando estado: ' + (e?.error?.error || e?.message));
        this.actualizandoId = null;
      }
    });
  }

  eliminar(est: any) {
    const id = est.idEstudiante || est.id;
    if (!id) return;
    if (!confirm(`¿Eliminar estudiante ${est.nombreCompleto}?`)) return;
    this.borrandoId = id;
    this.estudiantesHttp.eliminar(id).subscribe({
      next: () => {
        alert('Estudiante eliminado');
        this.borrandoId = null;
        this.cargar();
      },
      error: (e: any) => {
        console.error('Error eliminando estudiante:', e);
        alert('Error eliminando estudiante: ' + (e?.error?.error || e?.message));
        this.borrandoId = null;
      }
    });
  }
}
