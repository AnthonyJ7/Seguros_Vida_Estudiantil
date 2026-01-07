import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-polizas-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './polizas.html',
  styleUrl: './polizas.css'
})
export class PolizasPage {
  titulo = 'Mis Pólizas';
}
