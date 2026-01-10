import { HttpEvent, HttpHandlerFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { BackendStatusService } from './backend-status.service';

export function errorInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const status = inject(BackendStatusService);
  return next(req).pipe(
    tap({
      next: () => status.setUp(),
      error: (err: any) => {
        const isHttp = err instanceof HttpErrorResponse;
        if (isHttp) {
          if (err.status === 0) {
            status.setDown('Backend no disponible');
          } else if (err.status >= 500) {
            status.setDown('Error del servidor');
          }
        } else {
          status.setDown('Error de red');
        }
      }
    })
  );
}
