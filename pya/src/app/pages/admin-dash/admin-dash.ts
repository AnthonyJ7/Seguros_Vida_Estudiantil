import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [CommonModule, FormsModule], // Importamos FormsModule para usar [(ngModel)]
  templateUrl: './admin-dash.html',
  styleUrl: './admin-dash.css',
})
export class AdminDashComponent { // <--- Cambiado de AdminDash a AdminDashComponent
  config = {
    diasGracia: 15,
    limiteDocumentosHoras: 48
  };
}