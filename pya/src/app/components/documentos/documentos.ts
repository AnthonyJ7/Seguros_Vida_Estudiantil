import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-documentos',
  imports: [CommonModule, FormsModule],
  templateUrl: './documentos.html',
  styleUrl: './documentos.css',
})
export class Documentos implements OnInit {
  documentos: any[] = [];
  newDocumento: any = {};

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadDocumentos();
  }

  async loadDocumentos() {
    try {
      this.documentos = await this.firestoreService.getDocuments('documentos');
    } catch (error) {
      console.error('Error loading documentos:', error);
    }
  }

  async addDocumento() {
    try {
      await this.firestoreService.addDocument('documentos', this.newDocumento);
      this.newDocumento = {};
      this.loadDocumentos();
    } catch (error) {
      console.error('Error adding documento:', error);
    }
  }

  async deleteDocumento(id: string) {
    try {
      await this.firestoreService.deleteDocument('documentos', id);
      this.loadDocumentos();
    } catch (error) {
      console.error('Error deleting documento:', error);
    }
  }
}
