import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-polizas',
  imports: [CommonModule, FormsModule],
  templateUrl: './polizas.html',
  styleUrl: './polizas.css',
})
export class Polizas implements OnInit {
  polizas: any[] = [];
  newPoliza: any = {};

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadPolizas();
  }

  async loadPolizas() {
    try {
      this.polizas = await this.firestoreService.getDocuments('polizas');
    } catch (error) {
      console.error('Error loading polizas:', error);
    }
  }

  async addPoliza() {
    try {
      await this.firestoreService.addDocument('polizas', this.newPoliza);
      this.newPoliza = {};
      this.loadPolizas();
    } catch (error) {
      console.error('Error adding poliza:', error);
    }
  }

  async deletePoliza(id: string) {
    try {
      await this.firestoreService.deleteDocument('polizas', id);
      this.loadPolizas();
    } catch (error) {
      console.error('Error deleting poliza:', error);
    }
  }
}
