import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificacionesHttpService } from '../../services/notificaciones-http.service';

@Component({
  selector: 'app-notificaciones-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css'
})
export class NotificacionesPage implements OnInit {
  notificaciones: any[] = [];
  cargando = true;
  filtro: 'todas' | 'no-leidas' = 'todas';

  constructor(private notificacionesHttp: NotificacionesHttpService) {}

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargando = true;
    try {
      if (this.filtro === 'no-leidas') {
        this.notificaciones = await this.notificacionesHttp.noLeidas().toPromise() || [];
      } else {
        this.notificaciones = await this.notificacionesHttp.misNotificaciones().toPromise() || [];
      }
    } catch (e) {
      this.notificaciones = [];
    }
    this.cargando = false;
  }

  async marcarLeida(notif: any) {
    try {
      await this.notificacionesHttp.marcarLeida(notif.idNotificacion || notif.id).toPromise();
      await this.cargar();
    } catch (e) {
      alert('Error marcando notificación');
    }
  }

  cambiarFiltro(f: 'todas' | 'no-leidas') {
    this.filtro = f;
    this.cargar();
  }
}
