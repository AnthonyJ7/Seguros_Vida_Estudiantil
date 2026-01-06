import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FirestoreService } from '../../services/firestore.service';

@Component({
  selector: 'app-insurer-dash',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './insurer-dash.html',
  styleUrl: './insurer-dash.css',
})
export class InsurerDashComponent implements OnInit {
  polizas: any[] = [];
  siniestros: any[] = [];
  loadingPolizas = false;
  loadingSiniestros = false;

  constructor(private firestoreService: FirestoreService) {}

  ngOnInit() {
    this.loadPolizas();
    this.loadSiniestros();
  }

  async loadPolizas() {
    this.loadingPolizas = true;
    try {
      this.polizas = await this.firestoreService.getDocuments('polizas');
    } catch (error) {
      console.error('Error cargando pólizas:', error);
    }
    this.loadingPolizas = false;
  }

  async loadSiniestros() {
    this.loadingSiniestros = true;
    try {
      this.siniestros = await this.firestoreService.getDocuments('siniestros');
    } catch (error) {
      console.error('Error cargando siniestros:', error);
    }
    this.loadingSiniestros = false;
  }

  async validarPoliza(poliza: any) {
    try {
      await this.firestoreService.updateDocument('polizas', poliza.id, { status: 'Validado' });
      this.loadPolizas();
    } catch (error) {
      console.error('Error validando póliza:', error);
    }
  }

  async validarSiniestro(siniestro: any) {
    try {
      await this.firestoreService.updateDocument('siniestros', siniestro.id, { status: 'Validado' });
      this.loadSiniestros();
    } catch (error) {
      console.error('Error validando siniestro:', error);
    }
  }
}