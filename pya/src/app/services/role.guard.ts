import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required: string[] = (route.data && (route.data as any)['roles']) || [];
  const role = auth.getRole();
  if (!role) {
    router.navigate(['/login']);
    return false;
  }
  if (required.length && !required.includes(role)) {
    // Redirige según rol actual
    switch (role) {
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
