import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documentos.html',
  styleUrl: './documentos.css',
})
export class DocumentosComponent implements OnInit {
  documentos: any[] = [];
  loading = true;
  error = '';

  constructor(private firestoreService: FirestoreService) {}

  async ngOnInit() {
    try {
      this.documentos = await this.firestoreService.getDocuments('documentos');
    } catch (e: any) {
      this.error = 'Error al cargar documentos';
    }
    this.loading = false;
  }
}
