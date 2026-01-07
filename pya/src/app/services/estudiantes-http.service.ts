import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EstudiantesHttpService {
  constructor(private api: ApiService) {}

  listar(): Observable<any[]> {
    return this.api.get('/estudiantes') as unknown as Observable<any[]>;
  }

  verificarElegibilidad(cedula: string): Observable<any> {
    return this.api.post('/estudiantes/verificar-elegibilidad', { cedula }) as unknown as Observable<any>;
  }

  crear(estudiante: {
    uidUsuario: string;
    cedula: string;
    nombreCompleto: string;
    periodoAcademico: string;
    estadoAcademico: string;
    estadoCobertura: string;
  }): Observable<any> {
    return this.api.post('/estudiantes', estudiante) as unknown as Observable<any>;
  }

  actualizarEstado(id: string, estadoAcademico: string): Observable<any> {
    return this.api.patch(`/estudiantes/${id}/estado`, { estadoAcademico }) as unknown as Observable<any>;
  }

  eliminar(id: string): Observable<any> {
    return this.api.delete(`/estudiantes/${id}`) as unknown as Observable<any>;
  }
}
