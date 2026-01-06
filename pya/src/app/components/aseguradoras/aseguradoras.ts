import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-aseguradoras',
  imports: [CommonModule, FormsModule],
  templateUrl: './aseguradoras.html',
  styleUrl: './aseguradoras.css',
})
export class Aseguradoras implements OnInit {
  aseguradoras: any[] = [];
  newAseguradora: any = {};

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadAseguradoras();
  }

  async loadAseguradoras() {
    try {
      this.aseguradoras = await this.firestoreService.getDocuments('aseguradoras');
    } catch (error) {
      console.error('Error loading aseguradoras:', error);
    }
  }

  async addAseguradora() {
    try {
      await this.firestoreService.addDocument('aseguradoras', this.newAseguradora);
      this.newAseguradora = {};
      this.loadAseguradoras();
    } catch (error) {
      console.error('Error adding aseguradora:', error);
    }
  }

  async deleteAseguradora(id: string) {
    try {
      await this.firestoreService.deleteDocument('aseguradoras', id);
      this.loadAseguradoras();
    } catch (error) {
      console.error('Error deleting aseguradora:', error);
    }
  }
}
