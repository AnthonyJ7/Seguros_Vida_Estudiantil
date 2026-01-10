import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';
import { FirebaseDatePipe } from '../../pipes/firebase-date.pipe';

@Component({
  selector: 'app-mi-solicitud',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterModule, FirebaseDatePipe, FormsModule],
  templateUrl: './mi-solicitud.html'
})
export class MiSolicitudComponent implements OnInit {
  cargando = true;
  tramites: any[] = [];
  selectedTramite: any = null;
  estudiante: any = null;
  aseguradora: any = null;
  error = '';
  mostrando: 'lista' | 'detalle' = 'lista';
  nuevaTramiteForm = {
    tipoSeguro: '',
    idAseguradora: ''
  };
  aseguradoras: any[] = [];
  tiposSeguro = ['Vida Estudiantil', 'Accidental', 'Responsabilidad Civil'];

  constructor(private firestore: FirestoreService, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    await this.cargar();
  }

  private async cargar() {
    this.cargando = true;
    this.error = '';
    
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );

      const uid = localStorage.getItem('uid') || '';

      // Cargar aseguradoras para formulario
      const asegPromise = this.firestore.getDocuments('aseguradoras');
      this.aseguradoras = await Promise.race([asegPromise, timeoutPromise]) as any[];

      // Obtener usuario
      const usuariosPromise = this.firestore.getDocumentsWithCondition('usuarios', 'uid', '==', uid);
      const usuarios = await Promise.race([usuariosPromise, timeoutPromise]) as any[];
      const usuario = usuarios[0] || null;

      // Obtener estudiante
      let estudiantes = [];
      if (usuario?.idEstudiante) {
        const estPromise = this.firestore.getDocumentsWithCondition('estudiantes', 'id', '==', usuario.idEstudiante);
        estudiantes = await Promise.race([estPromise, timeoutPromise]) as any[];
      } else {
        const estPromise = this.firestore.getDocumentsWithCondition('estudiantes', 'uidUsuario', '==', uid);
        estudiantes = await Promise.race([estPromise, timeoutPromise]) as any[];
      }
      this.estudiante = estudiantes[0] || null;

      if (!this.estudiante) {
        this.error = 'No se encontró información del estudiante.';
        this.cargando = false;
        this.cdr.markForCheck();
        return;
      }

      // Obtener todos los trámites del estudiante
      const tramitesPromise = this.firestore.getDocumentsWithCondition('tramites', 'uidEstudiante', '==', uid);
      const tramites = await Promise.race([tramitesPromise, timeoutPromise]) as any[];
      this.tramites = tramites.sort((a, b) => this.toDate(b.fechaRegistro).getTime() - this.toDate(a.fechaRegistro).getTime());

    } catch (error) {
      console.error('Error cargando solicitud:', error);
      this.error = 'Error al cargar los datos. Intenta más tarde.';
    }

    this.cargando = false;
    this.cdr.markForCheck();
  }

  seleccionarTramite(tramite: any) {
    this.selectedTramite = tramite;
    this.mostrando = 'detalle';
    
    // Cargar aseguradora
    if (tramite.idAseguradora) {
      this.firestore.getDocumentsWithCondition('aseguradoras', 'id', '==', tramite.idAseguradora).then((docs: any) => {
        this.aseguradora = docs[0] || null;
        this.cdr.markForCheck();
      });
    }
    this.cdr.markForCheck();
  }

  volverALista() {
    this.selectedTramite = null;
    this.mostrando = 'lista';
    this.cdr.markForCheck();
  }

  async crearNuevoTramite() {
    if (!this.nuevaTramiteForm.tipoSeguro || !this.nuevaTramiteForm.idAseguradora) {
      alert('Por favor completa todos los campos');
      return;
    }

    try {
      const uid = localStorage.getItem('uid') || '';
      
      const nuevoTramite = {
        uidEstudiante: uid,
        tipoSeguro: this.nuevaTramiteForm.tipoSeguro,
        idAseguradora: this.nuevaTramiteForm.idAseguradora,
        estadoCaso: 'Pendiente',
        fechaRegistro: new Date().toISOString(),
        codigoUnico: 'TRM-' + Date.now(),
        observaciones: '',
        proximosPasos: []
      };

      await this.firestore.addDocument('tramites', nuevoTramite);
      this.nuevaTramiteForm = { tipoSeguro: '', idAseguradora: '' };
      await this.cargar();
      alert('Trámite creado exitosamente');
    } catch (err) {
      console.error('Error creando trámite:', err);
      alert('Error al crear el trámite');
    }
  }

  async eliminarTramite(tramite: any) {
    if (confirm('¿Estás seguro que deseas eliminar este trámite?')) {
      try {
        await this.firestore.deleteDocument('tramites', tramite.id);
        await this.cargar();
        this.mostrando = 'lista';
        alert('Trámite eliminado exitosamente');
      } catch (err) {
        console.error('Error eliminando trámite:', err);
        alert('Error al eliminar el trámite');
      }
    }
  }

  getEstadoColor(estado: string): string {
    const est = (estado || '').toUpperCase();
    if (est === 'EN_VALIDACION') return 'amber';
    if (est === 'APROBADO') return 'emerald';
    if (est === 'RECHAZADO') return 'red';
    return 'slate';
  }

  private toDate(v: any): Date {
    if (!v) return new Date(0);
    if (v.toDate) return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
}
