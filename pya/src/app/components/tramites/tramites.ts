import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-tramites',
  imports: [CommonModule, FormsModule],
  templateUrl: './tramites.html',
  styleUrl: './tramites.css',
})
export class Tramites implements OnInit {
  tramites: any[] = [];
  newTramite: any = {};
  estadosCaso = ['APROBADO', 'RECHAZADO', 'EN_VALIDACION'];

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadTramites();
  }

  async loadTramites() {
    try {
      this.tramites = await this.firestoreService.getDocuments('tramites');
    } catch (error) {
      console.error('Error loading tramites:', error);
    }
  }

  async addTramite() {
    try {
      await this.firestoreService.addDocument('tramites', this.newTramite);
      this.newTramite = {};
      this.loadTramites();
    } catch (error) {
      console.error('Error adding tramite:', error);
    }
  }

  async updateTramite(id: string, tramite: any) {
    try {
      await this.firestoreService.updateDocument('tramites', id, tramite);
      this.loadTramites();
    } catch (error) {
      console.error('Error updating tramite:', error);
    }
  }

  async deleteTramite(id: string) {
    try {
      await this.firestoreService.deleteDocument('tramites', id);
      this.loadTramites();
    } catch (error) {
      console.error('Error deleting tramite:', error);
    }
  }
}
