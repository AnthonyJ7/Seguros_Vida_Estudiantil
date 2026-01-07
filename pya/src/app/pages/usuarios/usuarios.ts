import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { interval, Subscription, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface Usuario {
  uid?: string;
  email?: string;
  rol?: string;
  fechaCreacion?: any;
  ultimoAcceso?: any;
  activo?: boolean;
  [key: string]: any;
}

interface Estudiante {
  idEstudiante?: string;
  uidUsuario?: string;
  nombreCompleto?: string;
  cedula?: string;
  estadoAcademico?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class UsuariosPage implements OnInit, OnDestroy {
  usuarios: Usuario[] = [];
  estudiantes: Estudiante[] = [];
  cargando = false;
  autoRefresh = true;

  // Mapeo de UID a nombre de estudiante
  usuariosMap: Map<string, string> = new Map();

  // Filtros
  filtroEmail = '';
  filtroRol = '';
  filtroEstado = '';

  private refreshSubscription?: Subscription;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.cargarDatos();
  }

  ngOnDestroy() {
    this.detenerAutoRefresh();
  }

  cargarDatos() {
    this.cargando = true;
    
    forkJoin({
      usuarios: this.api.get<Usuario[]>('/usuarios'),
      estudiantes: this.api.get<Estudiante[]>('/estudiantes')
    }).subscribe({
      next: (data) => {
        this.usuarios = (data.usuarios || []).map(u => ({
          ...u,
          fechaCreacion: this.convertirFecha(u.fechaCreacion),
          ultimoAcceso: this.convertirFecha(u.ultimoAcceso)
        })).sort((a, b) => {
          const dateA = new Date(a.fechaCreacion || 0);
          const dateB = new Date(b.fechaCreacion || 0);
          return dateB.getTime() - dateA.getTime();
        });
        
        this.estudiantes = data.estudiantes || [];
        this.construirMapeoEstudiantes();
        
        this.cargando = false;

        if (this.autoRefresh && !this.refreshSubscription) {
          this.iniciarAutoRefresh();
        }
      },
      error: (error) => {
        console.error('Error cargando usuarios:', error);
        this.usuarios = [];
        this.estudiantes = [];
        this.cargando = false;
      }
    });
  }

  construirMapeoEstudiantes() {
    this.usuariosMap.clear();
    this.estudiantes.forEach(est => {
      if (est.uidUsuario && est.nombreCompleto) {
        this.usuariosMap.set(est.uidUsuario, est.nombreCompleto);
      }
    });
  }

  getNombreEstudiante(uid?: string): string | null {
    if (!uid) return null;
    return this.usuariosMap.get(uid) || null;
  }

  iniciarAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }

    this.refreshSubscription = interval(15000)
      .pipe(
        switchMap(() => forkJoin({
          usuarios: this.api.get<Usuario[]>('/usuarios'),
          estudiantes: this.api.get<Estudiante[]>('/estudiantes')
        }))
      )
      .subscribe({
        next: (data) => {
          if (this.autoRefresh) {
            this.usuarios = (data.usuarios || []).map(u => ({
              ...u,
              fechaCreacion: this.convertirFecha(u.fechaCreacion),
              ultimoAcceso: this.convertirFecha(u.ultimoAcceso)
            })).sort((a, b) => {
              const dateA = new Date(a.fechaCreacion || 0);
              const dateB = new Date(b.fechaCreacion || 0);
              return dateB.getTime() - dateA.getTime();
            });
            
            this.estudiantes = data.estudiantes || [];
            this.construirMapeoEstudiantes();
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

  get usuariosFiltrados(): Usuario[] {
    return this.usuarios.filter(u => {
      const matchEmail = !this.filtroEmail || 
        (u.email && u.email.toLowerCase().includes(this.filtroEmail.toLowerCase()));
      
      const matchRol = !this.filtroRol || 
        (u.rol && u.rol.toLowerCase() === this.filtroRol.toLowerCase());
      
      const matchEstado = !this.filtroEstado ||
        (this.filtroEstado === 'activo' && u.activo !== false) ||
        (this.filtroEstado === 'inactivo' && u.activo === false);
      
      return matchEmail && matchRol && matchEstado;
    });
  }

  limpiarFiltros() {
    this.filtroEmail = '';
    this.filtroRol = '';
    this.filtroEstado = '';
  }

  private convertirFecha(fecha: any): Date | null {
    if (!fecha) return null;
    if (fecha instanceof Date) return fecha;
    if (fecha._seconds !== undefined) {
      return new Date(fecha._seconds * 1000);
    }
    if (typeof fecha === 'string') {
      return new Date(fecha);
    }
    return null;
  }

  getRolClass(rol?: string): string {
    const rolUpper = rol?.toUpperCase();
    if (rolUpper === 'ADMIN') return 'rol-admin';
    if (rolUpper === 'GESTOR') return 'rol-gestor';
    if (rolUpper === 'CLIENTE') return 'rol-cliente';
    if (rolUpper === 'ASEGURADORA') return 'rol-aseguradora';
    return 'rol-default';
  }

  getRolIcon(rol?: string): string {
    const rolUpper = rol?.toUpperCase();
    if (rolUpper === 'ADMIN') return '👨‍💼';
    if (rolUpper === 'GESTOR') return '👨‍💻';
    if (rolUpper === 'CLIENTE') return '👤';
    if (rolUpper === 'ASEGURADORA') return '🏢';
    return '❓';
  }

  getRolNombre(rol?: string): string {
    const rolUpper = rol?.toUpperCase();
    if (rolUpper === 'ADMIN') return 'Administrador';
    if (rolUpper === 'GESTOR') return 'Gestor';
    if (rolUpper === 'CLIENTE') return 'Cliente';
    if (rolUpper === 'ASEGURADORA') return 'Aseguradora';
    return rol || 'Sin rol';
  }

  get totalUsuarios(): number {
    return this.usuarios.length;
  }

  get usuariosPorRol() {
    return {
      admin: this.usuarios.filter(u => u.rol?.toUpperCase() === 'ADMIN').length,
      gestor: this.usuarios.filter(u => u.rol?.toUpperCase() === 'GESTOR').length,
      cliente: this.usuarios.filter(u => u.rol?.toUpperCase() === 'CLIENTE').length,
      aseguradora: this.usuarios.filter(u => u.rol?.toUpperCase() === 'ASEGURADORA').length
    };
  }
}
