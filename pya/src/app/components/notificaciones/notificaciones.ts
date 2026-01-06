import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-notificaciones',
  imports: [CommonModule, FormsModule],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css',
})
export class Notificaciones implements OnInit {
  notificaciones: any[] = [];
  newNotificacion: any = {};

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadNotificaciones();
  }

  async loadNotificaciones() {
    try {
      this.notificaciones = await this.firestoreService.getDocuments('notificaciones');
      // Ordenar por fecha descendente
      this.notificaciones.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    } catch (error) {
      console.error('Error loading notificaciones:', error);
    }
  }

  async addNotificacion() {
    try {
      this.newNotificacion.fecha = new Date();
      await this.firestoreService.addDocument('notificaciones', this.newNotificacion);
      this.newNotificacion = {};
      this.loadNotificaciones();
    } catch (error) {
      console.error('Error adding notificacion:', error);
    }
  }

  async deleteNotificacion(id: string) {
    try {
      await this.firestoreService.deleteDocument('notificaciones', id);
      this.loadNotificaciones();
    } catch (error) {
      console.error('Error deleting notificacion:', error);
    }
  }
}
