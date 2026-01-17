import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NotificacionesHttpService } from '../../services/notificaciones-http.service';
import { FirestoreService } from '../../services/firestore.service';
import { FirebaseDatePipe } from '../../pipes/firebase-date.pipe';
import { TramitesHttpService } from '../../services/tramites-http.service';

@Component({
  selector: 'app-cliente-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FirebaseDatePipe],
  templateUrl: './cliente-inicio.html'
})
export class ClienteInicioComponent implements OnInit {
  cargando = true;
  estudiante: any = null;
  ultimoTramite: any = null;
  ultimaNotificacion: any = null;
  creando = false;
  errorCrear = '';
  nuevoTramite = {
    tipoTramite: '',
    motivo: '',
    descripcion: '',
    copagoCategoria: 'estudiante',
    montoFacturaReferencial: undefined as number | undefined
  };

  constructor(
    private firestore: FirestoreService,
    private api: ApiService,
    private notifHttp: NotificacionesHttpService,
    private tramitesHttp: TramitesHttpService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargar();
  }

  private async cargar() {
    this.cargando = true;
    const uid = localStorage.getItem('uid') || '';

    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout cargando datos')), 5000));

      // Datos basicos del estudiante desde Firestore
      const usuariosPromise = this.firestore.getDocumentsWithCondition('usuarios', 'uid', '==', uid);
      const usuarios = await Promise.race([usuariosPromise, timeout]) as any[];
      const usuario = usuarios[0] || null;

      let estudiantes = [];
      if (usuario?.idEstudiante) {
        const estPromise = this.firestore.getDocumentsWithCondition('estudiantes', 'id', '==', usuario.idEstudiante);
        estudiantes = await Promise.race([estPromise, timeout]) as any[];
      } else {
        const estPromise = this.firestore.getDocumentsWithCondition('estudiantes', 'uidUsuario', '==', uid);
        estudiantes = await Promise.race([estPromise, timeout]) as any[];
      }
      this.estudiante = estudiantes[0] || null;

      // Tramites del backend (filtrados por token). Se vuelve a filtrar por UID por seguridad defensiva.
      try {
        const tramites = await firstValueFrom(this.api.get<any[]>('/tramites'));
        const propios = (tramites || []).filter(t => !t.creadoPor || t.creadoPor === uid);
        this.ultimoTramite = propios
          .sort((a: any, b: any) => this.toDate(b.fechaRegistro).getTime() - this.toDate(a.fechaRegistro).getTime())[0] || null;
      } catch (err) {
        console.error('Error cargando tramites:', err);
      }

      // Notificaciones del backend (filtradas por UID)
      try {
        const notis = await firstValueFrom(this.notifHttp.misNotificaciones());
        this.ultimaNotificacion = (notis || [])
          .sort((a: any, b: any) => this.toDate(b.fechaEnvio).getTime() - this.toDate(a.fechaEnvio).getTime())[0] || null;
      } catch (err) {
        console.error('Error cargando notificaciones:', err);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    }

    this.cargando = false;
    this.cdr.markForCheck();
  }

  progresoWidth(): string {
    const estado = (this.ultimoTramite?.estadoCaso || '').toUpperCase();
    if (estado === 'EN_VALIDACION') return '40%';
    if (estado === 'APROBADO') return '100%';
    if (estado === 'RECHAZADO') return '100%';
    return '10%';
  }

  private toDate(v: any): Date {
    if (!v) return new Date(0);
    if (v.toDate) return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }

  async crearTramiteRapido() {
    this.errorCrear = '';
    if (!this.estudiante?.cedula) {
      this.errorCrear = 'No se encontró la cédula del estudiante.';
      return;
    }
    if (!this.nuevoTramite.tipoTramite) {
      this.errorCrear = 'Selecciona un tipo de seguro.';
      return;
    }
    if (!this.nuevoTramite.motivo.trim()) {
      this.errorCrear = 'Ingresa un motivo.';
      return;
    }
    try {
      this.creando = true;
      await this.tramitesHttp.crearTramite({
        cedulaEstudiante: this.estudiante.cedula,
        tipoTramite: this.nuevoTramite.tipoTramite,
        motivo: this.nuevoTramite.motivo,
        descripcion: this.nuevoTramite.descripcion,
        copagoCategoria: this.nuevoTramite.copagoCategoria as any,
        montoFacturaReferencial: this.nuevoTramite.montoFacturaReferencial
      }).toPromise();
      await this.cargar();
      this.nuevoTramite = { tipoTramite: '', motivo: '', descripcion: '', copagoCategoria: 'estudiante', montoFacturaReferencial: undefined };
    } catch (err: any) {
      this.errorCrear = err?.error?.error || err?.message || 'Error creando trámite';
    } finally {
      this.creando = false;
      this.cdr.detectChanges();
    }
  }
}
