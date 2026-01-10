import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro-siniestro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registro-siniestro.html',
  styleUrl: './registro-siniestro.css',
})
export class RegistroSiniestroComponent {
  newSiniestro: any = {};
  archivoSeleccionado: File | null = null;
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private firestoreService: FirestoreService, private router: Router) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.archivoSeleccionado = file;
  }

  async registrarSiniestro() {
    this.successMessage = '';
    this.errorMessage = '';
    this.loading = true;
    // Validación manual extra (solo tipo y descripcion)
    if (!this.newSiniestro.tipo || !this.newSiniestro.descripcion) {
      this.errorMessage = 'Completa todos los campos obligatorios.';
      this.loading = false;
      return;
    }
    try {
      // Llama al backend que genera el ID autoincrementable y guarda el siniestro
      const usuarioUid = localStorage.getItem('uid') || '';
      let siniestroId = await this.firestoreService.registrarSiniestro(this.newSiniestro, usuarioUid);
      // Si hay archivo, subirlo y asociar al siniestro
      if (this.archivoSeleccionado) {
        await this.firestoreService.subirDocumento(siniestroId, this.archivoSeleccionado, 'siniestro', usuarioUid);
      }
      this.successMessage = 'Siniestro registrado exitosamente.';
      this.newSiniestro = {};
      this.archivoSeleccionado = null;
      setTimeout(() => {
        this.router.navigate(['/cliente-inicio']);
      }, 1200);
    } catch (error) {
      console.error('Error registrando siniestro:', error);
      this.errorMessage = 'Error al registrar el siniestro.';
    }
    this.loading = false;
  }
}
