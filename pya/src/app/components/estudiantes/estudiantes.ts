import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-estudiantes',
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css',
})
export class Estudiantes implements OnInit {
  estudiantes: any[] = [];
  newEstudiante: any = {};

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadEstudiantes();
  }

  async loadEstudiantes() {
    try {
      this.estudiantes = await this.firestoreService.getDocuments('estudiantes');
      console.log('Estudiantes loaded:', this.estudiantes);
    } catch (error) {
      console.error('Error loading estudiantes:', error);
    }
  }

  async addEstudiante() {
    try {
      console.log('Adding estudiante:', this.newEstudiante);
      await this.firestoreService.addDocument('estudiantes', this.newEstudiante);
      this.newEstudiante = {};
      this.loadEstudiantes();
    } catch (error) {
      console.error('Error adding estudiante:', error);
    }
  }

  async deleteEstudiante(id: string) {
    try {
      console.log('Deleting estudiante:', id);
      await this.firestoreService.deleteDocument('estudiantes', id);
      this.loadEstudiantes();
    } catch (error) {
      console.error('Error deleting estudiante:', error);
    }
  }
}
