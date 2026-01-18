import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { FirestoreService } from '../../services/firestore.service';
import { DocumentosHttpService } from '../../services/documentos-http.service';

@Component({
  selector: 'app-envio-documentos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './envio-documentos.html'
})
export class EnvioDocumentosComponent implements OnInit {
  cargando = true;
  estudiante: any = null;
  tramite: any = null;
  documentosRequeridos: any[] = [];
  documentosEnviados: any[] = [];
  archivoSeleccionado: { [key: string]: File | null } = {};
  cargandoDocumentos: { [key: string]: boolean } = {};
  error = '';
  success = '';

  constructor(
    private firestore: FirestoreService,
    private documentosHttp: DocumentosHttpService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.cargar();
  }

  private async cargar() {
    this.cargando = true;
    this.error = '';
    
    try {
      // Timeout de 5 segundos
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout cargando documentos')), 5000)
      );

      const uid = localStorage.getItem('uid') || '';

      // Obtener usuario primero
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
        return;
      }

      // Obtener trámite activo
      const tramitesPromise = this.firestore.getDocumentsWithCondition('tramites', 'idEstudiante', '==', this.estudiante.id);
      const tramites = await Promise.race([tramitesPromise, timeoutPromise]) as any[];
      this.tramite = tramites.sort((a, b) => this.toDate(b.fechaRegistro).getTime() - this.toDate(a.fechaRegistro).getTime())[0] || null;

      if (!this.tramite) {
        this.error = 'No hay trámites registrados.';
        this.cargando = false;
        return;
      }

      // Cargar documentos requeridos según el tipo de seguro
      this.cargarDocumentosRequeridos();

      // Cargar documentos enviados
      const documentosPromise = this.firestore.getDocumentsWithCondition('documentos', 'idTramite', '==', this.tramite.id);
      const documentos = await Promise.race([documentosPromise, timeoutPromise]) as any[];
      this.documentosEnviados = documentos || [];

    } catch (error) {
      console.error('Error cargando documentos:', error);
      this.error = 'Error al cargar los documentos. Intenta más tarde.';
    }

    this.cargando = false;
    this.cdr.markForCheck();
  }

  private cargarDocumentosRequeridos() {
    // Documentos básicos requeridos
    const basicos = [
      { id: 'cedula', nombre: 'Cédula de Identidad', descripcion: 'Documento de identidad válido', obligatorio: true },
      { id: 'certificado-medico', nombre: 'Certificado Médico', descripcion: 'Certificado de salud actualizado', obligatorio: true },
      { id: 'formulario-solicitud', nombre: 'Formulario de Solicitud', descripcion: 'Formulario completado y firmado', obligatorio: true },
    ];

    // Documentos adicionales según el tipo de seguro
    const adicionales: any[] = [];
    if (this.tramite.tipoSeguro?.toUpperCase().includes('ACCIDENTE')) {
      adicionales.push({ id: 'reporte-accidente', nombre: 'Reporte de Accidente', descripcion: 'Documento del incidente', obligatorio: false });
    }
    if (this.tramite.tipoSeguro?.toUpperCase().includes('HOSPITALIZACIÓN')) {
      adicionales.push({ id: 'comprobante-hospitalizacion', nombre: 'Comprobante de Hospitalización', descripcion: 'Recibos y facturas', obligatorio: false });
    }

    this.documentosRequeridos = [...basicos, ...adicionales].map(doc => ({
      ...doc,
      estado: this.getEstadoDocumento(doc.id)
    }));
  }

  private getEstadoDocumento(idDocumento: string): string {
    const enviado = this.documentosEnviados.find(d => d.idDocumento === idDocumento || d.tipo === idDocumento);
    if (!enviado) return 'pendiente';
    // Si el backend marcó validado -> aprobado, caso contrario enviado/pendiente-revision
    if (enviado.validado) return 'aprobado';
    return enviado.estado || 'enviado';
  }

  onFileSelected(docId: string, event: any) {
    const file = event.target.files[0];
    this.archivoSeleccionado[docId] = file || null;
  }

  async subirDocumento(docId: string, docNombre: string) {
    if (!this.archivoSeleccionado[docId]) {
      alert('Por favor selecciona un archivo');
      return;
    }

    this.cargandoDocumentos[docId] = true;
    this.error = '';
    this.success = '';

    try {
      const archivo = this.archivoSeleccionado[docId];

      // Subir vía backend para evitar problemas de CORS y notificar al gestor/admin
      await lastValueFrom(this.documentosHttp.subirArchivo(this.tramite.id, archivo!, docId));

      this.success = `Documento "${docNombre}" subido exitosamente.`;
      this.archivoSeleccionado[docId] = null;

      // Recargar documentos
      await this.cargar();

      // Limpiar mensaje
      setTimeout(() => {
        this.success = '';
      }, 3000);

    } catch (error) {
      console.error('Error subiendo documento:', error);
      this.error = `Error al subir el documento. Intenta de nuevo.`;
    } finally {
      this.cargandoDocumentos[docId] = false;
    }
  }

  getEstadoBadge(estado: string): string {
    if (estado === 'aprobado') return 'bg-emerald-100 text-emerald-800';
    if (estado === 'rechazado') return 'bg-red-100 text-red-800';
    if (estado === 'enviado' || estado === 'pendiente-revision') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-800';
  }

  getEstadoTexto(estado: string): string {
    if (estado === 'aprobado') return '✓ Aprobado';
    if (estado === 'rechazado') return '✗ Rechazado';
    if (estado === 'enviado' || estado === 'pendiente-revision') return '⏳ En Revisión';
    return '○ Pendiente';
  }

  private toDate(v: any): Date {
    if (!v) return new Date(0);
    if (v.toDate) return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }

  getAprobadosCount(): number {
    return this.documentosRequeridos.filter(d => d.estado === 'aprobado').length;
  }

  getPendientesCount(): number {
    return this.documentosRequeridos.filter(d => d.estado === 'pendiente').length;
  }
}
