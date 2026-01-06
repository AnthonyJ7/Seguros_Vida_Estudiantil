import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthorizationService } from './authorization.service';
import { AuditService } from './audit.service';

/**
 * GUARD DE AUTORIZACIÓN
 * Protege las rutas validando permisos del usuario
 */

@Injectable({
  providedIn: 'root'
})
export class AuthorizationGuard implements CanActivate {
  constructor(
    private authorization: AuthorizationService,
    private audit: AuditService,
    private router: Router
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    try {
      // Obtener ID del usuario del localStorage
      const usuarioId = localStorage.getItem('uid');

      if (!usuarioId) {
        await this.audit.registrarAccesoDenegado('ANÓNIMO', 'ruta', 'No autenticado');
        this.router.navigate(['/login']);
        return false;
      }

      // Obtener rol requerido de la ruta
      const rolRequerido = route.data['rol'];

      if (rolRequerido) {
        const tieneRol = await this.validarRol(usuarioId, rolRequerido);
        if (!tieneRol) {
          await this.audit.registrarAccesoDenegado(usuarioId, 'ruta', `Rol requerido: ${rolRequerido}`);
          this.router.navigate(['/acceso-denegado']);
          return false;
        }
      }

      // Obtener permiso requerido de la ruta
      const permisoRequerido = route.data['permiso'];

      if (permisoRequerido) {
        const tienePermiso = await this.authorization.tienePermiso(usuarioId, permisoRequerido.recurso, permisoRequerido.accion);
        if (!tienePermiso) {
          await this.audit.registrarAccesoDenegado(usuarioId, permisoRequerido.recurso, `Acción: ${permisoRequerido.accion}`);
          this.router.navigate(['/acceso-denegado']);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error en guard de autorización:', error);
      this.router.navigate(['/error']);
      return false;
    }
  }

  private async validarRol(usuarioId: string, rolRequerido: string | string[]): Promise<boolean> {
    const rolesRequeridos = Array.isArray(rolRequerido) ? rolRequerido : [rolRequerido];
    const permisos = await this.authorization.obtenerPermisosUsuario(usuarioId);

    // Si es un rol, verificar directamente
    for (const rol of rolesRequeridos) {
      if (permisos.includes(`rol:${rol}`)) {
        return true;
      }
    }

    return false;
  }
}

/**
 * INTERCEPTOR DE ERRORES DE AUTORIZACIÓN
 * Maneja errores 403 Forbidden
 */

import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthorizationErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          // Acceso denegado
          this.router.navigate(['/acceso-denegado']);
        } else if (error.status === 401) {
          // No autenticado
          localStorage.removeItem('uid');
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
