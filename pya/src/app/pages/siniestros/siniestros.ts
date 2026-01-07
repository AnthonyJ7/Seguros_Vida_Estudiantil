import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TramitesHttpService } from '../../services/tramites-http.service';
import { DocumentosHttpService } from '../../services/documentos-http.service';
import { EstudiantesHttpService } from '../../services/estudiantes-http.service';

@Component({
  selector: 'app-siniestros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './siniestros.html',
  styleUrl: './siniestros.css',
})
export class SiniestrosComponent implements OnInit {
  siniestros: any[] = [];
  loading = true;
  error = '';
  // Backend testing helpers
  creando = false;
  backendMsg = '';
  nuevo = {
    idEstudiante: '',
    tipo: 'SINIESTRO',
    descripcion: ''
  } as any;
  tramiteId = '';
  idAseguradora = '';
  referenciaPago = '';

  constructor(
    // private firestoreService: FirestoreService,
    private authService: AuthService,
    private location: Location,
    private tramitesHttp: TramitesHttpService,
    private documentosHttp: DocumentosHttpService,
    private estudiantesHttp: EstudiantesHttpService
  ) {}

  async ngOnInit() {
    try {
      const rol = this.authService.getRole();
      const uid = localStorage.getItem('uid') || '';
      let docs: any[] = [];
      if (rol === 'GESTOR' || rol === 'ADMIN') {
        docs = await new Promise<any[]>((resolve, reject) => {
          this.tramitesHttp.listar().subscribe({ next: resolve, error: reject });
        });
      } else {
        // Obtener estudiante desde backend y listar por estudiante
        const allEst = await new Promise<any[]>((resolve, reject) => {
          this.estudiantesHttp.listar().subscribe({ next: resolve, error: reject });
        });
        const estudiante = allEst.find(e => e.uidUsuario === uid);
        const estId = estudiante ? (estudiante.id || estudiante.idEstudiante) : null;
        docs = estId
          ? await new Promise<any[]>((resolve, reject) => {
              this.tramitesHttp.listar({ estudiante: estId }).subscribe({ next: resolve, error: reject });
            })
          : [];
      }
      // Convertir fechas si es necesario
      this.siniestros = docs.map(doc => ({
        ...doc,
        fechaRegistro: (() => {
          if (doc.fechaRegistro && doc.fechaRegistro.toDate) return doc.fechaRegistro.toDate();
          const parsed = new Date(doc.fechaRegistro);
          return isNaN(parsed.getTime()) ? new Date() : parsed;
        })()
      }));
    } catch (e: any) {
      this.error = 'Backend no disponible o error al cargar siniestros';
    }
    this.loading = false;
  }

  goBack() {
    this.location.back();
  }

  // ===== Backend flow testers =====
  crearTramiteBackend() {
    this.backendMsg = '';
    this.creando = true;
    this.tramitesHttp.crearTramite({
      idEstudiante: this.nuevo.idEstudiante,
      tipo: this.nuevo.tipo,
      descripcion: this.nuevo.descripcion
    }).subscribe({
      next: (resp: any) => {
        this.creando = false;
        this.tramiteId = resp?.id || resp?.idTramite || '';
        this.backendMsg = `Trámite creado: ${this.tramiteId}`;
      },
      error: (err) => {
        this.creando = false;
        this.backendMsg = err?.error?.message || 'Error creando trámite';
      }
    });
  }

  validarBackend() {
    if (!this.tramiteId) return;
    this.backendMsg = '';
    this.tramitesHttp.validarTramite(this.tramiteId).subscribe({
      next: () => this.backendMsg = 'Validado OK',
      error: (err) => this.backendMsg = err?.error?.message || 'Error validando'
    });
  }

  enviarAsegBackend() {
    if (!this.tramiteId || !this.idAseguradora) return;
    this.backendMsg = '';
    this.tramitesHttp.enviarAAseguradora(this.tramiteId, this.idAseguradora).subscribe({
      next: () => this.backendMsg = 'Enviado a aseguradora',
      error: (err) => this.backendMsg = err?.error?.message || 'Error al enviar'
    });
  }

  aprobarBackend() {
    if (!this.tramiteId) return;
    this.backendMsg = '';
    this.tramitesHttp.registrarResultado(this.tramiteId, true, 'Aprobado desde UI', 100).subscribe({
      next: () => this.backendMsg = 'Resultado registrado: APROBADO',
      error: (err) => this.backendMsg = err?.error?.message || 'Error resultado'
    });
  }

  solicitarCorreccionesBackend() {
    if (!this.tramiteId) return;
    this.backendMsg = '';
    this.tramitesHttp.solicitarCorrecciones(this.tramiteId, 'Documento borroso - documento_identidad requerido').subscribe({
      next: () => this.backendMsg = 'Correcciones solicitadas',
      error: (err) => this.backendMsg = err?.error?.message || 'Error correcciones'
    });
  }

  confirmarPagoBackend() {
    if (!this.tramiteId || !this.referenciaPago) return;
    this.backendMsg = '';
    this.tramitesHttp.confirmarPago(this.tramiteId, this.referenciaPago).subscribe({
      next: () => this.backendMsg = 'Pago confirmado',
      error: (err) => this.backendMsg = err?.error?.message || 'Error pago'
    });
  }

  verHistorialBackend() {
    if (!this.tramiteId) return;
    this.backendMsg = '';
    this.tramitesHttp.historial(this.tramiteId).subscribe({
      next: (h) => this.backendMsg = JSON.stringify(h),
      error: (err) => this.backendMsg = err?.error?.message || 'Error historial'
    });
  }

  archivo?: File;
  tipoDocumento = 'IDENTIDAD';
  onArchivoChange(event: any) {
    const f: File | undefined = event?.target?.files?.[0];
    this.archivo = f || undefined;
  }
  subirDocumentoBackend() {
    if (!this.tramiteId || !this.archivo) return;
    this.backendMsg = '';
    this.documentosHttp.subirArchivo(this.tramiteId, this.archivo, this.tipoDocumento).subscribe({
      next: () => this.backendMsg = 'Documento subido',
      error: (err) => this.backendMsg = err?.error?.message || 'Error subiendo documento'
    });
  }
}
