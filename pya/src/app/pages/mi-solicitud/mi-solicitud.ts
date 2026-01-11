import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { TramitesHttpService } from '../../services/tramites-http.service';
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
    tipoSeguro: ''
  };
  aseguradoras: any[] = [];
  tiposSeguro = ['Vida Estudiantil', 'Accidental', 'Responsabilidad Civil'];

  constructor(
    private firestore: FirestoreService,
    private api: ApiService,
    private tramitesHttp: TramitesHttpService,
    private cdr: ChangeDetectorRef
  ) {}

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

      // Obtener trámites desde el backend (ya filtrados por UID del usuario)
      try {
        const tramites = await firstValueFrom(this.api.get<any[]>('/tramites'));
        this.tramites = (tramites || []).sort((a: any, b: any) => 
          this.toDate(b.fechaRegistro).getTime() - this.toDate(a.fechaRegistro).getTime()
        );
      } catch (tramitesError) {
        console.error('Error llamando al backend de trámites:', tramitesError);
        this.tramites = [];
      }

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
    
    // Log para debugging
    console.log('[mi-solicitud] Trámite seleccionado:', tramite);
    console.log('[mi-solicitud] Aseguradora:', tramite.aseguradora);
    console.log('[mi-solicitud] Fecha registro:', tramite.fechaRegistro);
    
    // Si el trámite no tiene aseguradora embebida, intentar cargarla desde Firestore
    if (!tramite.aseguradora && tramite.idAseguradora) {
      this.firestore.getDocumentsWithCondition('aseguradoras', 'id', '==', tramite.idAseguradora).then((docs: any) => {
        if (docs && docs[0]) {
          this.selectedTramite.aseguradora = {
            nombre: docs[0].nombre,
            idAseguradora: tramite.idAseguradora
          };
          this.cdr.markForCheck();
        }
      });
    }
    
    this.cdr.markForCheck();
  }

  volverALista() {
    this.selectedTramite = null;
    this.mostrando = 'lista';
    this.cdr.markForCheck();
  }

  getTipoTramiteLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'fallecimiento': 'Vida Estudiantil',
      'accidente': 'Accidental',
      'siniestro': 'Responsabilidad Civil',
      'enfermedad': 'Enfermedad'
    };
    return labels[tipo?.toLowerCase()] || tipo || 'No especificado';
  }

  formatFecha(fecha: any): string {
    if (!fecha) return 'N/A';
    
    console.log('[mi-solicitud] formatFecha input:', fecha, typeof fecha);
    
    try {
      let d: Date;
      
      // Si es un Timestamp de Firestore con toDate()
      if (fecha && typeof fecha.toDate === 'function') {
        d = fecha.toDate();
      }
      // Si tiene _seconds (Firestore Timestamp serializado desde backend)
      else if (fecha && typeof fecha === 'object' && (fecha._seconds || fecha.seconds)) {
        const seconds = fecha._seconds || fecha.seconds;
        d = new Date(seconds * 1000);
      }
      // Si ya es Date o string ISO
      else {
        d = new Date(fecha);
      }
      
      if (isNaN(d.getTime())) {
        console.warn('[mi-solicitud] Fecha inválida:', fecha);
        return 'N/A';
      }
      
      const resultado = d.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
      console.log('[mi-solicitud] Fecha formateada:', resultado);
      return resultado;
    } catch (e) {
      console.error('[mi-solicitud] Error formateando fecha:', e);
      return 'N/A';
    }
  }

  async crearNuevoTramite() {
    if (!this.nuevaTramiteForm.tipoSeguro) {
      alert('Por favor selecciona un tipo de seguro');
      return;
    }

    try {
      const uid = localStorage.getItem('uid') || '';
      
      if (!this.estudiante?.cedula) {
        alert('No se encontró la cédula del estudiante');
        return;
      }

      // Seleccionar automáticamente la primera aseguradora disponible o una por defecto
      const aseguradoraSeleccionada = this.aseguradoras[0];
      if (!aseguradoraSeleccionada) {
        alert('No hay aseguradoras disponibles en el sistema');
        return;
      }

      // Mapear el tipo de seguro a los valores que espera el backend
      let tipoTramite = 'siniestro'; // valor por defecto
      const tipoLower = this.nuevaTramiteForm.tipoSeguro.toLowerCase();
      
      if (tipoLower.includes('accidental') || tipoLower.includes('accidente')) {
        tipoTramite = 'accidente';
      } else if (tipoLower.includes('vida')) {
        tipoTramite = 'fallecimiento';
      }

      // Usar el backend (HttpClient) para crear el trámite (envía notificaciones automáticamente)
      const payload = {
        cedulaEstudiante: this.estudiante.cedula,
        tipoTramite: tipoTramite,
        motivo: `Solicitud de seguro ${this.nuevaTramiteForm.tipoSeguro}`,
        descripcion: `Solicitud realizada desde el portal de estudiantes. Aseguradora asignada automáticamente: ${aseguradoraSeleccionada.nombre}`
      };

      console.log('[mi-solicitud] Enviando payload:', JSON.stringify(payload, null, 2));
      await firstValueFrom(this.tramitesHttp.crearTramite(payload));

      this.nuevaTramiteForm = { tipoSeguro: '' };
      await this.cargar();
      alert('Trámite creado exitosamente. El gestor ha sido notificado.');
    } catch (err: any) {
      console.error('Error creando trámite:', err);
      alert('Error al crear el trámite: ' + (err.message || 'Error desconocido'));
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
