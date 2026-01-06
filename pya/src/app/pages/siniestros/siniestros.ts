import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-siniestros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './siniestros.html',
  styleUrl: './siniestros.css',
})
export class SiniestrosComponent implements OnInit {
  siniestros: any[] = [];
  loading = true;
  error = '';

  constructor(
    private firestoreService: FirestoreService,
    private authService: AuthService,
    private location: Location
  ) {}

  async ngOnInit() {
    try {
      const rol = this.authService.getRole();
      const uid = localStorage.getItem('uid') || '';
      let docs = [];
      if (rol === 'GESTOR') {
        docs = await this.firestoreService.getDocuments('siniestros');
      } else {
        docs = await this.firestoreService.getDocumentsWithCondition('siniestros', 'uidUsuario', '==', uid);
      }
      // Convertir fechas si es necesario
      this.siniestros = docs.map(doc => ({
        ...doc,
        fechaRegistro: doc.fechaRegistro && doc.fechaRegistro.toDate ? doc.fechaRegistro.toDate() : doc.fechaRegistro
      }));
    } catch (e: any) {
      this.error = 'Error al cargar siniestros';
    }
    this.loading = false;
  }

  goBack() {
    this.location.back();
  }
}
