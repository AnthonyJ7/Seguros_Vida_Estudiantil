import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';
import { ValidationService } from '../../services/validation.service';
import { AuditService } from '../../services/audit.service';
import { RuleViolation } from '../../services/business-rules.service';
import { BUSINESS_CONFIG, ConfigHelper, MESSAGE_COLORS } from '../../config/business.config';

@Component({
  selector: 'app-polizas',
  imports: [CommonModule, FormsModule],
  templateUrl: './polizas.html',
  styleUrl: './polizas.css',
})
export class Polizas implements OnInit {
  polizas: any[] = [];
  estudiantes: any[] = [];
  aseguradoras: any[] = [];
  newPoliza: any = {};
  
  // Control de validación
  errores: RuleViolation[] = [];
  avisos: RuleViolation[] = [];
  mensajeExito: string = '';
  mostrandoFormulario: boolean = false;
  
  // Estados disponibles
  estadosValidos = BUSINESS_CONFIG.POLIZA.ESTADOS_VALIDOS;

  constructor(
    private firestoreService: FirestoreService,
    private validationService: ValidationService,
    private auditService: AuditService
  ) {}

  ngOnInit() {
    this.loadDatos();
  }

  async loadDatos() {
    try {
      await Promise.all([
        this.loadPolizas(),
        this.loadEstudiantes(),
        this.loadAseguradoras()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  async loadPolizas() {
    try {
      const polizas = await this.firestoreService.getDocuments('polizas');
      // Enriquecer pólizas con datos de estudiante y aseguradora
      this.polizas = await Promise.all(
        polizas.map(async (poliza) => {
          const estudiantesData = await this.firestoreService.getDocumentsWithCondition('estudiantes', 'id', '==', poliza.idEstudiante);
          const aseguradorasData = await this.firestoreService.getDocumentsWithCondition('aseguradoras', 'id', '==', poliza.idAseguradora);
          const estudiante = estudiantesData && estudiantesData.length > 0 ? estudiantesData[0] : null;
          const aseguradora = aseguradorasData && aseguradorasData.length > 0 ? aseguradorasData[0] : null;
          return {
            ...poliza,
            nombreEstudiante: estudiante?.nombre + ' ' + estudiante?.apellido,
            nombreAseguradora: aseguradora?.nombre
          };
        })
      );
    } catch (error) {
      console.error('Error cargando pólizas:', error);
      this.errores = [{
        rule: 'ERROR_CARGA',
        message: 'Error al cargar pólizas',
        severity: 'ERROR'
      }];
    }
  }

  async loadEstudiantes() {
    try {
      this.estudiantes = await this.firestoreService.getDocuments('estudiantes');
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    }
  }

  async loadAseguradoras() {
    try {
      this.aseguradoras = await this.firestoreService.getDocuments('aseguradoras');
    } catch (error) {
      console.error('Error cargando aseguradoras:', error);
    }
  }

  async addPoliza() {
    // Limpiar mensajes
    this.errores = [];
    this.avisos = [];
    this.mensajeExito = '';

    // Validar que los campos seleccionados están presentes
    if (!this.newPoliza.idEstudiante || !this.newPoliza.idAseguradora) {
      this.errores = [{
        rule: 'CAMPO_OBLIGATORIO',
        message: 'Debe seleccionar estudiante y aseguradora',
        severity: 'ERROR'
      }];
      return;
    }

    const usuarioId = localStorage.getItem('uid') || '';

    // PASO 1: Validar y autorizar
    const resultado = await this.validationService.crearPoliza(usuarioId, this.newPoliza);

    if (!resultado.exitoso) {
      this.errores = resultado.errores || [];
      this.avisos = resultado.avisos || [];
      return;
    }

    // Si hay advertencias, mostrarlas
    if (resultado.avisos && resultado.avisos.length > 0) {
      this.avisos = resultado.avisos;
    }

    // PASO 2: Agregar estado por defecto
    if (!this.newPoliza.estado) {
      this.newPoliza.estado = 'ACTIVA';
    }

    // PASO 3: Guardar en Firestore
    try {
      const docRef = await this.firestoreService.addDocument('polizas', this.newPoliza);

      // PASO 4: Registrar en auditoría
      await this.auditService.registrarCreacion(
        usuarioId,
        'polizas',
        docRef,
        this.newPoliza,
        {
          tabla: 'polizas',
          accion: 'CREAR',
          monto: this.newPoliza.montoCobertura,
          prima: this.newPoliza.prima
        }
      );

      // PASO 5: Mostrar éxito
      this.mensajeExito = `Póliza creada correctamente. Prima: ${ConfigHelper.formatearMoneda(this.newPoliza.prima)}`;
      this.newPoliza = {};
      this.mostrandoFormulario = false;

      // Recargar lista
      await this.loadPolizas();

      // Limpiar mensaje
      setTimeout(() => {
        this.mensajeExito = '';
      }, 3000);

    } catch (error) {
      console.error('Error guardando póliza:', error);

      // Registrar operación fallida
      await this.auditService.registrarOperacionFallida(
        usuarioId,
        'polizas',
        'NUEVA',
        'CREAR',
        String(error),
        this.newPoliza
      );

      this.errores = [{
        rule: 'ERROR_GUARDADO',
        message: 'Error al guardar la póliza',
        severity: 'ERROR'
      }];
    }
  }

  async actualizarEstado(id: string, estadoNuevo: string) {
    const usuarioId = localStorage.getItem('uid') || '';

    try {
      // Obtener datos previos
      const polizasData = await this.firestoreService.getDocumentsWithCondition('polizas', 'id', '==', id);
      const poliza = polizasData && polizasData.length > 0 ? polizasData[0] : null;

      // Actualizar
      await this.firestoreService.updateDocument('polizas', id, { estado: estadoNuevo });

      // Registrar en auditoría
      await this.auditService.registrarActualizacion(
        usuarioId,
        'polizas',
        id,
        { estado: poliza.estado },
        { estado: estadoNuevo },
        { accion: 'CAMBIAR_ESTADO', estadoAnterior: poliza.estado }
      );

      // Recargar
      await this.loadPolizas();
      this.mensajeExito = `Estado actualizado a ${estadoNuevo}`;
      setTimeout(() => { this.mensajeExito = ''; }, 3000);

    } catch (error) {
      console.error('Error actualizando póliza:', error);
      await this.auditService.registrarOperacionFallida(
        usuarioId,
        'polizas',
        id,
        'ACTUALIZAR',
        String(error)
      );

      this.errores = [{
        rule: 'ERROR_ACTUALIZACION',
        message: 'Error al actualizar póliza',
        severity: 'ERROR'
      }];
    }
  }

  async deletePoliza(id: string) {
    if (!confirm('¿Está seguro de que desea eliminar esta póliza?')) {
      return;
    }

    const usuarioId = localStorage.getItem('uid') || '';

    try {
      // Obtener datos previos
      const polizasData = await this.firestoreService.getDocumentsWithCondition('polizas', 'id', '==', id);
      const poliza = polizasData && polizasData.length > 0 ? polizasData[0] : null;

      // Eliminar
      await this.firestoreService.deleteDocument('polizas', id);

      // Registrar en auditoría
      await this.auditService.registrarEliminacion(
        usuarioId,
        'polizas',
        id,
        poliza,
        { tabla: 'polizas', accion: 'ELIMINAR' }
      );

      // Recargar
      this.mensajeExito = 'Póliza eliminada correctamente';
      await this.loadPolizas();
      setTimeout(() => { this.mensajeExito = ''; }, 3000);

    } catch (error) {
      console.error('Error eliminando póliza:', error);
      await this.auditService.registrarOperacionFallida(
        usuarioId,
        'polizas',
        id,
        'ELIMINAR',
        String(error)
      );

      this.errores = [{
        rule: 'ERROR_ELIMINACION',
        message: 'Error al eliminar póliza',
        severity: 'ERROR'
      }];
    }
  }

  toggleFormulario() {
    this.mostrandoFormulario = !this.mostrandoFormulario;
    this.errores = [];
    this.avisos = [];
    if (!this.mostrandoFormulario) {
      this.newPoliza = {};
    }
  }

  obtenerMensajeError(violation: RuleViolation): string {
    return this.validationService.obtenerMensajeError(violation);
  }

  obtenerNombreEstudiante(idEstudiante: string): string {
    const estudiante = this.estudiantes.find(e => e.id === idEstudiante);
    return estudiante ? `${estudiante.nombre} ${estudiante.apellido}` : 'Desconocido';
  }

  formatearMoneda(valor: number): string {
    return ConfigHelper.formatearMoneda(valor);
  }

  formatearFecha(fecha: string): string {
    return ConfigHelper.formatearFecha(fecha);
  }
}
