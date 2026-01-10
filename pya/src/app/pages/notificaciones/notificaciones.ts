import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';
import { FirebaseDatePipe } from '../../pipes/firebase-date.pipe';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterLink, FirebaseDatePipe],
  templateUrl: './notificaciones.html'
})
export class NotificacionesComponent implements OnInit {
  cargando = true;
  notificaciones: any[] = [];
  estudiante: any = null;
  error = '';

  constructor(private firestore: FirestoreService, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.cargar();
  }

  private async cargar() {
    this.cargando = true;
    this.error = '';
    
    try {
      const uid = localStorage.getItem('uid') || '';

      if (!uid) {
        this.error = 'No hay sesión activa.';
        this.cargando = false;
        return;
      }

      // Timeout de 5 segundos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout cargando notificaciones')), 5000)
      );

      // Obtener usuario primero
      const usuariosPromise = this.firestore.getDocumentsWithCondition('usuarios', 'uid', '==', uid);
      const usuarios = await Promise.race([usuariosPromise, timeoutPromise]) as any[];
      const usuario = usuarios[0] || null;

      // Obtener estudiante
      let estudiantes = [];
      if (usuario?.idEstudiante) {
        const estPromise = this.firestore.getDocumentsWithCondition('estudiantes', 'id', '==', usuario.idEstudiante);
        estudiantes = await Promise.race([estPromise, timeoutPromise]) as any[];
      } else {
        const estPromise = this.firestore.getDocumentsWithCondition('estudiantes', 'uidUsuario', '==', uid);
        estudiantes = await Promise.race([estPromise, timeoutPromise]) as any[];
      }
      this.estudiante = estudiantes[0] || null;

      if (!this.estudiante) {
        this.error = 'No se encontró información del estudiante.';
        this.cargando = false;
        return;
      }

      // Obtener notificaciones
      const notis = await this.firestore.getDocumentsWithCondition('notificaciones', 'idEstudiante', '==', this.estudiante.id);
      this.notificaciones = (notis || []).sort((a, b) => this.toDate(b.fechaEnvio).getTime() - this.toDate(a.fechaEnvio).getTime());

    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      this.error = 'Error al cargar las notificaciones. Intenta más tarde.';
    }

    this.cargando = false;
    this.cdr.markForCheck();
  }

  private toDate(v: any): Date {
    if (!v) return new Date(0);
    if (v.toDate) return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
}
