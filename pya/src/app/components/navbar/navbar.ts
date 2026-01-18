import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificacionesHttpService } from '../../services/notificaciones-http.service';
import { ROLES_CONFIG, ROLE_STYLES, getRoleConfig, RoleStyles, RoleConfig } from '../../config/roles.config';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit, OnDestroy, AfterViewInit {
  isOpen = true;
  userRole: string = '';
  roleConfig: RoleConfig | null = null;
  roleStyles: RoleStyles | null = null;
  userName: string = '';
  ROLES_CONFIG = ROLES_CONFIG;
  
  notificacionesNoLeidas = 0;
  mostrarNotificaciones = false;
  notificaciones: any[] = [];
  private notifSub?: Subscription;
  private routeSub?: Subscription;
  hasActiveSelection = false;

  constructor(
    public authService: AuthService, 
    private router: Router,
    private notificacionesHttp: NotificacionesHttpService
  ) {}

  ngOnInit() {
    console.log('[navbar] ngOnInit ejecutado');
    this.loadUserData();

    // Detectamos la ruta activa y actualizamos el estado del botón
    this.updateActiveSelection(this.router.url);
    this.routeSub = this.router.events
      .pipe()
      .subscribe((evt: any) => {
        // NavigationEnd contiene la ruta final luego de redirects
        if (evt?.urlAfterRedirects || evt?.url) {
          const url = evt.urlAfterRedirects || evt.url;
          this.updateActiveSelection(url);
        }
      });
  }

  ngAfterViewInit() {
    // Diferimos el polling al siguiente tick y solo si no es ADMIN
    setTimeout(() => {
      if (this.userRole !== 'ADMIN') {
        this.iniciarPollingNotificaciones();
      }
    }, 0);
  }

  ngOnDestroy() {
    console.log('[navbar] ngOnDestroy ejecutado');
    this.notifSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  private updateActiveSelection(url: string) {
    const menuPaths = [
      '/cliente-inicio', '/mi-solicitud', '/notificaciones',
      '/gestor-dashboard', '/estudiantes', '/documentos', '/historial-tramites', '/auditoria',
      '/admin-dashboard', '/usuarios', '/aseguradoras'
    ];
    this.hasActiveSelection = menuPaths.some(p => url.startsWith(p));
  }

  iniciarPollingNotificaciones() {
    console.log('[navbar] Iniciando polling de notificaciones...');
    // Poll cada 30 segundos
    this.notifSub = this.notificacionesHttp.pollingNoLeidas(30).subscribe({
      next: (notifs) => {
        console.log('[navbar] Notificaciones recibidas:', notifs);
        this.notificacionesNoLeidas = notifs.length;
        this.notificaciones = notifs;
      },
      error: (err) => {
        console.error('[navbar] Error al obtener notificaciones:', err);
        this.notificacionesNoLeidas = 0;
      }
    });
  }

  loadUserData() {
    const usuarioId = localStorage.getItem('uid') || '';
    const userRole = localStorage.getItem('role') || 'CLIENTE';
    this.userRole = userRole;
    this.roleConfig = getRoleConfig(userRole);
    this.roleStyles = ROLE_STYLES[userRole as keyof typeof ROLE_STYLES] || ROLE_STYLES['CLIENTE'];
    this.userName = localStorage.getItem('userName') || 'Usuario';
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  logout() {
    this.authService.logout();
  }

  getRoleColor(): string {
    return this.roleConfig?.color || '#10B981';
  }

  getRoleIcon(): string {
    return this.roleConfig?.icono || '👤';
  }

  canAccess(feature: string): boolean {
    if (!this.roleConfig) return false;
    return this.roleConfig.acceso[feature as keyof typeof this.roleConfig.acceso] || false;
  }

  toggleNotificaciones() {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
  }

  async marcarLeida(notif: any) {
    try {
      await this.notificacionesHttp.marcarLeida(notif.idNotificacion || notif.id).toPromise();
      this.notificaciones = this.notificaciones.filter(n => (n.idNotificacion || n.id) !== (notif.idNotificacion || notif.id));
      this.notificacionesNoLeidas = this.notificaciones.length;
    } catch (e) {
      console.error('Error marcando notificación como leída', e);
    }
  }
}