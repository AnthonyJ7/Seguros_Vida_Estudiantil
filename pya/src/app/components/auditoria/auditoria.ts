import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-auditoria',
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css',
})
export class Auditoria implements OnInit {
  auditorias: any[] = [];

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadAuditorias();
  }

  async loadAuditorias() {
    try {
      this.auditorias = await this.firestoreService.getDocuments('auditoria');
      // Ordenar por fecha descendente
      this.auditorias.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    } catch (error) {
      console.error('Error loading auditorias:', error);
    }
  }
}
