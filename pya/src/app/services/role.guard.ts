import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

// Simple role-based guard using AuthService.getRole()
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const required: string[] = (route.data && (route.data as any)['roles']) || [];
  const role = (auth.getRole() || '').toUpperCase();

  if (!required.length) return true; // no restriction
  if (required.includes(role)) return true;

  // deny and send to login
  router.navigate(['/login']);
  return false;
};
