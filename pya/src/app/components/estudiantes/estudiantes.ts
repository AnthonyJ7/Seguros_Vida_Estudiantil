import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FirestoreService } from '../../services/firestore.service';
import { ValidationService } from '../../services/validation.service';
import { AuditService } from '../../services/audit.service';
import { RuleViolation } from '../../services/business-rules.service';

@Component({
  selector: 'app-estudiantes',
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css',
})
export class Estudiantes implements OnInit {
  estudiantes: any[] = [];
  newEstudiante: any = {};
  
  // Control de validación
  errores: RuleViolation[] = [];
  avisos: RuleViolation[] = [];
  mensajeExito: string = '';
  mostrandoFormulario: boolean = false;

  constructor(
    private firestoreService: FirestoreService,
    private validationService: ValidationService,
    private auditService: AuditService
  ) {}

  ngOnInit() {
    this.loadEstudiantes();
  }

  async loadEstudiantes() {
    try {
      this.estudiantes = await this.firestoreService.getDocuments('estudiantes');
      console.log('Estudiantes cargados:', this.estudiantes.length);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
      this.errores = [{
        rule: 'ERROR_CARGA',
        message: 'Error al cargar estudiantes',
        severity: 'ERROR'
      }];
    }
  }

  async addEstudiante() {
    // Limpiar mensajes previos
    this.errores = [];
    this.avisos = [];
    this.mensajeExito = '';

    // Obtener UID del usuario actual
    const usuarioId = localStorage.getItem('uid') || '';

    // Validar y autorizar operación
    const resultado = await this.validationService.crearEstudiante(
      usuarioId,
      this.newEstudiante
    );

    // Si no es válido, mostrar errores
    if (!resultado.exitoso) {
      this.errores = resultado.errores || [];
      this.avisos = resultado.avisos || [];
      console.error('Validación fallida:', resultado.mensaje);
      return;
    }

    // Si hay advertencias, mostrarlas pero continuar
    if (resultado.avisos && resultado.avisos.length > 0) {
      this.avisos = resultado.avisos;
    }

    // Guardar en Firestore
    try {
      const docRef = await this.firestoreService.addDocument('estudiantes', this.newEstudiante);
      
      // Registrar en auditoría
      await this.auditService.registrarCreacion(
        usuarioId,
        'estudiantes',
        docRef,
        this.newEstudiante,
        { tabla: 'estudiantes', accion: 'CREAR' }
      );

      // Mostrar éxito
      this.mensajeExito = `Estudiante "${this.newEstudiante.nombre} ${this.newEstudiante.apellido}" registrado correctamente`;
      this.newEstudiante = {};
      this.mostrandoFormulario = false;
      
      // Recargar lista
      await this.loadEstudiantes();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => {
        this.mensajeExito = '';
      }, 3000);

    } catch (error) {
      console.error('Error guardando estudiante:', error);
      
      // Registrar operación fallida
      await this.auditService.registrarOperacionFallida(
        usuarioId,
        'estudiantes',
        'NUEVO',
        'CREAR',
        String(error),
        this.newEstudiante
      );

      this.errores = [{
        rule: 'ERROR_GUARDADO',
        message: 'Error al guardar el estudiante',
        severity: 'ERROR'
      }];
    }
  }

  async deleteEstudiante(id: string) {
    const usuarioId = localStorage.getItem('uid') || '';
    
    // Confirmar eliminación
    if (!confirm('¿Está seguro de que desea eliminar este estudiante?')) {
      return;
    }

    try {
      // Obtener datos previos para auditoría
      const estudiantes = await this.firestoreService.getDocumentsWithCondition('estudiantes', 'id', '==', id);
      const estudiante = estudiantes && estudiantes.length > 0 ? estudiantes[0] : null;

      // Eliminar
      await this.firestoreService.deleteDocument('estudiantes', id);
      
      // Registrar en auditoría
      await this.auditService.registrarEliminacion(
        usuarioId,
        'estudiantes',
        id,
        estudiante,
        { tabla: 'estudiantes', accion: 'ELIMINAR' }
      );

      // Recargar lista
      this.mensajeExito = 'Estudiante eliminado correctamente';
      await this.loadEstudiantes();
      
      setTimeout(() => {
        this.mensajeExito = '';
      }, 3000);

    } catch (error) {
      console.error('Error eliminando estudiante:', error);
      
      // Registrar operación fallida
      await this.auditService.registrarOperacionFallida(
        usuarioId,
        'estudiantes',
        id,
        'ELIMINAR',
        String(error)
      );

      this.errores = [{
        rule: 'ERROR_ELIMINACION',
        message: 'Error al eliminar el estudiante',
        severity: 'ERROR'
      }];
    }
  }

  toggleFormulario() {
    this.mostrandoFormulario = !this.mostrandoFormulario;
    this.errores = [];
    this.avisos = [];
    if (!this.mostrandoFormulario) {
      this.newEstudiante = {};
    }
  }

  obtenerMensajeError(violation: RuleViolation): string {
    return this.validationService.obtenerMensajeError(violation);
  }
}
