import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { FirebaseDatePipe } from '../../pipes/firebase-date.pipe';

@Component({
  selector: 'app-cliente-inicio',
  standalone: true,
  imports: [CommonModule, RouterLink, FirebaseDatePipe],
  templateUrl: './cliente-inicio.html'
})
export class ClienteInicioComponent implements OnInit {
  cargando = true;
  estudiante: any = null;
  ultimoTramite: any = null;
  ultimaNotificacion: any = null;

  constructor(private firestore: FirestoreService, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.cargar();
  }

  private async cargar() {
    this.cargando = true;
    const uid = localStorage.getItem('uid') || '';

    try {
      // Timeout de 5 segundos para evitar que se quede cargando
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout cargando datos')), 5000)
      );

      // Obtener usuario primero
      const usuariosPromise = this.firestore.getDocumentsWithCondition('usuarios', 'uid', '==', uid);
      const usuarios = await Promise.race([usuariosPromise, timeoutPromise]) as any[];
      const usuario = usuarios[0] || null;

      // Usar estudiante del usuario o buscar por uid
      let estudiantes = [];
      if (usuario?.idEstudiante) {
        const estPromise = this.firestore.getDocumentsWithCondition('estudiantes', 'id', '==', usuario.idEstudiante);
        estudiantes = await Promise.race([estPromise, timeoutPromise]) as any[];
      } else {
        const estPromise = this.firestore.getDocumentsWithCondition('estudiantes', 'uidUsuario', '==', uid);
        estudiantes = await Promise.race([estPromise, timeoutPromise]) as any[];
      }
      this.estudiante = estudiantes[0] || null;

      // trámites del estudiante y último
      let tramites: any[] = [];
      if (this.estudiante) {
        const tramitesPromise = this.firestore.getDocumentsWithCondition('tramites', 'idEstudiante', '==', this.estudiante.id);
        tramites = await Promise.race([tramitesPromise, timeoutPromise]) as any[];
      }
      this.ultimoTramite = tramites.sort((a, b) => this.toDate(b.fechaRegistro).getTime() - this.toDate(a.fechaRegistro).getTime())[0] || null;

      // última notificación
      let notis: any[] = [];
      if (this.estudiante) {
        const notisPromise = this.firestore.getDocumentsWithCondition('notificaciones', 'idEstudiante', '==', this.estudiante.id);
        notis = await Promise.race([notisPromise, timeoutPromise]) as any[];
      }
      this.ultimaNotificacion = notis.sort((a, b) => this.toDate(b.fechaEnvio).getTime() - this.toDate(a.fechaEnvio).getTime())[0] || null;

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
}
