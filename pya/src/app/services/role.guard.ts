import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required: string[] = (route.data && (route.data as any)['roles']) || [];
  
  // Obtener el rol del localStorage directamente para mayor confiabilidad
  let role = auth.getRole();
  if (!role) {
    role = localStorage.getItem('userRole') || localStorage.getItem('role') || '';
  }
  
  if (!role) {
    router.navigate(['/login']);
    return false;
  }
  
  // Convertir a mayúsculas para comparación
  const normalizedRole = role.toUpperCase();
  
  if (required.length && !required.includes(normalizedRole)) {
    // Redirige según rol actual
    switch (normalizedRole) {
      case 'ADMIN':
        router.navigate(['/admin-dash']);
        break;
      case 'GESTOR':
        router.navigate(['/gestor-dash']);
        break;
      default:
        router.navigate(['/user-dash']);
    }
    return false;
  }
  return true;
};
