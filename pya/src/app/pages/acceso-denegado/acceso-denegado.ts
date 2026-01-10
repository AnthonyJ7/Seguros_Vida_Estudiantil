import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-acceso-denegado',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
      <div class="text-center">
        <div class="mb-8">
          <h1 class="text-6xl font-bold text-red-600 mb-4">403</h1>
          <h2 class="text-3xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
          <p class="text-lg text-gray-600 mb-8">No tienes permiso para acceder a esta página.</p>
        </div>
        <div class="space-y-4">
          <a routerLink="/login" class="inline-block px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition">
            Volver al Login
          </a>
        </div>
      </div>
    </div>
  `
})
export class AccesoDenegadoComponent {}
