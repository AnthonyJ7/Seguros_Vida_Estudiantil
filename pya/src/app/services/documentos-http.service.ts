import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentosHttpService {
  private base = environment.apiBaseUrl.replace(/\/$/, '');
  constructor(private http: HttpClient, private api: ApiService) {}

  listar() {
    return this.api.get<any[]>('/documentos');
  }

  listarPorTramite(tramiteId: string) {
    return this.api.get<any[]>(`/documentos/tramite/${tramiteId}`);
  }

  subirArchivo(idTramite: string, file: File, tipo: string) {
    const form = new FormData();
    form.append('archivo', file);
    form.append('tramiteId', idTramite);
    form.append('tipo', tipo);
    return this.http.post(`${this.base}/documentos/upload`, form);
  }
}
