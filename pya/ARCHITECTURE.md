# 🏗️ Arquitectura del Sistema de Reglas de Negocio

## 📊 Diagrama General del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    APLICACIÓN ANGULAR                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      COMPONENTES                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Estudiantes  │  │   Pólizas    │  │  Siniestros  │  ...      │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  CAPA DE VALIDACIÓN                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              ValidationService                            │ │
│  │     (Punto único de entrada para validaciones)            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         ↓                ↓                 ↓
┌──────────────────┐  ┌──────────────────┐ ┌──────────────────┐
│  Authorization   │  │ BusinessRules    │ │    Audit         │
│     Service      │  │    Service       │ │   Service        │
│                  │  │                  │ │                  │
│ • Validar rol    │  │ • Edad mínima    │ │ • Registrar op.  │
│ • Validar permiso│  │ • Duplicados     │ │ • Logs seguridad │
│ • Cambiar rol    │  │ • Integridad     │ │ • Estadísticas   │
│ • Control acceso │  │ • Consistencia   │ │ • Reportes       │
└──────────────────┘  └──────────────────┘ └──────────────────┘
         ↓                ↓                 ↓
┌──────────────────────────────────────────────────────────────┐
│              FIRESTORE SERVICE                                │
│  (Gestión de base de datos)                                  │
└──────────────────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────────────────┐
│              FIREBASE / FIRESTORE                             │
│  Base de datos en tiempo real                                │
└──────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Validación Detallado

### Para Crear un Estudiante

```
1. Usuario ingresa datos en formulario
                ↓
2. Component llama: validationService.crearEstudiante(usuarioId, datos)
                ↓
3. ValidationService verifica:
   ├─ ¿Usuario tiene permiso? → AuthorizationService
   ├─ ¿Datos cumplen reglas? → BusinessRulesService
   └─ ¿Registrar operación? → AuditService
                ↓
4. Retorna: OperationResult {
   ├─ exitoso: boolean
   ├─ mensaje: string
   ├─ errores: RuleViolation[]
   ├─ avisos: RuleViolation[]
   └─ datos?: any
   }
                ↓
5. Component verifica resultado:
   ├─ Si NO exitoso → Mostrar errores
   ├─ Si exitoso → Guardar en BD
   └─ Registrar en auditoría
                ↓
6. Mostrar mensaje al usuario
```

## 📁 Estructura de Archivos

```
src/app/
├── services/
│   ├── business-rules.service.ts       (CORE: Validaciones)
│   ├── authorization.service.ts        (CORE: Control acceso)
│   ├── audit.service.ts                (CORE: Auditoría)
│   ├── validation.service.ts           (CORE: Orquestación)
│   ├── authorization.guard.ts          (UTILITY: Protección rutas)
│   ├── firestore.service.ts            (Existente)
│   └── auth.service.ts                 (Existente)
│
├── config/
│   └── business.config.ts              (CORE: Parámetros)
│
├── components/
│   ├── estudiantes/
│   │   ├── estudiantes.ts              (MEJORADO: Con validaciones)
│   │   └── estudiantes.html
│   ├── polizas/
│   │   ├── polizas.ts                  (MEJORADO: Con validaciones)
│   │   └── polizas.html
│   └── ... (otros componentes)
│
└── (otros archivos)

root/
├── BUSINESS_RULES.md                   (Documentación completa)
├── IMPLEMENTATION_GUIDE.md             (Guía de uso)
├── ARCHITECTURE.md                     (Este archivo)
├── package.json
└── ... (otros archivos)
```

## 🎯 Servicios Principales

### 1. BusinessRulesService
**Responsabilidad**: Validar todas las reglas de negocio

**Métodos principales**:
```typescript
• validateEstudianteRegistro()
• validatePolizaCreacion()
• validateSiniestroRegistro()
• validateUsuarioCreacion()
• validateDocumentoSubida()
• validateBeneficiario()
```

**Retorna**: `ValidationResult { isValid: boolean; violations: RuleViolation[] }`

### 2. AuthorizationService
**Responsabilidad**: Control de acceso basado en roles

**Métodos principales**:
```typescript
• tienePermiso(usuarioId, recurso, accion)
• tienePermisoPropio(usuarioId, recurso, accion, idRecurso)
• esAdmin(usuarioId)
• obtenerPermisosUsuario(usuarioId)
• cambiarRolUsuario(usuarioId, usuarioObjetivoId, rolNuevo, usuarioCambia)
```

**Retorna**: `boolean`

### 3. AuditService
**Responsabilidad**: Registro de operaciones y eventos

**Métodos principales**:
```typescript
• registrarCreacion()
• registrarActualizacion()
• registrarEliminacion()
• registrarOperacionFallida()
• registrarLogin()
• obtenerAuditoriaPorEntidad()
• generarReporteDiario()
```

### 4. ValidationService
**Responsabilidad**: Integración centralizada de todas las validaciones

**Métodos principales**:
```typescript
• crearEstudiante()
• crearPoliza()
• registrarSiniestro()
• subirDocumento()
• crearUsuario()
• agregarBeneficiario()
• obtenerMensajeError()
```

## 🔐 Matriz de Roles y Permisos

```
┌────────┬──────────┬──────────┬────────────┬────────────┬─────────┐
│ Recurso│  ADMIN   │ INSURER  │  GESTOR    │  CLIENTE   │AUDITOR  │
├────────┼──────────┼──────────┼────────────┼────────────┼─────────┤
│Usuario │C R U D * │    -     │     -      │R(propio)   │    R    │
│        │(cambiar) │          │            │            │         │
├────────┼──────────┼──────────┼────────────┼────────────┼─────────┤
│Estudia-│C R U D   │    R     │   R U      │R(propio)   │    R    │
│nte     │          │          │            │            │         │
├────────┼──────────┼──────────┼────────────┼────────────┼─────────┤
│Póliza  │C R U D   │ C R U    │     R      │R(propio)   │    R    │
│        │          │          │            │            │         │
├────────┼──────────┼──────────┼────────────┼────────────┼─────────┤
│Siniestro│C R U D  │R U A     │  C R U     │CR(propio)  │    R    │
│        │(aprobar) │(aprobar) │            │            │         │
├────────┼──────────┼──────────┼────────────┼────────────┼─────────┤
│Documento│C R D    │    R     │   C R D    │CR(propio)  │    R    │
├────────┼──────────┼──────────┼────────────┼────────────┼─────────┤
│Auditoría│R D      │    -     │     -      │     -      │    R    │
└────────┴──────────┴──────────┴────────────┴────────────┴─────────┘

Leyenda: C=Create R=Read U=Update D=Delete A=Approve
(propio)=Solo datos propios
*=Cambiar rol
```

## 📊 Ciclo de Vida de una Operación

```
START
  ↓
┌─────────────────────────────┐
│ 1. RECIBIR SOLICITUD        │
│    (Datos del usuario)      │
└─────────────────────────────┘
  ↓
┌─────────────────────────────┐
│ 2. AUTORIZACIÓN             │
│    ¿Tiene permiso?          │
│    ↓ NO → RECHAZAR          │
│    ↓ SÍ → CONTINUAR         │
└─────────────────────────────┘
  ↓
┌─────────────────────────────┐
│ 3. VALIDACIÓN DE REGLAS     │
│    ¿Cumple reglas?          │
│    ↓ ERRORES → RECHAZAR     │
│    ↓ WARNINGS → AVISAR      │
│    ↓ VÁLIDO → CONTINUAR     │
└─────────────────────────────┘
  ↓
┌─────────────────────────────┐
│ 4. REGISTRAR INTENCIÓN      │
│    (Pre-auditoría)          │
└─────────────────────────────┘
  ↓
┌─────────────────────────────┐
│ 5. GUARDAR EN BD            │
│    try {                    │
│      guardar()              │
│    } catch(error)           │
└─────────────────────────────┘
  ↓
┌─ EXITOSO ─┬─ ERROR ─┐
│           │         │
↓           ↓         ↓
REGISTRAR  REGISTRAR  REGISTRAR
ÉXITO      FALLO      FALLO
│          │          │
└──────┬───┴──────────┘
       ↓
┌─────────────────────────────┐
│ 6. RETORNAR RESULTADO       │
│    OperationResult          │
└─────────────────────────────┘
  ↓
┌─────────────────────────────┐
│ 7. MOSTRAR AL USUARIO       │
│    Mensaje + Errores/Avisos │
└─────────────────────────────┘
  ↓
END
```

## 🎨 Capas de Validación

```
NIVEL 4: CONSISTENCIA
├─ Verificar duplicados
├─ Validar relaciones
├─ Validar integridad referencial
└─ Validar restricciones globales

         ↓

NIVEL 3: INTEGRIDAD DE DATOS
├─ Formato válido
├─ Campos requeridos
├─ Rangos válidos
└─ Tipos de datos correctos

         ↓

NIVEL 2: REGLAS DE NEGOCIO
├─ Lógica del dominio
├─ Restricciones comerciales
├─ Políticas de negocio
└─ Relaciones complejas

         ↓

NIVEL 1: AUTORIZACIÓN
├─ Usuario autenticado
├─ Usuario activo
├─ Rol válido
└─ Permisos suficientes
```

## 📈 Métricas y Monitoreo

```
Sistema registra:
├─ Operaciones exitosas: Estudiantes creados, pólizas aprobadas
├─ Operaciones fallidas: Validaciones no pasadas, errores de BD
├─ Eventos de seguridad: Logins, accesos denegados, cambios de rol
├─ Tiempos de ejecución: Para optimización
├─ Usuarios activos: Quién hace qué y cuándo
├─ Patrones de uso: Tendencias y anomalías
└─ Cumplimiento: Auditabilidad para compliance
```

## 🔒 Seguridad

```
DEFENSAS IMPLEMENTADAS:

1. AUTENTICACIÓN
   └─ Verificación de usuario en cada operación

2. AUTORIZACIÓN
   └─ Control basado en roles y permisos granulares

3. VALIDACIÓN
   └─ 4 niveles de validación de datos

4. AUDITORÍA
   └─ Registro inmutable de todas las operaciones

5. INTEGRIDAD
   └─ Validación de relaciones entre entidades

6. DISPONIBILIDAD
   └─ Manejo de errores y recuperación
```

## 🚀 Ventajas del Diseño

```
✅ MODULARIDAD
   • Servicios independientes y reutilizables
   • Fácil de testear y mantener

✅ ESCALABILIDAD  
   • Agregar nuevas reglas sin cambiar código existente
   • Nuevas entidades con el mismo patrón

✅ MANTENIBILIDAD
   • Código centralizado y organizado
   • Documentación completa

✅ ROBUSTEZ
   • Múltiples capas de validación
   • Auditoría de todas las operaciones

✅ SEGURIDAD
   • Control granular de acceso
   • Registro de actividades

✅ USABILIDAD
   • Mensajes claros al usuario
   • Diferenciación entre errores y avisos
```

## 📝 Ejemplo: Flujo Completo de Crear Póliza

```
1. Usuario en componente polizas.component.ts
   → Ingresa datos (estudiante, aseguradora, fechas, prima, cobertura)
   
2. Click en "Crear Póliza"
   → Componente llama: validationService.crearPoliza(usuarioId, datos)

3. ValidationService.crearPoliza()
   → Verifica permiso: authorization.tienePermiso()
   → Valida reglas: businessRules.validatePolizaCreacion()
   → Si falla → Registra operación fallida en auditoría
   → Retorna: OperationResult { exitoso: false, errores: [...] }

4. Si validación es OK
   → Registro en auditoría: audit.registrarCreacion()
   → Retorna: OperationResult { exitoso: true, datos: {...} }

5. Componente recibe resultado
   → Si exitoso:
      ├─ Guarda en Firestore
      ├─ Registra éxito en auditoría
      ├─ Muestra mensaje "Póliza creada"
      └─ Recarga lista
   → Si fallo:
      ├─ Muestra errores al usuario
      └─ Sugiere acciones correctivas

6. Auditoría registra:
   ├─ Quién: usuarioId
   ├─ Qué: CREAR póliza
   ├─ Cuándo: timestamp
   ├─ Dónde: entidad 'polizas'
   ├─ Resultado: EXITOSO/FALLIDO
   ├─ Datos: primo, cobertura, estudiante, aseguradora
   └─ Detalles: contexto adicional

7. Sistema genera reportes:
   ├─ Reporte diario de operaciones
   ├─ Estadísticas por usuario
   ├─ Análisis de fallos de validación
   └─ Alertas de anomalías
```

## 🔧 Cómo Agregar Una Nueva Regla

```
PASO 1: Definir la regla en BusinessRulesService
────────────────────────────────────────────
async validateNuevaEntidad(datos: any): Promise<ValidationResult> {
  const violations: RuleViolation[] = [];
  
  // Implementar validaciones
  if (!datos.campo) {
    violations.push({
      rule: 'RULE_NAME',
      message: 'Descripción',
      severity: 'ERROR'
    });
  }
  
  return {
    isValid: violations.filter(v => v.severity === 'ERROR').length === 0,
    violations
  };
}

PASO 2: Integrar en ValidationService
──────────────────────────────────────
async crearNuevaEntidad(usuarioId: string, datos: any): Promise<OperationResult> {
  // Autorización
  const autorizado = await this.authorization.tienePermiso(usuarioId, 'recurso', 'create');
  
  // Validación
  const validacion = await this.businessRules.validateNuevaEntidad(datos);
  
  // Retornar resultado
  return { exitoso: validacion.isValid, ... };
}

PASO 3: Usar en Componente
──────────────────────────
async crearNuevaEntidad() {
  const resultado = await this.validation.crearNuevaEntidad(usuarioId, datos);
  
  if (resultado.exitoso) {
    // Guardar y auditar
  } else {
    // Mostrar errores
  }
}

PASO 4: Documentar
──────────────────
Agregar a BUSINESS_RULES.md:
• Descripción de la nueva regla
• Condiciones
• Ejemplos
• Mensajes de error
```

---

**Arquitectura lista para producción y escalable** ✅

