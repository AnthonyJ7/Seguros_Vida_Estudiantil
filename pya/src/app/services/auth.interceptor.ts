import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  // Only attach token for API calls to our backend
  const isApiCall = /\/api\//.test(req.url) || req.url.startsWith('http://localhost:4000') || req.url.startsWith('https://');
  if (!isApiCall) {
    return next(req);
  }
  
  // Primero intentar obtener el token del localStorage (sincrónico y más rápido)
  const cachedToken = localStorage.getItem('idToken');
  if (cachedToken) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${cachedToken}`
      }
    });
    return next(authReq);
  }
  
  // Si no hay token en cache, intentar obtenerlo de Firebase Auth
  const auth = inject(AuthService);
  return from(auth.getIdToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }
      return next(req);
    })
  );
}
