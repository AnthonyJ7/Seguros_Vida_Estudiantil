import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-estudiante',
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiante.html',
  styleUrl: './estudiante.css',
})
export class Estudiante implements OnInit {
  estudiantes: any[] = [];
  newEstudiante: any = {};

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadEstudiantes();
  }

  async loadEstudiantes() {
    try {
      this.estudiantes = await this.firestoreService.getDocuments('estudiante');
    } catch (error) {
      console.error('Error loading estudiantes:', error);
    }
  }

  async addEstudiante() {
    try {
      await this.firestoreService.addDocument('estudiante', this.newEstudiante);
      this.newEstudiante = {};
      this.loadEstudiantes();
    } catch (error) {
      console.error('Error adding estudiante:', error);
    }
  }

  async deleteEstudiante(id: string) {
    try {
      await this.firestoreService.deleteDocument('estudiante', id);
      this.loadEstudiantes();
    } catch (error) {
      console.error('Error deleting estudiante:', error);
    }
  }
}
