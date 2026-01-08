import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Polizas } from '../../components/polizas/polizas';

@Component({
  selector: 'app-polizas-page',
  standalone: true,
  imports: [CommonModule, Polizas],
  templateUrl: './polizas.html',
  styleUrl: './polizas.css'
})
export class PolizasPage {
  titulo = 'Mis Pólizas';
}
