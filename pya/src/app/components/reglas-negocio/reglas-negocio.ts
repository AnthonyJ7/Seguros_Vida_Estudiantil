import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-reglas-negocio',
  imports: [CommonModule, FormsModule],
  templateUrl: './reglas-negocio.html',
  styleUrl: './reglas-negocio.css',
})
export class ReglasNegocio implements OnInit {
  reglas: any[] = [];
  newRegla: any = {};

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadReglas();
  }

  async loadReglas() {
    try {
      this.reglas = await this.firestoreService.getDocuments('reglas_negocio');
    } catch (error) {
      console.error('Error loading reglas:', error);
    }
  }

  async addRegla() {
    try {
      await this.firestoreService.addDocument('reglas_negocio', this.newRegla);
      this.newRegla = {};
      this.loadReglas();
    } catch (error) {
      console.error('Error adding regla:', error);
    }
  }

  async updateRegla(id: string, regla: any) {
    try {
      await this.firestoreService.updateDocument('reglas_negocio', id, regla);
      this.loadReglas();
    } catch (error) {
      console.error('Error updating regla:', error);
    }
  }

  async deleteRegla(id: string) {
    try {
      await this.firestoreService.deleteDocument('reglas_negocio', id);
      this.loadReglas();
    } catch (error) {
      console.error('Error deleting regla:', error);
    }
  }
}
