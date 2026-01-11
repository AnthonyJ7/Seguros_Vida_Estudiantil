import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FirestoreService } from '../../services/firestore.service';
import { NotificacionesHttpService } from '../../services/notificaciones-http.service';
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
  role = '';

  get homeLink(): string {
    return this.role === 'CLIENTE' ? '/cliente-inicio' : '/gestor-dashboard';
  }

  constructor(
    private firestore: FirestoreService,
    private notifHttp: NotificacionesHttpService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargar();
  }

  private async cargar() {
    this.cargando = true;
    this.error = '';
    
    try {
      const uid = localStorage.getItem('uid') || '';
      this.role = (localStorage.getItem('role') || localStorage.getItem('userRole') || '').toUpperCase();

      if (!uid) {
        this.error = 'No hay sesión activa.';
        this.cargando = false;
        return;
      }

      // Todos los roles usan el backend API que filtra por UID
      const notisApi = await firstValueFrom(this.notifHttp.misNotificaciones());
      this.notificaciones = (notisApi || []).sort((a, b) => 
        this.toDate(b.fechaEnvio).getTime() - this.toDate(a.fechaEnvio).getTime()
      );

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
