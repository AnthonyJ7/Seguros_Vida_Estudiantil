import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ReglaDto {
  idRegla?: string;
  nombre: string;
  descripcion: string;
  valor: number;
  estado: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReglasHttpService {
  constructor(private api: ApiService) {}

  listar(): Observable<ReglaDto[]> {
    return this.api.get('/reglas') as unknown as Observable<ReglaDto[]>;
  }

  crear(data: ReglaDto): Observable<ReglaDto> {
    return this.api.post('/reglas', data) as unknown as Observable<ReglaDto>;
  }

  actualizar(id: string, data: Partial<ReglaDto>): Observable<ReglaDto> {
    return this.api.put(`/reglas/${id}`, data) as unknown as Observable<ReglaDto>;
  }

  activar(id: string): Observable<ReglaDto> {
    return this.api.patch(`/reglas/${id}/activar`, {}) as unknown as Observable<ReglaDto>;
  }

  desactivar(id: string): Observable<ReglaDto> {
    return this.api.patch(`/reglas/${id}/desactivar`, {}) as unknown as Observable<ReglaDto>;
  }

  eliminar(id: string): Observable<void> {
    return this.api.delete(`/reglas/${id}`) as unknown as Observable<void>;
  }
}
