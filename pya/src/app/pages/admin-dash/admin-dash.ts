import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Estudiantes } from '../../components/estudiantes/estudiantes';
import { Polizas } from '../../components/polizas/polizas';
import { Siniestros } from '../../components/siniestros/siniestros';
import { Aseguradoras } from '../../components/aseguradoras/aseguradoras';
import { Auditoria } from '../../components/auditoria/auditoria';
import { Beneficiarios } from '../../components/beneficiarios/beneficiarios';
import { Documentos } from '../../components/documentos/documentos';
import { Estudiante } from '../../components/estudiante/estudiante';
import { Notificaciones } from '../../components/notificaciones/notificaciones';
import { ReglasNegocio } from '../../components/reglas-negocio/reglas-negocio';
import { Tramites } from '../../components/tramites/tramites';
import { Usuarios } from '../../components/usuarios/usuarios';

@Component({
  selector: 'app-admin-dash',
  standalone: true,
  imports: [CommonModule, FormsModule, Estudiantes, Polizas, Siniestros, Aseguradoras, Auditoria, Beneficiarios, Documentos, Estudiante, Notificaciones, ReglasNegocio, Tramites, Usuarios], // Importamos FormsModule para usar [(ngModel)]
  templateUrl: './admin-dash.html',
  styleUrl: './admin-dash.css',
})
export class AdminDashComponent { // <--- Cambiado de AdminDash a AdminDashComponent
  config = {
    diasGracia: 15,
    limiteDocumentosHoras: 48
  };
}