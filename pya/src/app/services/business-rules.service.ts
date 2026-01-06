import { Injectable } from '@angular/core';
import { FirestoreService } from './firestore.service';

/**
 * SERVICIO DE REGLAS DE NEGOCIO
 * Valida la lógica de negocio para todas las operaciones críticas
 */

export interface RuleViolation {
  rule: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ValidationResult {
  isValid: boolean;
  violations: RuleViolation[];
}

@Injectable({
  providedIn: 'root'
})
export class BusinessRulesService {
  constructor(private firestore: FirestoreService) {}

  /**
   * VALIDACIONES DE ESTUDIANTES
   */

  async validateEstudianteRegistro(estudianteData: any): Promise<ValidationResult> {
    const violations: RuleViolation[] = [];

    // Regla 1: Validar mayoría de edad (mínimo 18 años)
    if (estudianteData.fechaNacimiento) {
      const edad = this.calcularEdad(estudianteData.fechaNacimiento);
      if (edad < 18) {
        violations.push({
          rule: 'EDAD_MINIMA',
          message: 'El estudiante debe ser mayor de 18 años',
          severity: 'ERROR'
        });
      }
    }

    // Regla 2: Validar documento único
    if (estudianteData.documento) {
      const existente = await this.firestore.getDocumentsWithCondition(
        'estudiantes',
        'documento',
        '==',
        estudianteData.documento
      );
      if (existente.length > 0) {
        violations.push({
          rule: 'DOCUMENTO_DUPLICADO',
          message: 'Ya existe un estudiante registrado con este documento',
          severity: 'ERROR'
        });
      }
    }

    // Regla 3: Validar correo único
    if (estudianteData.email) {
      const existente = await this.firestore.getDocumentsWithCondition(
        'estudiantes',
        'email',
        '==',
        estudianteData.email
      );
      if (existente.length > 0) {
        violations.push({
          rule: 'EMAIL_DUPLICADO',
          message: 'Ya existe un estudiante registrado con este email',
          severity: 'ERROR'
        });
      }
    }

    // Regla 4: Validar campos obligatorios
    const camposObligatorios = ['nombre', 'apellido', 'documento', 'email', 'telefonoContacto'];
    for (const campo of camposObligatorios) {
      if (!estudianteData[campo]) {
        violations.push({
          rule: 'CAMPO_OBLIGATORIO',
          message: `El campo ${campo} es obligatorio`,
          severity: 'ERROR'
        });
      }
    }

    // Regla 5: Validar formato de email
    if (!this.isValidEmail(estudianteData.email)) {
      violations.push({
        rule: 'EMAIL_INVALIDO',
        message: 'El formato del email no es válido',
        severity: 'ERROR'
      });
    }

    // Regla 6: Validar teléfono
    if (!this.isValidPhone(estudianteData.telefonoContacto)) {
      violations.push({
        rule: 'TELEFONO_INVALIDO',
        message: 'El formato del teléfono no es válido',
        severity: 'ERROR'
      });
    }

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    };
  }

  /**
   * VALIDACIONES DE PÓLIZAS
   */

  async validatePolizaCreacion(polizaData: any): Promise<ValidationResult> {
    const violations: RuleViolation[] = [];

    // Regla 1: Validar que el estudiante existe
    if (polizaData.idEstudiante) {
      const estudiantes = await this.firestore.getDocumentsWithCondition('estudiantes', 'id', '==', polizaData.idEstudiante);
      if (!estudiantes || estudiantes.length === 0) {
        violations.push({
          rule: 'ESTUDIANTE_NO_EXISTE',
          message: 'El estudiante no existe en el sistema',
          severity: 'ERROR'
        });
      }
    }

    // Regla 2: Validar que el estudiante no tenga póliza vigente
    if (polizaData.idEstudiante) {
      const polizasVigentes = await this.firestore.getDocumentsWithCondition(
        'polizas',
        'idEstudiante',
        '==',
        polizaData.idEstudiante
      );
      const activas = polizasVigentes.filter(p => p.estado === 'ACTIVA' || p.estado === 'VIGENTE');
      if (activas.length > 0) {
        violations.push({
          rule: 'POLIZA_DUPLICADA',
          message: 'El estudiante ya tiene una póliza vigente',
          severity: 'ERROR'
        });
      }
    }

    // Regla 3: Validar aseguradora existe
    if (polizaData.idAseguradora) {
      const aseguradoras = await this.firestore.getDocumentsWithCondition('aseguradoras', 'id', '==', polizaData.idAseguradora);
      if (!aseguradoras || aseguradoras.length === 0) {
        violations.push({
          rule: 'ASEGURADORA_NO_EXISTE',
          message: 'La aseguradora no existe',
          severity: 'ERROR'
        });
      }
    }

    // Regla 4: Validar fechas
    if (polizaData.fechaInicio && polizaData.fechaVencimiento) {
      const inicio = new Date(polizaData.fechaInicio);
      const vencimiento = new Date(polizaData.fechaVencimiento);
      if (inicio >= vencimiento) {
        violations.push({
          rule: 'FECHAS_INVALIDAS',
          message: 'La fecha de inicio debe ser anterior a la fecha de vencimiento',
          severity: 'ERROR'
        });
      }
    }

    // Regla 5: Validar prima
    if (!polizaData.prima || polizaData.prima <= 0) {
      violations.push({
        rule: 'PRIMA_INVALIDA',
        message: 'La prima debe ser un valor positivo',
        severity: 'ERROR'
      });
    }

    // Regla 6: Validar cobertura
    if (!polizaData.montoCobertura || polizaData.montoCobertura <= 0) {
      violations.push({
        rule: 'COBERTURA_INVALIDA',
        message: 'El monto de cobertura debe ser un valor positivo',
        severity: 'ERROR'
      });
    }

    // Regla 7: Validar relación prima-cobertura (prima no debe exceder el 10% de cobertura)
    if (polizaData.prima && polizaData.montoCobertura) {
      const ratio = (polizaData.prima / polizaData.montoCobertura) * 100;
      if (ratio > 10) {
        violations.push({
          rule: 'PRIMA_COBERTURA_RATIO',
          message: 'La prima no debe exceder el 10% del monto de cobertura',
          severity: 'WARNING'
        });
      }
    }

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    };
  }

  /**
   * VALIDACIONES DE SINIESTROS
   */

  async validateSiniestroRegistro(siniestroData: any): Promise<ValidationResult> {
    const violations: RuleViolation[] = [];

    // Regla 1: Validar que la póliza existe
    if (siniestroData.idPoliza) {
      const polizas = await this.firestore.getDocumentsWithCondition('polizas', 'id', '==', siniestroData.idPoliza);
      if (!polizas || polizas.length === 0) {
        violations.push({
          rule: 'POLIZA_NO_EXISTE',
          message: 'La póliza no existe',
          severity: 'ERROR'
        });
      } else {
        const poliza = polizas[0];
        // Regla 2: Validar que la póliza está vigente
        if (poliza.estado !== 'ACTIVA' && poliza.estado !== 'VIGENTE') {
          violations.push({
            rule: 'POLIZA_NO_VIGENTE',
            message: 'La póliza no está vigente',
            severity: 'ERROR'
          });
        }

        // Regla 3: Validar que la fecha del siniestro está dentro del período de cobertura
        if (siniestroData.fechaOcurrencia) {
          const fechaSiniestro = new Date(siniestroData.fechaOcurrencia);
          const fechaInicio = new Date(poliza.fechaInicio);
          const fechaVencimiento = new Date(poliza.fechaVencimiento);

          if (fechaSiniestro < fechaInicio || fechaSiniestro > fechaVencimiento) {
            violations.push({
              rule: 'FECHA_FUERA_COBERTURA',
              message: 'La fecha del siniestro está fuera del período de cobertura',
              severity: 'ERROR'
            });
          }
        }

        // Regla 4: Validar monto reclamado no exceda cobertura
        if (siniestroData.montoReclamado && poliza.montoCobertura) {
          if (siniestroData.montoReclamado > poliza.montoCobertura) {
            violations.push({
              rule: 'MONTO_EXCEDE_COBERTURA',
              message: 'El monto reclamado excede el monto de cobertura de la póliza',
              severity: 'ERROR'
            });
          }
        }
      }
    }

    // Regla 5: Validar descripción del siniestro
    if (!siniestroData.descripcion || siniestroData.descripcion.trim().length < 10) {
      violations.push({
        rule: 'DESCRIPCION_INSUFICIENTE',
        message: 'La descripción del siniestro debe tener al menos 10 caracteres',
        severity: 'ERROR'
      });
    }

    // Regla 6: Validar tipo de siniestro válido
    const tiposValidos = ['MUERTE', 'INVALIDEZ', 'ENFERMEDAD', 'ACCIDENTE'];
    if (!tiposValidos.includes(siniestroData.tipo)) {
      violations.push({
        rule: 'TIPO_SINIESTRO_INVALIDO',
        message: `Tipo de siniestro debe ser uno de: ${tiposValidos.join(', ')}`,
        severity: 'ERROR'
      });
    }

    // Regla 7: Validar que no hay siniestro duplicado en los últimos 30 días
    if (siniestroData.idPoliza && siniestroData.fechaOcurrencia) {
      const siniestrosRecientes = await this.firestore.getDocumentsWithCondition(
        'siniestros',
        'idPoliza',
        '==',
        siniestroData.idPoliza
      );
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);

      const duplicados = siniestrosRecientes.filter(s => {
        const fecha = new Date(s.fechaOcurrencia);
        return fecha > hace30Dias && s.tipo === siniestroData.tipo;
      });

      if (duplicados.length > 0) {
        violations.push({
          rule: 'SINIESTRO_DUPLICADO',
          message: 'Ya existe un siniestro del mismo tipo en los últimos 30 días',
          severity: 'WARNING'
        });
      }
    }

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    };
  }

  /**
   * VALIDACIONES DE USUARIOS
   */

  async validateUsuarioCreacion(usuarioData: any): Promise<ValidationResult> {
    const violations: RuleViolation[] = [];

    // Regla 1: Validar email único
    if (usuarioData.email) {
      const existente = await this.firestore.getDocumentsWithCondition(
        'usuarios',
        'email',
        '==',
        usuarioData.email
      );
      if (existente.length > 0) {
        violations.push({
          rule: 'EMAIL_DUPLICADO',
          message: 'Ya existe un usuario con este email',
          severity: 'ERROR'
        });
      }
    }

    // Regla 2: Validar rol válido
    const rolesValidos = ['ADMIN', 'INSURER', 'GESTOR', 'CLIENTE', 'AUDITOR'];
    if (!rolesValidos.includes(usuarioData.rol)) {
      violations.push({
        rule: 'ROL_INVALIDO',
        message: `El rol debe ser uno de: ${rolesValidos.join(', ')}`,
        severity: 'ERROR'
      });
    }

    // Regla 3: Validar contraseña segura (mínimo 8 caracteres, mayúscula, número, especial)
    if (usuarioData.password) {
      if (!this.isStrongPassword(usuarioData.password)) {
        violations.push({
          rule: 'PASSWORD_DEBIL',
          message: 'La contraseña debe tener al menos 8 caracteres, incluir mayúscula, número y símbolo especial',
          severity: 'ERROR'
        });
      }
    }

    // Regla 4: Validar campos obligatorios
    const camposObligatorios = ['nombre', 'email', 'rol'];
    for (const campo of camposObligatorios) {
      if (!usuarioData[campo]) {
        violations.push({
          rule: 'CAMPO_OBLIGATORIO',
          message: `El campo ${campo} es obligatorio`,
          severity: 'ERROR'
        });
      }
    }

    // Regla 5: Validar email válido
    if (!this.isValidEmail(usuarioData.email)) {
      violations.push({
        rule: 'EMAIL_INVALIDO',
        message: 'El formato del email no es válido',
        severity: 'ERROR'
      });
    }

    // Regla 6: Solo ADMIN puede crear ADMIN
    if (usuarioData.rol === 'ADMIN') {
      const usuariosCreador = await this.firestore.getDocumentsWithCondition('usuarios', 'id', '==', usuarioData.creadoPor);
      if (!usuariosCreador || usuariosCreador.length === 0 || usuariosCreador[0].rol !== 'ADMIN') {
        violations.push({
          rule: 'PERMISO_ADMIN_DENEGADO',
          message: 'Solo un ADMIN puede crear otro ADMIN',
          severity: 'ERROR'
        });
      }
    }

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    };
  }

  /**
   * VALIDACIONES DE DOCUMENTOS
   */

  async validateDocumentoSubida(documento: any): Promise<ValidationResult> {
    const violations: RuleViolation[] = [];

    // Regla 1: Validar tipo de archivo
    const tiposPermitidos = ['application/pdf', 'image/png', 'image/jpeg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!tiposPermitidos.includes(documento.tipo)) {
      violations.push({
        rule: 'TIPO_ARCHIVO_NO_PERMITIDO',
        message: `Solo se permiten archivos: PDF, PNG, JPEG, DOC, DOCX`,
        severity: 'ERROR'
      });
    }

    // Regla 2: Validar tamaño máximo (10MB)
    const maxSizeMB = 10;
    if (documento.tamanio > maxSizeMB * 1024 * 1024) {
      violations.push({
        rule: 'ARCHIVO_DEMASIADO_GRANDE',
        message: `El archivo no debe exceder ${maxSizeMB}MB`,
        severity: 'ERROR'
      });
    }

    // Regla 3: Validar que el trámite existe
    if (documento.idTramite) {
      const tramites = await this.firestore.getDocumentsWithCondition('tramites', 'id', '==', documento.idTramite);
      if (!tramites || tramites.length === 0) {
        violations.push({
          rule: 'TRAMITE_NO_EXISTE',
          message: 'El trámite no existe',
          severity: 'ERROR'
        });
      }
    }

    // Regla 4: Validar nombre del archivo
    if (!documento.nombreArchivo || documento.nombreArchivo.trim().length === 0) {
      violations.push({
        rule: 'NOMBRE_ARCHIVO_VACIO',
        message: 'El nombre del archivo no puede estar vacío',
        severity: 'ERROR'
      });
    }

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    };
  }

  /**
   * VALIDACIONES DE BENEFICIARIOS
   */

  async validateBeneficiario(beneficiarioData: any): Promise<ValidationResult> {
    const violations: RuleViolation[] = [];

    // Regla 1: Validar parentesco válido
    const parentescos = ['ESPOSO/A', 'HIJO/A', 'PADRE', 'MADRE', 'HERMANO/A', 'OTRO'];
    if (!parentescos.includes(beneficiarioData.parentesco)) {
      violations.push({
        rule: 'PARENTESCO_INVALIDO',
        message: `El parentesco debe ser uno de: ${parentescos.join(', ')}`,
        severity: 'ERROR'
      });
    }

    // Regla 2: Validar porcentaje entre 0 y 100
    if (!beneficiarioData.porcentaje || beneficiarioData.porcentaje <= 0 || beneficiarioData.porcentaje > 100) {
      violations.push({
        rule: 'PORCENTAJE_INVALIDO',
        message: 'El porcentaje debe estar entre 1 y 100',
        severity: 'ERROR'
      });
    }

    // Regla 3: Validar documento del beneficiario
    if (!beneficiarioData.documento) {
      violations.push({
        rule: 'DOCUMENTO_REQUERIDO',
        message: 'El documento del beneficiario es requerido',
        severity: 'ERROR'
      });
    }

    // Regla 4: Validar nombre y apellido
    if (!beneficiarioData.nombre || !beneficiarioData.apellido) {
      violations.push({
        rule: 'NOMBRE_APELLIDO_REQUERIDO',
        message: 'Nombre y apellido del beneficiario son requeridos',
        severity: 'ERROR'
      });
    }

    // Regla 5: Validar que la póliza existe
    if (beneficiarioData.idPoliza) {
      const polizas = await this.firestore.getDocumentsWithCondition('polizas', 'id', '==', beneficiarioData.idPoliza);
      if (!polizas || polizas.length === 0) {
        violations.push({
          rule: 'POLIZA_NO_EXISTE',
          message: 'La póliza no existe',
          severity: 'ERROR'
        });
        return { isValid: violations.length === 0, violations };
      }
      const poliza = polizas[0];
    }

    return {
      isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
      violations
    };
  }

  /**
   * UTILITARIOS DE VALIDACIÓN
   */

  private calcularEdad(fechaNacimiento: string | Date): number {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\d\s\-\+\(\)]{7,15}$/;
    return phoneRegex.test(phone);
  }

  private isStrongPassword(password: string): boolean {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  }

  /**
   * OBTENER TODAS LAS REGLAS DE NEGOCIO PARA AUDITORÍA
   */

  getAllBusinessRules(): any {
    return {
      estudiantes: {
        'EDAD_MINIMA': 'Mínimo 18 años',
        'DOCUMENTO_DUPLICADO': 'Documento único',
        'EMAIL_DUPLICADO': 'Email único',
        'CAMPO_OBLIGATORIO': 'Campos requeridos',
        'EMAIL_INVALIDO': 'Formato email válido',
        'TELEFONO_INVALIDO': 'Formato teléfono válido'
      },
      polizas: {
        'ESTUDIANTE_NO_EXISTE': 'Estudiante debe existir',
        'POLIZA_DUPLICADA': 'Una póliza vigente por estudiante',
        'ASEGURADORA_NO_EXISTE': 'Aseguradora debe existir',
        'FECHAS_INVALIDAS': 'Fechas válidas',
        'PRIMA_INVALIDA': 'Prima positiva',
        'COBERTURA_INVALIDA': 'Cobertura positiva',
        'PRIMA_COBERTURA_RATIO': 'Prima ≤ 10% cobertura'
      },
      siniestros: {
        'POLIZA_NO_EXISTE': 'Póliza debe existir',
        'POLIZA_NO_VIGENTE': 'Póliza debe estar vigente',
        'FECHA_FUERA_COBERTURA': 'Fecha dentro del período',
        'MONTO_EXCEDE_COBERTURA': 'Monto ≤ cobertura',
        'DESCRIPCION_INSUFICIENTE': 'Descripción mínimo 10 caracteres',
        'TIPO_SINIESTRO_INVALIDO': 'Tipo válido',
        'SINIESTRO_DUPLICADO': 'Evitar duplicados en 30 días'
      },
      usuarios: {
        'EMAIL_DUPLICADO': 'Email único',
        'ROL_INVALIDO': 'Rol válido',
        'PASSWORD_DEBIL': 'Contraseña segura',
        'CAMPO_OBLIGATORIO': 'Campos requeridos',
        'EMAIL_INVALIDO': 'Formato email válido',
        'PERMISO_ADMIN_DENEGADO': 'Solo ADMIN crea ADMIN'
      },
      documentos: {
        'TIPO_ARCHIVO_NO_PERMITIDO': 'Tipos permitidos',
        'ARCHIVO_DEMASIADO_GRANDE': 'Máximo 10MB',
        'TRAMITE_NO_EXISTE': 'Trámite debe existir',
        'NOMBRE_ARCHIVO_VACIO': 'Nombre requerido'
      },
      beneficiarios: {
        'PARENTESCO_INVALIDO': 'Parentesco válido',
        'PORCENTAJE_INVALIDO': 'Porcentaje 1-100',
        'DOCUMENTO_REQUERIDO': 'Documento requerido',
        'NOMBRE_APELLIDO_REQUERIDO': 'Nombre y apellido requeridos',
        'POLIZA_NO_EXISTE': 'Póliza debe existir'
      }
    };
  }
}
