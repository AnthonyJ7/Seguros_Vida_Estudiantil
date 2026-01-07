import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstudiantesHttpService } from '../../services/estudiantes-http.service';

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css'
})
export class EstudiantesPage implements OnInit {
  estudiantes: any[] = [];
  cargandoLista = false;
  guardando = false;
  actualizandoId: string | null = null;

  cedulaElegibilidad = '';
  resultadoElegibilidad = '';

  nuevoEstudiante = {
    uidUsuario: '',
    cedula: '',
    nombreCompleto: '',
    periodoAcademico: '',
    estadoAcademico: 'activo',
    estadoCobertura: 'vigente'
  };

  estadoNuevo: Record<string, string> = {};
  borrandoId: string | null = null;

  constructor(private estudiantesHttp: EstudiantesHttpService) {}

  async ngOnInit() {
    await this.cargar();
  }

  async cargar() {
    this.cargandoLista = true;
    this.estudiantes = (await this.estudiantesHttp.listar().toPromise().catch(() => [])) || [];
    this.cargandoLista = false;
  }

  async verificarElegibilidad() {
    if (!this.cedulaElegibilidad.trim()) return;
    const resp = await this.estudiantesHttp.verificarElegibilidad(this.cedulaElegibilidad.trim()).toPromise();
    if (resp?.elegible) {
      this.resultadoElegibilidad = `Elegible: ${resp.estudiante?.nombreCompleto || ''} (${resp.estudiante?.estadoAcademico})`;
    } else {
      this.resultadoElegibilidad = `No elegible: ${resp?.razon || 'Sin razón'}`;
    }
  }

  async crear() {
    if (!this.nuevoEstudiante.cedula || !this.nuevoEstudiante.nombreCompleto) {
      alert('Cédula y nombre son requeridos');
      return;
    }
    this.guardando = true;
    try {
      await this.estudiantesHttp.crear(this.nuevoEstudiante).toPromise();
      alert('Estudiante creado');
      this.nuevoEstudiante = {
        uidUsuario: '',
        cedula: '',
        nombreCompleto: '',
        periodoAcademico: '',
        estadoAcademico: 'activo',
        estadoCobertura: 'vigente'
      };
      await this.cargar();
    } catch (e: any) {
      alert('Error creando estudiante: ' + (e?.error?.error || e?.message));
    }
    this.guardando = false;
  }

  async actualizarEstado(est: any) {
    const nuevo = this.estadoNuevo[est.idEstudiante || est.id];
    if (!nuevo) return;
    this.actualizandoId = est.idEstudiante || est.id || null;
    if (!this.actualizandoId) return;
    try {
      await this.estudiantesHttp.actualizarEstado(this.actualizandoId, nuevo).toPromise();
      alert('Estado actualizado');
      await this.cargar();
    } catch (e: any) {
      alert('Error actualizando estado: ' + (e?.error?.error || e?.message));
    }
    this.actualizandoId = null;
  }

  async eliminar(est: any) {
    const id = est.idEstudiante || est.id;
    if (!id) return;
    if (!confirm(`¿Eliminar estudiante ${est.nombreCompleto}?`)) return;
    this.borrandoId = id;
    try {
      await this.estudiantesHttp.eliminar(id).toPromise();
      alert('Estudiante eliminado');
      await this.cargar();
    } catch (e: any) {
      alert('Error eliminando estudiante: ' + (e?.error?.error || e?.message));
    }
    this.borrandoId = null;
  }
}
