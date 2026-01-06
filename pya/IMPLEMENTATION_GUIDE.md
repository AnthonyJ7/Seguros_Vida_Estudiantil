# 🔐 Sistema de Reglas de Negocio - Guía de Implementación

## 📋 Resumen Rápido

Se ha implementado un sistema robusto de reglas de negocio para la plataforma de seguros estudiantiles que incluye:

✅ **Validaciones de Negocio** - Todas las entidades críticas  
✅ **Control de Acceso** - Basado en roles (ADMIN, INSURER, GESTOR, CLIENTE, AUDITOR)  
✅ **Auditoría Completa** - Registro de todas las operaciones  
✅ **Autorización Granular** - Permisos por recurso y acción  
✅ **Documentación Completa** - Guías y ejemplos  

---

## 📁 Archivos Creados

### Servicios (src/app/services/)

```
business-rules.service.ts       → Validaciones de negocio por entidad
authorization.service.ts        → Control de acceso y roles
authorization.guard.ts          → Guard para proteger rutas
audit.service.ts                → Registro de auditoría y logs
validation.service.ts           → Servicio centralizado de validación
```

### Configuración (src/app/config/)

```
business.config.ts              → Parámetros y constantes
```

### Documentación

```
BUSINESS_RULES.md               → Documentación completa de reglas
```

---

## 🚀 Comenzar a Usar

### 1. Inyectar Servicios en Componente

```typescript
import { ValidationService } from '../../services/validation.service';
import { RuleViolation } from '../../services/business-rules.service';

export class MiComponente {
  errores: RuleViolation[] = [];
  
  constructor(private validation: ValidationService) {}
}
```

### 2. Validar Antes de Guardar

```typescript
async crearEstudiante() {
  const usuarioId = localStorage.getItem('uid') || '';
  
  const resultado = await this.validation.crearEstudiante(
    usuarioId,
    this.datosEstudiante
  );

  if (!resultado.exitoso) {
    // Mostrar errores
    this.errores = resultado.errores || [];
    return;
  }

  // Guardar en Firestore
  await this.firestore.addDocument('estudiantes', this.datosEstudiante);
}
```

### 3. Mostrar Mensajes al Usuario

```html
<div *ngIf="errores.length > 0" class="alert alert-danger">
  <h4>Errores de Validación:</h4>
  <ul>
    <li *ngFor="let error of errores">
      {{ validation.obtenerMensajeError(error) }}
    </li>
  </ul>
</div>

<div *ngIf="avisos.length > 0" class="alert alert-warning">
  <h4>Advertencias:</h4>
  <ul>
    <li *ngFor="let aviso of avisos">
      {{ aviso.message }}
    </li>
  </ul>
</div>
```

---

## 🔐 Roles y Permisos

### Matriz Rápida

| Rol | Crear Est. | Crear Póliza | Crear Siniestro | Ver Auditoría |
|-----|-----------|-------------|-----------------|---------------|
| ADMIN | ✓ | ✓ | ✓ | ✓ |
| INSURER | ✗ | ✓ | ✓ | ✗ |
| GESTOR | ✓ | ✗ | ✓ | ✗ |
| CLIENTE | ✗ | ✗ | ✓(propio) | ✗ |
| AUDITOR | ✗ | ✗ | ✗ | ✓ |

### Proteger Rutas

```typescript
// En app.routes.ts
{
  path: 'estudiantes',
  component: EstudiantesComponent,
  canActivate: [AuthorizationGuard],
  data: { rol: 'ADMIN' } // Solo ADMIN
}
```

---

## 📊 Auditoría

### Registrar Operación Exitosa

```typescript
await this.audit.registrarCreacion(
  usuarioId,
  'estudiantes',
  docRef,
  datosEstudiante,
  { tabla: 'estudiantes', accion: 'CREAR' }
);
```

### Registrar Fallo

```typescript
await this.audit.registrarOperacionFallida(
  usuarioId,
  'estudiantes',
  'NUEVO',
  'CREAR',
  'Validación fallida',
  { errores: violaciones }
);
```

### Obtener Reportes

```typescript
// Reporte diario
const reporte = await this.audit.generarReporteDiario();

// Auditoría de una entidad
const logs = await this.audit.obtenerAuditoriaPorEntidad('polizas', 'POL001');

// Auditoría del usuario
const userLogs = await this.audit.obtenerAuditoriaDelUsuario('USER123', 30);
```

---

## ✅ Reglas Principales por Entidad

### ESTUDIANTES
- Mínimo 18 años
- Documento único
- Email único
- Campos obligatorios validados
- Teléfono en formato válido

### PÓLIZAS
- Estudiante debe existir
- Una póliza vigente por estudiante
- Aseguradora debe existir
- Fechas válidas
- Prima ≤ 10% cobertura

### SINIESTROS
- Póliza vigente requerida
- Fecha dentro del período de cobertura
- Monto ≤ cobertura
- Tipos: MUERTE, INVALIDEZ, ENFERMEDAD, ACCIDENTE
- Evitar duplicados en 30 días

### USUARIOS
- Email único
- Contraseña segura (8 chars, mayús, número, símbolo)
- Roles válidos
- Solo ADMIN crea ADMIN

### DOCUMENTOS
- Tipos: PDF, PNG, JPEG, DOC, DOCX
- Máximo 10MB
- Trámite debe existir

### BENEFICIARIOS
- Parentesco válido
- Porcentaje 1-100
- Documento requerido
- Póliza debe existir

---

## 📝 Ejemplos Completos

### Crear Estudiante con Validación

```typescript
async registrarEstudiante() {
  this.errores = [];
  this.avisos = [];

  const estudiante = {
    nombre: this.form.value.nombre,
    apellido: this.form.value.apellido,
    documento: this.form.value.documento,
    email: this.form.value.email,
    fechaNacimiento: this.form.value.fechaNacimiento,
    telefonoContacto: this.form.value.telefonoContacto
  };

  // PASO 1: Validar y autorizar
  const resultado = await this.validation.crearEstudiante(
    localStorage.getItem('uid') || '',
    estudiante
  );

  // PASO 2: Manejar resultado
  if (!resultado.exitoso) {
    this.errores = resultado.errores || [];
    if (resultado.avisos) {
      this.avisos = resultado.avisos;
    }
    return;
  }

  // PASO 3: Guardar
  try {
    const docRef = await this.firestore.addDocument('estudiantes', estudiante);
    
    // PASO 4: Mostrar éxito
    this.mensajeExito = `Estudiante ${estudiante.nombre} registrado`;
    setTimeout(() => { this.mensajeExito = ''; }, 3000);
    
    // PASO 5: Recargar
    this.loadEstudiantes();
    
  } catch (error) {
    this.errores = [{
      rule: 'ERROR_GUARDADO',
      message: 'Error al guardar',
      severity: 'ERROR'
    }];
  }
}
```

### Crear Póliza con Auditoría

```typescript
async crearPoliza() {
  const usuarioId = localStorage.getItem('uid') || '';
  
  const poliza = {
    idEstudiante: this.selectedEstudiante,
    idAseguradora: this.selectedAseguradora,
    fechaInicio: this.form.value.fechaInicio,
    fechaVencimiento: this.form.value.fechaVencimiento,
    prima: this.form.value.prima,
    montoCobertura: this.form.value.montoCobertura,
    estado: 'ACTIVA'
  };

  // Validar
  const resultado = await this.validation.crearPoliza(usuarioId, poliza);

  if (!resultado.exitoso) {
    this.errores = resultado.errores || [];
    return;
  }

  // Guardar
  try {
    const docRef = await this.firestore.addDocument('polizas', poliza);
    
    // Auditar
    await this.audit.registrarCreacion(
      usuarioId,
      'polizas',
      docRef,
      poliza,
      { monto: poliza.montoCobertura }
    );

    this.mostrarExito('Póliza creada correctamente');
    this.loadPolizas();
    
  } catch (error) {
    await this.audit.registrarOperacionFallida(
      usuarioId,
      'polizas',
      'NUEVA',
      'CREAR',
      String(error)
    );
    this.mostrarError('Error al guardar póliza');
  }
}
```

---

## 🛠️ Configuración en app.config.ts

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { BusinessRulesService } from './services/business-rules.service';
import { AuthorizationService } from './services/authorization.service';
import { AuditService } from './services/audit.service';
import { ValidationService } from './services/validation.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    BusinessRulesService,
    AuthorizationService,
    AuditService,
    ValidationService
  ]
};
```

---

## 📚 Estructura de Validación

```
                    Usuario
                      ↓
             Componente (formulario)
                      ↓
            ValidationService.crearX()
                      ↓
         ┌────────────┼────────────┐
         ↓            ↓            ↓
    Autorización  Validaciones  Auditoría
    (¿Permiso?)    (¿Reglas?)    (Registrar)
         ↓            ↓            ↓
         └────────────┼────────────┘
                      ↓
                OperationResult
                      ↓
            ┌─────────────────┐
            │ Mostrar Resultado│
            ├─────────────────┤
            │ exitoso: bool   │
            │ mensaje: string │
            │ errores: []     │
            │ avisos: []      │
            └─────────────────┘
                      ↓
                Guardar BD
```

---

## 🔍 Validar Configuración

Para verificar que todo está configurado correctamente:

```typescript
// En la consola
const config = BUSINESS_CONFIG;
console.log('Edad mínima:', config.ESTUDIANTE.EDAD_MINIMA);
console.log('Prima máxima:', config.POLIZA.RELACION_PRIMA_COBERTURA_MAX);
console.log('Tipos siniestro:', config.SINIESTRO.TIPOS_VALIDOS);

// Validar contraseña
const helper = ConfigHelper;
const validez = helper.validarContrasena('Test@123');
console.log(validez);

// Formatear moneda
console.log(helper.formatearMoneda(100000)); // $ 100,000.00
```

---

## 📞 Soporte

Para agregar nuevas reglas:

1. **Editar `BusinessRulesService`** - Agregar método de validación
2. **Editar `ValidationService`** - Integrar con auditoría
3. **Editar `business.config.ts`** - Parámetros de la regla
4. **Usar en componentes** - A través de `ValidationService`
5. **Documentar** - Agregar a `BUSINESS_RULES.md`

---

## ✨ Beneficios del Sistema

| Beneficio | Descripción |
|-----------|-------------|
| **Robustez** | Validaciones en 4 niveles |
| **Compliance** | Auditoría de todas operaciones |
| **Seguridad** | Control de acceso granular |
| **Mantenibilidad** | Servicios centralizados |
| **Experiencia** | Mensajes claros al usuario |
| **Escalabilidad** | Fácil agregar nuevas reglas |

---

## 📊 Próximos Pasos

1. ✅ Implementar validaciones en componentes existentes
2. ✅ Proteger rutas con guards
3. ✅ Crear dashboard de auditoría
4. ✅ Generar reportes diarios
5. ✅ Implementar alertas de reglas violadas
6. ✅ Testing de reglas de negocio

---

**¡Sistema listo para producción! 🚀**

Para preguntas, revisar `BUSINESS_RULES.md` para documentación completa.
