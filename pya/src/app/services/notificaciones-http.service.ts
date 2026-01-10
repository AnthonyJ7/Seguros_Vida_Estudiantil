import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, interval, startWith, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificacionesHttpService {
  constructor(private api: ApiService) {}

  misNotificaciones(): Observable<any[]> {
    return this.api.get('/notificaciones/mis-notificaciones') as unknown as Observable<any[]>;
  }

  noLeidas(): Observable<any[]> {
    console.log('[notificaciones-http] Llamando a /notificaciones/no-leidas');
    return this.api.get('/notificaciones/no-leidas') as unknown as Observable<any[]>;
  }

  porTramite(tramiteId: string): Observable<any[]> {
    return this.api.get(`/notificaciones/tramite/${tramiteId}`) as unknown as Observable<any[]>;
  }

  marcarLeida(idNotificacion: string): Observable<any> {
    return this.api.patch(`/notificaciones/${idNotificacion}/leer`, {}) as unknown as Observable<any>;
  }

  /**
   * Polling de notificaciones no leídas cada X segundos
   */
  pollingNoLeidas(intervaloSegundos: number = 30): Observable<any[]> {
    return interval(intervaloSegundos * 1000).pipe(
      startWith(0),
      switchMap(() => this.noLeidas())
    );
  }
}
