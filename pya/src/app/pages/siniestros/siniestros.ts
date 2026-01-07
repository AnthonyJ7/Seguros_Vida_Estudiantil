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
        docs = await this.firestoreService.getDocuments('tramites');
      } else {
        const estudiantes = await this.firestoreService.getDocumentsWithCondition('estudiante', 'uidUsuario', '==', uid);
        const estudianteId = estudiantes.length ? estudiantes[0].id : null;
        docs = estudianteId
          ? await this.firestoreService.getDocumentsWithCondition('tramites', 'idEstudiante', '==', estudianteId)
          : [];
      }
      // Convertir fechas si es necesario
      this.siniestros = docs.map(doc => ({
        ...doc,
        fechaRegistro: (() => {
          if (doc.fechaRegistro && doc.fechaRegistro.toDate) return doc.fechaRegistro.toDate();
          const parsed = new Date(doc.fechaRegistro);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        })()
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
