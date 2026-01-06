import { Injectable } from '@angular/core';
import { BusinessRulesService, ValidationResult, RuleViolation } from './business-rules.service';
import { AuthorizationService } from './authorization.service';
import { AuditService } from './audit.service';

/**
 * SERVICIO DE VALIDACIÓN CENTRALIZADO
 * Integra reglas de negocio, autorización y auditoría
 */

export interface OperationResult {
  exitoso: boolean;
  mensaje: string;
  datos?: any;
  errores?: RuleViolation[];
  avisos?: RuleViolation[];
}

@Injectable({
  providedIn: 'root'
})
export class ValidationService {
  constructor(
    private businessRules: BusinessRulesService,
    private authorization: AuthorizationService,
    private audit: AuditService
  ) {}

  /**
   * CREAR ESTUDIANTE
   */

  async crearEstudiante(usuarioId: string, datosEstudiante: any): Promise<OperationResult> {
    try {
      // 1. Verificar autorización
      const autorizado = await this.authorization.tienePermiso(usuarioId, 'estudiante', 'create');
      if (!autorizado) {
        await this.audit.registrarAccesoDenegado(usuarioId, 'estudiante', 'No autorizado para crear');
        return {
          exitoso: false,
          mensaje: 'No tiene permisos para crear estudiantes',
          errores: [{ rule: 'PERMISO_DENEGADO', message: 'Acceso denegado', severity: 'ERROR' }]
        };
      }

      // 2. Validar reglas de negocio
      const validacion = await this.businessRules.validateEstudianteRegistro(datosEstudiante);
      if (!validacion.isValid) {
        await this.audit.registrarOperacionFallida(usuarioId, 'estudiantes', 'NUEVO', 'CREAR', 'Validación fallida', {
          errores: validacion.violations.filter(v => v.severity === 'ERROR')
        });
        return {
          exitoso: false,
          mensaje: 'Los datos del estudiante no cumplen las reglas de negocio',
          errores: validacion.violations.filter(v => v.severity === 'ERROR'),
          avisos: validacion.violations.filter(v => v.severity === 'WARNING')
        };
      }

      // 3. Si llegamos aquí, las reglas fueron validadas correctamente
      // El componente procederá a guardar en la BD
      return {
        exitoso: true,
        mensaje: 'Datos validados correctamente',
        datos: datosEstudiante
      };
    } catch (error) {
      await this.audit.registrarOperacionFallida(usuarioId, 'estudiantes', 'NUEVO', 'CREAR', `Error: ${error}`);
      return {
        exitoso: false,
        mensaje: 'Error al validar datos del estudiante',
        errores: [{ rule: 'ERROR_SISTEMA', message: String(error), severity: 'ERROR' }]
      };
    }
  }

  /**
   * CREAR PÓLIZA
   */

  async crearPoliza(usuarioId: string, datosPoliza: any): Promise<OperationResult> {
    try {
      // 1. Verificar autorización
      const autorizado = await this.authorization.tienePermiso(usuarioId, 'poliza', 'create');
      if (!autorizado) {
        await this.audit.registrarAccesoDenegado(usuarioId, 'poliza', 'No autorizado para crear');
        return {
          exitoso: false,
          mensaje: 'No tiene permisos para crear pólizas'
        };
      }

      // 2. Validar reglas de negocio
      const validacion = await this.businessRules.validatePolizaCreacion(datosPoliza);
      if (!validacion.isValid) {
        await this.audit.registrarOperacionFallida(usuarioId, 'polizas', 'NUEVA', 'CREAR', 'Validación fallida', {
          errores: validacion.violations.filter(v => v.severity === 'ERROR')
        });
        return {
          exitoso: false,
          mensaje: 'Los datos de la póliza no cumplen las reglas de negocio',
          errores: validacion.violations.filter(v => v.severity === 'ERROR'),
          avisos: validacion.violations.filter(v => v.severity === 'WARNING')
        };
      }

      return {
        exitoso: true,
        mensaje: 'Datos validados correctamente',
        datos: datosPoliza
      };
    } catch (error) {
      await this.audit.registrarOperacionFallida(usuarioId, 'polizas', 'NUEVA', 'CREAR', `Error: ${error}`);
      return {
        exitoso: false,
        mensaje: 'Error al validar datos de la póliza'
      };
    }
  }

  /**
   * REGISTRAR SINIESTRO
   */

  async registrarSiniestro(usuarioId: string, datosSiniestro: any): Promise<OperationResult> {
    try {
      // 1. Verificar autorización
      const autorizado = await this.authorization.tienePermiso(usuarioId, 'siniestro', 'create');
      if (!autorizado) {
        await this.audit.registrarAccesoDenegado(usuarioId, 'siniestro', 'No autorizado para crear');
        return {
          exitoso: false,
          mensaje: 'No tiene permisos para registrar siniestros'
        };
      }

      // 2. Validar reglas de negocio
      const validacion = await this.businessRules.validateSiniestroRegistro(datosSiniestro);
      if (!validacion.isValid) {
        await this.audit.registrarOperacionFallida(usuarioId, 'siniestros', 'NUEVO', 'CREAR', 'Validación fallida', {
          errores: validacion.violations.filter(v => v.severity === 'ERROR')
        });
        return {
          exitoso: false,
          mensaje: 'Los datos del siniestro no cumplen las reglas de negocio',
          errores: validacion.violations.filter(v => v.severity === 'ERROR'),
          avisos: validacion.violations.filter(v => v.severity === 'WARNING')
        };
      }

      return {
        exitoso: true,
        mensaje: 'Siniestro validado correctamente',
        datos: datosSiniestro
      };
    } catch (error) {
      await this.audit.registrarOperacionFallida(usuarioId, 'siniestros', 'NUEVO', 'CREAR', `Error: ${error}`);
      return {
        exitoso: false,
        mensaje: 'Error al validar datos del siniestro'
      };
    }
  }

  /**
   * SUBIR DOCUMENTO
   */

  async subirDocumento(usuarioId: string, datosDocumento: any): Promise<OperationResult> {
    try {
      // 1. Verificar autorización
      const autorizado = await this.authorization.tienePermiso(usuarioId, 'documento', 'create');
      if (!autorizado) {
        await this.audit.registrarAccesoDenegado(usuarioId, 'documento', 'No autorizado para subir');
        return {
          exitoso: false,
          mensaje: 'No tiene permisos para subir documentos'
        };
      }

      // 2. Validar reglas de negocio
      const validacion = await this.businessRules.validateDocumentoSubida(datosDocumento);
      if (!validacion.isValid) {
        await this.audit.registrarOperacionFallida(usuarioId, 'documentos', 'NUEVO', 'SUBIR', 'Validación fallida', {
          errores: validacion.violations.filter(v => v.severity === 'ERROR')
        });
        return {
          exitoso: false,
          mensaje: 'El documento no cumple los requisitos',
          errores: validacion.violations.filter(v => v.severity === 'ERROR')
        };
      }

      return {
        exitoso: true,
        mensaje: 'Documento validado correctamente',
        datos: datosDocumento
      };
    } catch (error) {
      await this.audit.registrarOperacionFallida(usuarioId, 'documentos', 'NUEVO', 'SUBIR', `Error: ${error}`);
      return {
        exitoso: false,
        mensaje: 'Error al validar documento'
      };
    }
  }

  /**
   * CREAR USUARIO
   */

  async crearUsuario(usuarioCreadorId: string, datosUsuario: any): Promise<OperationResult> {
    try {
      // 1. Verificar autorización (solo ADMIN puede crear usuarios)
      const esAdmin = await this.authorization.esAdmin(usuarioCreadorId);
      if (!esAdmin) {
        await this.audit.registrarAccesoDenegado(usuarioCreadorId, 'usuario', 'No es ADMIN');
        return {
          exitoso: false,
          mensaje: 'Solo administradores pueden crear usuarios'
        };
      }

      // 2. Validar reglas de negocio
      datosUsuario.creadoPor = usuarioCreadorId;
      const validacion = await this.businessRules.validateUsuarioCreacion(datosUsuario);
      if (!validacion.isValid) {
        await this.audit.registrarOperacionFallida(usuarioCreadorId, 'usuarios', 'NUEVO', 'CREAR', 'Validación fallida', {
          errores: validacion.violations.filter(v => v.severity === 'ERROR')
        });
        return {
          exitoso: false,
          mensaje: 'Los datos del usuario no cumplen las reglas',
          errores: validacion.violations.filter(v => v.severity === 'ERROR')
        };
      }

      return {
        exitoso: true,
        mensaje: 'Usuario validado correctamente',
        datos: datosUsuario
      };
    } catch (error) {
      await this.audit.registrarOperacionFallida(usuarioCreadorId, 'usuarios', 'NUEVO', 'CREAR', `Error: ${error}`);
      return {
        exitoso: false,
        mensaje: 'Error al validar datos del usuario'
      };
    }
  }

  /**
   * AGREGAR BENEFICIARIO
   */

  async agregarBeneficiario(usuarioId: string, datosBeneficiario: any): Promise<OperationResult> {
    try {
      // 1. Verificar autorización
      const autorizado = await this.authorization.tienePermiso(usuarioId, 'beneficiario', 'create');
      if (!autorizado) {
        await this.audit.registrarAccesoDenegado(usuarioId, 'beneficiario', 'No autorizado');
        return {
          exitoso: false,
          mensaje: 'No tiene permisos para agregar beneficiarios'
        };
      }

      // 2. Validar reglas de negocio
      const validacion = await this.businessRules.validateBeneficiario(datosBeneficiario);
      if (!validacion.isValid) {
        return {
          exitoso: false,
          mensaje: 'Los datos del beneficiario no son válidos',
          errores: validacion.violations.filter(v => v.severity === 'ERROR')
        };
      }

      return {
        exitoso: true,
        mensaje: 'Beneficiario validado correctamente',
        datos: datosBeneficiario
      };
    } catch (error) {
      await this.audit.registrarOperacionFallida(usuarioId, 'beneficiarios', 'NUEVO', 'CREAR', `Error: ${error}`);
      return {
        exitoso: false,
        mensaje: 'Error al validar beneficiario'
      };
    }
  }

  /**
   * OBTENER MENSAJE DE ERROR AMIGABLE
   */

  obtenerMensajeError(violation: RuleViolation): string {
    const mensajes: any = {
      'EDAD_MINIMA': 'El estudiante debe ser mayor de 18 años',
      'DOCUMENTO_DUPLICADO': 'Este documento ya está registrado en el sistema',
      'EMAIL_DUPLICADO': 'Este email ya está registrado',
      'POLIZA_DUPLICADA': 'Este estudiante ya tiene una póliza vigente',
      'POLIZA_NO_VIGENTE': 'La póliza no está vigente',
      'FECHA_FUERA_COBERTURA': 'La fecha está fuera del período de cobertura',
      'MONTO_EXCEDE_COBERTURA': 'El monto solicitado excede la cobertura disponible',
      'PASSWORD_DEBIL': 'La contraseña debe tener al menos 8 caracteres, incluir mayúscula, número y símbolo',
      'PERMISO_DENEGADO': 'No tiene permisos para realizar esta acción'
    };

    return mensajes[violation.rule] || violation.message;
  }
}
