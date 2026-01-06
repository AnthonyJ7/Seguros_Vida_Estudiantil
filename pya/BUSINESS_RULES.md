# Documentación de Reglas de Negocio - Plataforma de Seguros Estudiantiles

## Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura de Reglas](#arquitectura-de-reglas)
3. [Validaciones por Entidad](#validaciones-por-entidad)
4. [Control de Acceso y Autorización](#control-de-acceso-y-autorización)
5. [Auditoría y Logs](#auditoría-y-logs)
6. [Integración en Componentes](#integración-en-componentes)
7. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Descripción General

El sistema de reglas de negocio proporciona una capa robusta de validación que asegura:

- **Integridad de datos**: Validación de campos y formatos
- **Consistencia lógica**: Reglas específicas del dominio de seguros
- **Control de acceso**: Autorización basada en roles
- **Auditoría completa**: Registro de todas las operaciones

### Componentes Principales

| Servicio | Responsabilidad |
|----------|-----------------|
| `BusinessRulesService` | Validaciones de datos y reglas de negocio |
| `AuthorizationService` | Control de acceso basado en roles |
| `AuditService` | Registro de operaciones y eventos de seguridad |
| `ValidationService` | Integración centralizada de validaciones |

---

## Arquitectura de Reglas

### Flujo de Validación

```
Usuario → Componente → ValidationService 
         ↓
    Verificar Autorización (AuthorizationService)
         ↓
    Validar Reglas de Negocio (BusinessRulesService)
         ↓
    Registrar en Auditoría (AuditService)
         ↓
    Guardar en Base de Datos (FirestoreService)
```

### Niveles de Validación

1. **Nivel 1 - Autorización**
   - ¿El usuario tiene permiso?
   - ¿El rol lo permite?

2. **Nivel 2 - Reglas de Negocio**
   - ¿Los datos cumplen las reglas del dominio?
   - ¿Hay restricciones comerciales?

3. **Nivel 3 - Integridad de Datos**
   - ¿El formato es válido?
   - ¿Los campos requeridos están presentes?

4. **Nivel 4 - Consistencia**
   - ¿Los datos son consistentes con el sistema?
   - ¿Hay duplicados?

---

## Validaciones por Entidad

### ESTUDIANTES

#### Reglas Obligatorias (ERROR)
| Regla | Descripción | Ejemplo |
|-------|-------------|---------|
| EDAD_MINIMA | Mínimo 18 años | Fecha de nacimiento hace 18+ años |
| DOCUMENTO_DUPLICADO | Documento único en el sistema | Validar documento no existe |
| EMAIL_DUPLICADO | Email único en el sistema | Validar email no existe |
| CAMPO_OBLIGATORIO | Campos requeridos | nombre, apellido, documento, email, teléfono |
| EMAIL_INVALIDO | Formato de email válido | debe contener @ y dominio |
| TELEFONO_INVALIDO | Formato de teléfono válido | 7-15 dígitos/caracteres |

#### Proceso de Validación
```typescript
// Entrada
const estudiante = {
  nombre: "Juan",
  apellido: "Pérez",
  documento: "123456789",
  email: "juan@example.com",
  fechaNacimiento: "2005-06-15",
  telefonoContacto: "+34612345678"
};

// Validación
const resultado = await businessRulesService.validateEstudianteRegistro(estudiante);

// Resultado
{
  isValid: true,
  violations: [] // Sin violaciones
}
```

---

### PÓLIZAS

#### Reglas Obligatorias (ERROR)
| Regla | Descripción |
|-------|-------------|
| ESTUDIANTE_NO_EXISTE | Estudiante debe existir en el sistema |
| POLIZA_DUPLICADA | Un estudiante solo puede tener una póliza vigente |
| ASEGURADORA_NO_EXISTE | Aseguradora debe existir |
| FECHAS_INVALIDAS | Fecha inicio < fecha vencimiento |
| PRIMA_INVALIDA | Prima debe ser positiva |
| COBERTURA_INVALIDA | Cobertura debe ser positiva |

#### Reglas de Advertencia (WARNING)
| Regla | Descripción |
|-------|-------------|
| PRIMA_COBERTURA_RATIO | Prima no debe exceder 10% de cobertura |

#### Ejemplo de Validación
```typescript
const poliza = {
  idEstudiante: "EST001",
  idAseguradora: "ASG001",
  fechaInicio: "2024-01-15",
  fechaVencimiento: "2025-01-15",
  prima: 50.00,
  montoCobertura: 100000.00
};

const resultado = await businessRulesService.validatePolizaCreacion(poliza);
// Prima es 0.05% de cobertura → VÁLIDO
// Prima < 10% de cobertura → VÁLIDO
```

---

### SINIESTROS

#### Reglas Obligatorias (ERROR)
| Regla | Descripción | Restricción |
|-------|-------------|-----------|
| POLIZA_NO_EXISTE | Póliza debe existir | - |
| POLIZA_NO_VIGENTE | Póliza debe estar en estado ACTIVA/VIGENTE | - |
| FECHA_FUERA_COBERTURA | Siniestro debe ocurrir dentro del período | Inicio ≤ fecha ≤ vencimiento |
| MONTO_EXCEDE_COBERTURA | Monto reclamado ≤ cobertura | Max: montoCobertura |
| DESCRIPCION_INSUFICIENTE | Descripción mínimo 10 caracteres | >= 10 chars |
| TIPO_SINIESTRO_INVALIDO | Tipo válido | MUERTE, INVALIDEZ, ENFERMEDAD, ACCIDENTE |

#### Reglas de Advertencia (WARNING)
| Regla | Descripción |
|-------|-------------|
| SINIESTRO_DUPLICADO | Evitar mismo tipo en 30 días |

#### Tipos de Siniestro Válidos
- **MUERTE**: Fallecimiento del asegurado
- **INVALIDEZ**: Pérdida de capacidad laboral
- **ENFERMEDAD**: Enfermedad grave cubierta
- **ACCIDENTE**: Accidente cubierto

---

### USUARIOS

#### Reglas Obligatorias (ERROR)
| Regla | Descripción |
|-------|-------------|
| EMAIL_DUPLICADO | Email único en el sistema |
| ROL_INVALIDO | Rol debe ser: ADMIN, INSURER, GESTOR, CLIENTE, AUDITOR |
| PASSWORD_DEBIL | Min 8 chars, mayúscula, número, símbolo |
| CAMPO_OBLIGATORIO | nombre, email, rol requeridos |
| EMAIL_INVALIDO | Formato email válido |
| PERMISO_ADMIN_DENEGADO | Solo ADMIN puede crear ADMIN |

#### Requisitos de Contraseña
```
Mínimo 8 caracteres
+ Al menos 1 mayúscula (A-Z)
+ Al menos 1 minúscula (a-z)
+ Al menos 1 número (0-9)
+ Al menos 1 símbolo (!@#$%^&*...)

Ejemplo válido: SecurePass123!
Ejemplo inválido: password123 (sin mayúscula ni símbolo)
```

---

### DOCUMENTOS

#### Reglas Obligatorias (ERROR)
| Regla | Descripción |
|-------|-------------|
| TIPO_ARCHIVO_NO_PERMITIDO | Permitidos: PDF, PNG, JPEG, DOC, DOCX |
| ARCHIVO_DEMASIADO_GRANDE | Máximo 10MB |
| TRAMITE_NO_EXISTE | Trámite debe existir |
| NOMBRE_ARCHIVO_VACIO | Nombre requerido |

#### Tipos Permitidos
- `application/pdf` - PDF
- `image/png` - PNG
- `image/jpeg` - JPEG
- `application/msword` - DOC
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` - DOCX

---

### BENEFICIARIOS

#### Reglas Obligatorias (ERROR)
| Regla | Descripción |
|-------|-------------|
| PARENTESCO_INVALIDO | Válidos: ESPOSO/A, HIJO/A, PADRE, MADRE, HERMANO/A, OTRO |
| PORCENTAJE_INVALIDO | Rango: 1-100 |
| DOCUMENTO_REQUERIDO | Documento beneficiario requerido |
| NOMBRE_APELLIDO_REQUERIDO | Ambos campos requeridos |
| POLIZA_NO_EXISTE | Póliza debe existir |

---

## Control de Acceso y Autorización

### Roles Definidos

#### ADMIN - Administrador del Sistema
```typescript
Permisos: 
- Gestión completa de usuarios
- Gestión completa de estudiantes
- Gestión completa de pólizas
- Gestión completa de siniestros
- Gestión de documentos
- Gestión de aseguradoras
- Acceso a auditoría
- Reportes
- Configuración del sistema
```

#### INSURER - Gestor de Seguros
```typescript
Permisos:
- Leer estudiantes
- Crear/actualizar pólizas
- Leer pólizas
- Actualizar/aprobar siniestros
- Leer siniestros
- Leer documentos
- Generar reportes
```

#### GESTOR - Gestor Administrativo
```typescript
Permisos:
- Leer/actualizar estudiantes
- Leer pólizas
- Crear/actualizar siniestros
- Crear/eliminar documentos
- Leer documentos
```

#### CLIENTE - Estudiante Asegurado
```typescript
Permisos:
- Leer datos propios
- Leer póliza propia
- Crear siniestros propios
- Leer siniestros propios
- Crear/leer documentos propios
```

#### AUDITOR - Auditor del Sistema
```typescript
Permisos:
- Leer estudiantes
- Leer pólizas
- Leer siniestros
- Leer documentos
- Leer auditoría
- Generar reportes
```

### Matriz de Permisos

| Recurso | ADMIN | INSURER | GESTOR | CLIENTE | AUDITOR |
|---------|-------|---------|--------|---------|---------|
| usuario | CRUD+ | - | - | R(propio) | R |
| estudiante | CRUD | R | RU | R(propio) | R |
| poliza | CRUD | CRU | R | R(propio) | R |
| siniestro | CRUD+ | RUA | CRU | CR(propio) | R |
| documento | CRD | R | CRD | CR(propio) | R |

### Validar Permisos en Componentes

```typescript
// Inyectar el servicio
constructor(private validation: ValidationService) {}

// Crear estudiante
async crearEstudiante() {
  const resultado = await this.validation.crearEstudiante(usuarioId, datos);
  
  if (resultado.exitoso) {
    // Proceder a guardar
  } else {
    // Mostrar errores
    resultado.errores?.forEach(error => {
      console.error(error.message);
    });
  }
}
```

---

## Auditoría y Logs

### Tipos de Eventos Auditados

#### 1. Operaciones en Datos
- **CREAR**: Nuevo documento
- **ACTUALIZAR**: Cambios en documento
- **ELIMINAR**: Eliminación de documento

#### 2. Eventos de Seguridad
- **LOGIN**: Inicio de sesión exitoso
- **LOGOUT**: Cierre de sesión
- **INTENTO_FALLIDO**: Fallo en login
- **ACCESO_DENEGADO**: Intento de acceso sin permisos
- **CAMBIO_PERMISO**: Cambio de rol de usuario

### Estructura de Log de Auditoría

```typescript
interface AuditLog {
  timestamp: Date;           // 2024-01-15T10:30:45Z
  usuario: string;           // UID del usuario
  accion: string;            // CREAR, ACTUALIZAR, ELIMINAR
  entidad: string;           // estudiantes, polizas, siniestros
  idEntidad: string;         // ID del documento afectado
  antes?: any;               // Estado anterior (para UPDATE, DELETE)
  despues?: any;             // Estado nuevo (para CREATE, UPDATE)
  resultado: 'EXITOSO'|'FALLIDO';
  razon?: string;            // Razón del fallo
  detalles?: any;            // Información adicional
}
```

### Ejemplo de Log

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "usuario": "user123",
  "accion": "CREAR",
  "entidad": "polizas",
  "idEntidad": "poliza_456",
  "resultado": "EXITOSO",
  "despues": {
    "idEstudiante": "est_789",
    "idAseguradora": "asg_001",
    "prima": 50.00,
    "montoCobertura": 100000.00
  }
}
```

### Consultar Auditoría

```typescript
// Auditoría de una entidad específica
const logs = await this.audit.obtenerAuditoriaPorEntidad('polizas', 'poliza_456');

// Auditoría del usuario en los últimos 30 días
const userLogs = await this.audit.obtenerAuditoriaDelUsuario('user123', 30);

// Operaciones recientes
const recientes = await this.audit.obtenerOperacionesRecientes(50);

// Rango de fechas
const logs = await this.audit.obtenerOperacionesPorRango(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

---

## Integración en Componentes

### Patrón de Uso General

```typescript
import { ValidationService } from '../../services/validation.service';

export class MiComponente {
  constructor(private validation: ValidationService) {}

  async guardarDatos(datos: any) {
    // 1. Validar y autorizar
    const resultado = await this.validation.crearEstudiante(
      this.usuarioId,
      datos
    );

    // 2. Manejar resultado
    if (!resultado.exitoso) {
      // Mostrar errores al usuario
      this.mostrarErrores(resultado.errores);
      this.mostrarAvisos(resultado.avisos);
      return;
    }

    // 3. Guardar en BD
    try {
      await this.firestore.addDocument('estudiantes', resultado.datos);
      this.mostrarExito('Estudiante registrado correctamente');
    } catch (error) {
      this.mostrarError('Error al guardar');
    }
  }

  private mostrarErrores(errores: RuleViolation[] | undefined) {
    errores?.forEach(error => {
      const mensaje = this.validation.obtenerMensajeError(error);
      console.error(mensaje);
    });
  }

  private mostrarAvisos(avisos: RuleViolation[] | undefined) {
    avisos?.forEach(aviso => {
      console.warn(aviso.message);
    });
  }
}
```

### Ejemplo: Crear Estudiante

```typescript
// En estudiantes.ts
async registrarEstudiante() {
  const estudiante = {
    nombre: this.form.value.nombre,
    apellido: this.form.value.apellido,
    documento: this.form.value.documento,
    email: this.form.value.email,
    fechaNacimiento: this.form.value.fechaNacimiento,
    telefonoContacto: this.form.value.telefonoContacto
  };

  const resultado = await this.validation.crearEstudiante(
    localStorage.getItem('uid') || '',
    estudiante
  );

  if (resultado.exitoso) {
    // Guardar en Firestore
    const docRef = await this.firestore.addDocument('estudiantes', estudiante);
    this.loadEstudiantes();
  } else {
    // Mostrar errores
    this.errores = resultado.errores || [];
  }
}
```

### Ejemplo: Crear Póliza

```typescript
// En polizas.ts
async crearPoliza() {
  const poliza = {
    idEstudiante: this.selectedEstudiante,
    idAseguradora: this.selectedAseguradora,
    fechaInicio: this.form.value.fechaInicio,
    fechaVencimiento: this.form.value.fechaVencimiento,
    prima: this.form.value.prima,
    montoCobertura: this.form.value.montoCobertura
  };

  const resultado = await this.validation.crearPoliza(
    localStorage.getItem('uid') || '',
    poliza
  );

  if (resultado.exitoso) {
    await this.firestore.addDocument('polizas', poliza);
    this.loadPolizas();
    this.showSuccess('Póliza creada correctamente');
  } else {
    this.errores = resultado.errores || [];
    this.avisos = resultado.avisos || [];
  }
}
```

---

## Ejemplos de Uso

### Validar Estudiante

```typescript
// BAD - Falta email
const estudiante = {
  nombre: "Juan",
  apellido: "Pérez",
  documento: "123456789"
};

const resultado = await businessRules.validateEstudianteRegistro(estudiante);
// resultado.isValid = false
// violations: [
//   { rule: 'EMAIL_DUPLICADO', message: '...', severity: 'ERROR' },
//   { rule: 'CAMPO_OBLIGATORIO', message: 'campo email', severity: 'ERROR' }
// ]
```

### Validar Póliza con Advertencia

```typescript
const poliza = {
  idEstudiante: "EST001",
  idAseguradora: "ASG001",
  fechaInicio: "2024-01-15",
  fechaVencimiento: "2025-01-15",
  prima: 20000, // 20% de cobertura
  montoCobertura: 100000
};

const resultado = await businessRules.validatePolizaCreacion(poliza);
// resultado.isValid = true (no hay errores)
// violations: [
//   { rule: 'PRIMA_COBERTURA_RATIO', message: '...', severity: 'WARNING' }
// ]
```

### Verificar Permisos

```typescript
// Usuario CLIENTE intentando crear usuario
const esAdmin = await authorization.esAdmin('user123');
// esAdmin = false

const tienePermiso = await authorization.tienePermiso(
  'user123',
  'usuario',
  'create'
);
// tienePermiso = false

// Usuario ADMIN
const esAdmin = await authorization.esAdmin('admin123');
// esAdmin = true
```

### Generar Reporte Diario

```typescript
const reporte = await audit.generarReporteDiario();
console.log(reporte);
// ╔════════════════════════════════════════════════════════════════╗
// ║                   REPORTE DE AUDITORÍA DIARIO                  ║
// ║                  1/15/2024                                     ║
// ╚════════════════════════════════════════════════════════════════╝
//
// RESUMEN EJECUTIVO
// Total de Operaciones: 45
// Operaciones Exitosas: 42
// Operaciones Fallidas: 3
// ...
```

---

## Configuración en app.config.ts

```typescript
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { BusinessRulesService } from './services/business-rules.service';
import { AuthorizationService } from './services/authorization.service';
import { AuditService } from './services/audit.service';
import { ValidationService } from './services/validation.service';
import { AuthorizationGuard } from './services/authorization.guard';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    BusinessRulesService,
    AuthorizationService,
    AuditService,
    ValidationService,
    AuthorizationGuard
  ]
};
```

---

## Mejores Prácticas

1. **Siempre validar antes de guardar**
   - No confiar solo en validación de formulario
   - Las reglas de negocio son la fuente de verdad

2. **Registrar todas las operaciones**
   - Auditoría completa para compliance
   - Facilita debugging y análisis

3. **Mostrar mensajes claros al usuario**
   - Usar `obtenerMensajeError()` para mensajes amigables
   - Distinguir entre errores y advertencias

4. **Usar ValidationService como punto único**
   - Evitar acceso directo a BusinessRulesService desde componentes
   - Centraliza lógica y facilita mantenimiento

5. **Proteger rutas con guards**
   - Usar AuthorizationGuard en app.routes.ts
   - Validar al navegador, no solo después

---

## Soporte y Mantenimiento

Para agregar nuevas reglas de negocio:

1. Agregar método de validación en `BusinessRulesService`
2. Agregar método en `ValidationService` que integre con auditoría
3. Usar en componentes a través de `ValidationService`
4. Documentar la nueva regla en este archivo

