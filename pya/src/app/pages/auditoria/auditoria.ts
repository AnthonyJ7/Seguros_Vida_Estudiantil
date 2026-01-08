import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { interval, Subscription, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface Auditoria {
  idAuditoria?: string;
  accion: string;
  usuario: string;
  idTramite?: string;
  fechaHora: Date | any;
  detalles?: string;
}

interface Usuario {
  uid?: string;
  email?: string;
  rol?: string;
  [key: string]: any;
}

interface Estudiante {
  idEstudiante?: string;
  uidUsuario?: string;
  nombreCompleto?: string;
  cedula?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css'
})
export class AuditoriaPage implements OnInit, OnDestroy {
  auditorias: Auditoria[] = [];
  cargando = false;
  autoRefresh = true;

  // Mapeo de UIDs a nombres
  usuariosMap: Map<string, string> = new Map();

  // Filtros
  filtroAccion = '';
  filtroUsuario = '';
  filtroTramite = '';

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
    
    // Cargar usuarios, estudiantes y auditorías en paralelo
    forkJoin({
      usuarios: this.api.get<Usuario[]>('/usuarios'),
      estudiantes: this.api.get<Estudiante[]>('/estudiantes'),
      auditorias: this.api.get<Auditoria[]>('/auditoria')
    }).subscribe({
      next: (data) => {
        // Construir mapeo de UID a nombre
        this.construirMapeoUsuarios(data.usuarios, data.estudiantes);
        
        // Procesar auditorías
        this.auditorias = (data.auditorias || []).map(a => ({
          ...a,
          fechaHora: this.convertirFecha(a.fechaHora)
        })).sort((a, b) => {
          const dateA = new Date(a.fechaHora);
          const dateB = new Date(b.fechaHora);
          return dateB.getTime() - dateA.getTime();
        });
        
        this.cargando = false;

        // Iniciar auto-refresh después de la primera carga
        if (this.autoRefresh && !this.refreshSubscription) {
          this.iniciarAutoRefresh();
        }
      },
      error: (error) => {
        console.error('Error cargando datos:', error);
        this.auditorias = [];
        this.cargando = false;
      }
    });
  }

  construirMapeoUsuarios(usuarios: Usuario[], estudiantes: Estudiante[]) {
    this.usuariosMap.clear();
    
    // Mapear estudiantes por UID
    estudiantes.forEach(est => {
      if (est.uidUsuario && est.nombreCompleto) {
        this.usuariosMap.set(est.uidUsuario, est.nombreCompleto);
        console.log(`Mapeado estudiante: ${est.uidUsuario} -> ${est.nombreCompleto}`);
      }
    });
    
    // Para usuarios sin estudiante asociado, usar email
    usuarios.forEach(user => {
      if (user.uid && !this.usuariosMap.has(user.uid)) {
        const nombre = user.email?.split('@')[0] || user.uid.substring(0, 8);
        this.usuariosMap.set(user.uid, nombre);
        console.log(`Mapeado usuario: ${user.uid} -> ${nombre}`);
      }
    });
    
    console.log('Total usuarios mapeados:', this.usuariosMap.size);
  }

  getNombreUsuario(uid: string): string {
    const nombre = this.usuariosMap.get(uid) || uid;
    if (nombre === uid) {
      console.log(`Usuario no encontrado en mapa: ${uid}`);
    }
    return nombre;
  }

  iniciarAutoRefresh() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }

    this.refreshSubscription = interval(10000)
      .pipe(
        switchMap(() => forkJoin({
          usuarios: this.api.get<Usuario[]>('/usuarios'),
          estudiantes: this.api.get<Estudiante[]>('/estudiantes'),
          auditorias: this.api.get<Auditoria[]>('/auditoria')
        }))
      )
      .subscribe({
        next: (data) => {
          if (this.autoRefresh) {
            // Actualizar mapeo de usuarios
            this.construirMapeoUsuarios(data.usuarios, data.estudiantes);
            
            // Actualizar auditorías
            this.auditorias = (data.auditorias || []).map(a => ({
              ...a,
              fechaHora: this.convertirFecha(a.fechaHora)
            })).sort((a, b) => {
              const dateA = new Date(a.fechaHora);
              const dateB = new Date(b.fechaHora);
              return dateB.getTime() - dateA.getTime();
            });
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

  get auditoriasFiltradas(): Auditoria[] {
    return this.auditorias.filter(a => {
      const matchAccion = !this.filtroAccion || 
        a.accion.toLowerCase().includes(this.filtroAccion.toLowerCase());
      
      // Buscar tanto por UID como por nombre
      const nombreUsuario = this.getNombreUsuario(a.usuario);
      const matchUsuario = !this.filtroUsuario || 
        a.usuario.toLowerCase().includes(this.filtroUsuario.toLowerCase()) ||
        nombreUsuario.toLowerCase().includes(this.filtroUsuario.toLowerCase());
      
      const matchTramite = !this.filtroTramite || 
        (a.idTramite && a.idTramite.toLowerCase().includes(this.filtroTramite.toLowerCase()));
      
      return matchAccion && matchUsuario && matchTramite;
    });
  }

  limpiarFiltros() {
    this.filtroAccion = '';
    this.filtroUsuario = '';
    this.filtroTramite = '';
  }

  private convertirFecha(fecha: any): Date {
    if (!fecha) return new Date();
    if (fecha instanceof Date) return fecha;
    if (fecha._seconds !== undefined) {
      return new Date(fecha._seconds * 1000);
    }
    if (typeof fecha === 'string') {
      return new Date(fecha);
    }
    return new Date();
  }

  getAccionClass(accion: string): string {
    const accionLower = accion.toLowerCase();
    if (accionLower.includes('crear')) return 'accion-crear';
    if (accionLower.includes('actualizar') || accionLower.includes('modificar')) return 'accion-actualizar';
    if (accionLower.includes('eliminar') || accionLower.includes('borrar')) return 'accion-eliminar';
    if (accionLower.includes('aprobar') || accionLower.includes('validar')) return 'accion-aprobar';
    if (accionLower.includes('rechazar')) return 'accion-rechazar';
    return 'accion-default';
  }

  getAccionIcon(accion: string): string {
    const accionLower = accion.toLowerCase();
    if (accionLower.includes('crear')) return '➕';
    if (accionLower.includes('actualizar') || accionLower.includes('modificar')) return '✏️';
    if (accionLower.includes('eliminar') || accionLower.includes('borrar')) return '🗑️';
    if (accionLower.includes('aprobar') || accionLower.includes('validar')) return '✅';
    if (accionLower.includes('rechazar')) return '❌';
    return '📝';
  }
}
