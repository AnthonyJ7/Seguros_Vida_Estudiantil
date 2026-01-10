import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UsuariosHttpService {
  constructor(private api: ApiService) {}

  listar(): Observable<any[]> {
    return this.api.get('/usuarios') as unknown as Observable<any[]>;
  }

  me(): Observable<any> {
    return this.api.get('/usuarios/me') as unknown as Observable<any>;
  }
}
