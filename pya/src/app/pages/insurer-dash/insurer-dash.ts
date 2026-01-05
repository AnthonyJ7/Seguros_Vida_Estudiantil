import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-insurer-dash',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insurer-dash.html',
  styleUrl: './insurer-dash.css',
})
export class InsurerDashComponent { // <--- Cambiado a InsurerDashComponent
  documentos = [
    { cliente: 'Carlos Ruiz', tiempo: 'hace 10 min', status: 'Pendiente' },
    { cliente: 'Ana Lopez', tiempo: 'hace 2 horas', status: 'Revisado' }
  ];
}