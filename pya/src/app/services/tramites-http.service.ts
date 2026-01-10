import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface CrearTramitePayload {
  idEstudiante: string;
  tipo: string;
  descripcion: string;
  beneficiarios?: any[];
}

@Injectable({ providedIn: 'root' })
export class TramitesHttpService {
  constructor(private api: ApiService) {}

  crearTramite(payload: CrearTramitePayload): Observable<any> {
    return this.api.post('/tramites', payload);
  }

  validarTramite(idTramite: string): Observable<any> {
    return this.api.post(`/tramites/${idTramite}/validar`, {});
  }

  rechazarTramite(idTramite: string, motivo: string): Observable<any> {
    return this.api.patch(`/tramites/${idTramite}/rechazar`, { motivo });
  }

  enviarAAseguradora(idTramite: string, idAseguradora: string): Observable<any> {
    return this.api.post(`/tramites/${idTramite}/enviar-aseguradora`, { idAseguradora });
  }

  registrarResultado(idTramite: string, aprobado: boolean, observaciones?: string, monto?: number): Observable<any> {
    return this.api.post(`/tramites/${idTramite}/resultado`, { aprobado, observaciones, montoAprobado: monto });
  }

  solicitarCorrecciones(idTramite: string, descripcion: string): Observable<any> {
    return this.api.post(`/tramites/${idTramite}/correcciones`, { descripcion });
  }

  observarTramite(idTramite: string, motivo: string): Observable<any> {
    return this.api.patch(`/tramites/${idTramite}/observar`, { motivo });
  }

  aprobarTramite(idTramite: string, montoAprobado?: number, observaciones?: string): Observable<any> {
    return this.api.patch(`/tramites/${idTramite}/aprobar`, { montoAprobado, observaciones });
  }

  confirmarPago(idTramite: string, referenciaPago: string): Observable<any> {
    return this.api.post(`/tramites/${idTramite}/pago`, { referenciaPago });
  }

  historial(idTramite: string): Observable<any> {
    return this.api.get(`/tramites/${idTramite}/historial`);
  }

  listar(params?: { estado?: string; limite?: number; estudiante?: string }): Observable<any> {
    return this.api.get('/tramites', params as any);
  }

  obtener(idTramite: string): Observable<any> {
    return this.api.get(`/tramites/${idTramite}`);
  }
}
