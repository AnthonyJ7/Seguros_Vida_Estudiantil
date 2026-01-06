import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-siniestros',
  imports: [CommonModule, FormsModule],
  templateUrl: './siniestros.html',
  styleUrl: './siniestros.css',
})
export class Siniestros implements OnInit {
  siniestros: any[] = [];
  newSiniestro: any = {};

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadSiniestros();
  }

  async loadSiniestros() {
    try {
      this.siniestros = await this.firestoreService.getDocuments('siniestros');
    } catch (error) {
      console.error('Error loading siniestros:', error);
    }
  }

  async addSiniestro() {
    try {
      await this.firestoreService.addDocument('siniestros', this.newSiniestro);
      this.newSiniestro = {};
      this.loadSiniestros();
    } catch (error) {
      console.error('Error adding siniestro:', error);
    }
  }

  async deleteSiniestro(id: string) {
    try {
      await this.firestoreService.deleteDocument('siniestros', id);
      this.loadSiniestros();
    } catch (error) {
      console.error('Error deleting siniestro:', error);
    }
  }
}
