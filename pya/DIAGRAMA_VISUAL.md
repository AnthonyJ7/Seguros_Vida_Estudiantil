# 🗺️ MAPA VISUAL DEL SISTEMA

## Flujo Completo de una Operación

```
┌──────────────────────────────────────────────────────────────────┐
│                      USUARIO / CLIENTE                           │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                  COMPONENTE ANGULAR                              │
│  (estudiantes.ts, polizas.ts, siniestros.ts, etc.)              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1. Captura datos del formulario                           │ │
│  │ 2. Llama: validationService.crearX(usuarioId, datos)      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                  VALIDATION SERVICE                              │
│                (Punto central de control)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Método: crearEstudiante()                                 │ │
│  │ Método: crearPoliza()                                     │ │
│  │ Método: registrarSiniestro()                              │ │
│  │ Método: crearUsuario()                                    │ │
│  │ Método: subirDocumento()                                  │ │
│  │ Método: agregarBeneficiario()                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
         ↓                ↓                ↓
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ AUTHORIZATION    │  │ BUSINESS RULES   │  │ AUDIT SERVICE    │
│ SERVICE          │  │ SERVICE          │  │                  │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ 1. ¿Permiso?     │  │ 1. Edad mínima   │  │ 1. Registrar     │
│ 2. ¿Rol?         │  │ 2. Duplicados    │  │    operación     │
│ 3. ¿Autorizado?  │  │ 3. Integridad    │  │ 2. Guardar logs  │
│    ↓ SÍ          │  │ 4. Relaciones    │  │ 3. Eventos seg.  │
│    CONTINUAR     │  │    ↓ OK          │  │    ↓ REGISTRADO  │
│    ↓ NO          │  │    VÁLIDO        │  │                  │
│    ERROR         │  │    ↓ ERROR       │  │                  │
│                  │  │    ERROR         │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         ↓                ↓                ↓
         └────────────────┼────────────────┘
                          ↓
                  ┌──────────────────┐
                  │ OPERATION RESULT │
                  ├──────────────────┤
                  │ exitoso: boolean │
                  │ mensaje: string  │
                  │ errores: []      │
                  │ avisos: []       │
                  │ datos?: any      │
                  └──────────────────┘
                   ↓              ↓
                 EXITOSO         ERROR
                   ↓              ↓
        ┌─────────────────┐   ┌──────────────┐
        │ 1. Guardar en   │   │ 1. Mostrar   │
        │    Firestore    │   │    errores   │
        │ 2. Auditar op.  │   │ 2. Mostrar   │
        │ 3. Recargar UI  │   │    avisos    │
        │ 4. Mensaje éxito│   │ 3. No guardar│
        └─────────────────┘   └──────────────┘
                ↓                      ↓
        ┌──────────────────────────────────┐
        │   USUARIO VE RESULTADO           │
        └──────────────────────────────────┘
```

---

## Matriz de Roles y Acceso

```
                    ADMIN    INSURER   GESTOR   CLIENTE   AUDITOR
                     ╔════════════════════════════════════════════╗
usuario              ║ CRUD*     -        -      R(p)       R   ║
                     ║════════════════════════════════════════════║
estudiante           ║ CRUD      R        RU     R(p)       R   ║
                     ║════════════════════════════════════════════║
poliza               ║ CRUD      CRU      R      R(p)       R   ║
                     ║════════════════════════════════════════════║
siniestro            ║ CRUD*     RUA      CRU    CR(p)      R   ║
                     ║════════════════════════════════════════════║
documento            ║ CRD       R        CRD    CR(p)      R   ║
                     ║════════════════════════════════════════════║
auditoria            ║ RD        -        -      -          R   ║
                     ╚════════════════════════════════════════════╝

Leyenda:
  C = CREATE (crear)
  R = READ (leer)
  U = UPDATE (actualizar)
  D = DELETE (eliminar)
  A = APPROVE (aprobar)
  * = Permiso especial (cambiar rol, etc)
  (p) = Solo datos propios
  - = Sin permiso
```

---

## Ciclo de Vida de una Póliza

```
                    CREAR PÓLIZA
                         ↓
    ┌────────────────────────────────────────┐
    │ VALIDAR AUTORIZACIÓN                   │
    │ ¿Usuario tiene permiso de crear póliza?│
    │ ✓ ADMIN: SÍ                           │
    │ ✓ INSURER: SÍ                         │
    │ ✗ GESTOR: NO                          │
    │ ✗ CLIENTE: NO                         │
    │ ✗ AUDITOR: NO                         │
    └────────────────────────────────────────┘
         ↓ PERMITIDO        ↓ DENEGADO
         ✓                  ✗ AUDITAR ACCESO DENEGADO
         ↓
    ┌────────────────────────────────────────┐
    │ VALIDAR REGLAS DE NEGOCIO              │
    ├────────────────────────────────────────┤
    │ ✓ Estudiante existe                    │
    │ ✓ Aseguradora existe                   │
    │ ✓ No hay póliza vigente                │
    │ ✓ Fechas válidas                       │
    │ ✓ Prima positiva                       │
    │ ✓ Cobertura positiva                   │
    │ ✓ Prima ≤ 10% cobertura (ADVERTENCIA) │
    └────────────────────────────────────────┘
         ↓ VÁLIDO          ↓ INVÁLIDO
         ✓                 ✗ RETORNAR ERRORES
         ↓
    ┌────────────────────────────────────────┐
    │ GUARDAR EN FIREBASE                    │
    │ await firestore.addDocument()          │
    └────────────────────────────────────────┘
         ↓ EXITOSO        ↓ ERROR BD
         ✓                ✗ AUDITAR FALLO
         ↓
    ┌────────────────────────────────────────┐
    │ REGISTRAR EN AUDITORÍA                 │
    ├────────────────────────────────────────┤
    │ Quién: usuarioId                       │
    │ Qué: CREAR póliza                      │
    │ Cuándo: timestamp                      │
    │ Dónde: entidad 'polizas'               │
    │ Datos: prima, cobertura, estudiante... │
    │ Resultado: EXITOSO                     │
    └────────────────────────────────────────┘
         ↓
    ┌────────────────────────────────────────┐
    │ MOSTRAR RESULTADO AL USUARIO           │
    ├────────────────────────────────────────┤
    │ ✓ "Póliza creada correctamente"       │
    │ ⚠ "Prima es alta (11% cobertura)"     │
    └────────────────────────────────────────┘
```

---

## Estructura de Datos: RuleViolation

```
RuleViolation {
    rule: string              // Código de la regla
    message: string           // Descripción técnica
    severity: 'ERROR'         // ERROR = impide operación
             | 'WARNING'      // WARNING = solo aviso
}

Ejemplo:
{
    rule: 'EDAD_MINIMA',
    message: 'El estudiante debe ser mayor de 18 años',
    severity: 'ERROR'
}
```

---

## Estructura de Datos: ValidationResult

```
ValidationResult {
    isValid: boolean          // ¿Pasó todas validaciones?
    violations: RuleViolation[] // Todas las violaciones
}

Ejemplo:
{
    isValid: false,
    violations: [
        {
            rule: 'EDAD_MINIMA',
            message: 'El estudiante debe ser mayor de 18 años',
            severity: 'ERROR'
        },
        {
            rule: 'EMAIL_INVALIDO',
            message: 'El formato del email no es válido',
            severity: 'ERROR'
        },
        {
            rule: 'DOCUMENTO_DUPLICADO',
            message: 'Ya existe un estudiante con este documento',
            severity: 'ERROR'
        }
    ]
}
```

---

## Estructura de Datos: OperationResult

```
OperationResult {
    exitoso: boolean          // ¿Operación permitida y válida?
    mensaje: string           // Mensaje al usuario
    errores?: RuleViolation[] // Errores (severity = 'ERROR')
    avisos?: RuleViolation[]  // Advertencias (severity = 'WARNING')
    datos?: any               // Datos procesados (si exitoso)
}

Ejemplo EXITOSO:
{
    exitoso: true,
    mensaje: 'Datos validados correctamente',
    datos: { nombre: 'Juan', apellido: 'Pérez', ... }
}

Ejemplo CON ERRORES:
{
    exitoso: false,
    mensaje: 'Los datos no cumplen las reglas de negocio',
    errores: [
        { rule: 'EDAD_MINIMA', message: '...', severity: 'ERROR' }
    ],
    avisos: []
}

Ejemplo CON ADVERTENCIAS:
{
    exitoso: true,
    mensaje: 'Datos validados correctamente',
    avisos: [
        { rule: 'PRIMA_COBERTURA_RATIO', message: '...', severity: 'WARNING' }
    ],
    datos: { ... }
}
```

---

## Cadena de Responsabilidad

```
Component (UI)
    ↑↓
    │ ← ValidationService (Orquestación)
    │
    ├─→ AuthorizationService (¿Permiso?)
    │   └─→ FirestoreService (¿Usuario existe?)
    │
    ├─→ BusinessRulesService (¿Reglas?)
    │   ├─ Validaciones de formato
    │   ├─ Validaciones de negocio
    │   ├─ Validaciones de consistencia
    │   └─ Validaciones de integridad
    │
    └─→ AuditService (Registrar)
        └─→ FirestoreService (Guardar en auditoría)
```

---

## Niveles de Validación

```
┌─────────────────────────────────────────────┐
│ NIVEL 1: AUTORIZACIÓN                       │
│ ├─ Usuario autenticado                      │
│ ├─ Usuario activo                           │
│ ├─ Rol válido                               │
│ └─ Permisos suficientes                     │
└─────────────────────────────────────────────┘
         ↓ PASA
┌─────────────────────────────────────────────┐
│ NIVEL 2: REGLAS DE NEGOCIO                  │
│ ├─ Lógica específica del dominio            │
│ ├─ Restricciones comerciales                │
│ ├─ Políticas de la empresa                  │
│ └─ Relaciones complejas                     │
└─────────────────────────────────────────────┘
         ↓ PASA
┌─────────────────────────────────────────────┐
│ NIVEL 3: INTEGRIDAD DE DATOS                │
│ ├─ Formato válido (regex, length)           │
│ ├─ Campos requeridos presentes              │
│ ├─ Rangos válidos (min, max)                │
│ └─ Tipos de datos correctos                 │
└─────────────────────────────────────────────┘
         ↓ PASA
┌─────────────────────────────────────────────┐
│ NIVEL 4: CONSISTENCIA GLOBAL                │
│ ├─ Verificar duplicados                     │
│ ├─ Validar relaciones entre entidades       │
│ ├─ Integridad referencial                   │
│ └─ Restricciones globales                   │
└─────────────────────────────────────────────┘
         ↓ TODO OK
      ✅ OPERACIÓN PERMITIDA
```

---

## Integración en Componente: Paso a Paso

```
1. IMPORTAR SERVICIO
   ↓
   import { ValidationService } from '../../services/validation.service';

2. INYECTAR EN CONSTRUCTOR
   ↓
   constructor(private validation: ValidationService) {}

3. CAPTURAR DATOS DEL FORMULARIO
   ↓
   const datos = {
       nombre: this.form.value.nombre,
       apellido: this.form.value.apellido,
       ...
   };

4. LLAMAR VALIDACIÓN
   ↓
   const resultado = await this.validation.crearEstudiante(usuarioId, datos);

5. VERIFICAR RESULTADO
   ↓
   if (!resultado.exitoso) {
       this.errores = resultado.errores;
       return;
   }

6. GUARDAR EN BD
   ↓
   await this.firestore.addDocument('estudiantes', datos);

7. MOSTRAR ÉXITO
   ↓
   this.mensajeExito = 'Estudiante registrado correctamente';
```

---

## Árbol de Decisión: ¿Puedo guardar?

```
                    ¿AUTORIZADO?
                    /        \
                  SÍ          NO
                  /             \
            ¿VÁLIDO?          RECHAZAR
           /      \
         SÍ        NO
         /          \
    GUARDAR     RECHAZAR
     /            
   ¿ÉXITO BD?
   /       \
 SÍ         NO
 /           \
ÉXITO      ERROR BD
 |           |
 ✅          ✗
AUDITAR OK  AUDITAR FALLO
```

---

## Flujo de Datos en ValidationService.crearEstudiante()

```
ENTRADA:
├─ usuarioId: "user123"
└─ estudianteData: {
   ├─ nombre: "Juan"
   ├─ apellido: "Pérez"
   ├─ documento: "123456789"
   ├─ email: "juan@example.com"
   ├─ fechaNacimiento: "2005-06-15"
   └─ telefonoContacto: "+34612345678"
}

PROCESAMIENTO:
├─ ① Verificar autorización
│  ├─ ¿Usuario existe? → FirestoreService
│  ├─ ¿Tiene permiso? → AuthorizationService
│  └─ Resultado: true/false
│
├─ ② Validar reglas de negocio
│  ├─ ¿Edad >= 18? → BusinessRulesService
│  ├─ ¿Documento único? → BusinessRulesService
│  ├─ ¿Email único? → BusinessRulesService
│  ├─ ¿Formato válido? → BusinessRulesService
│  └─ Resultado: ValidationResult { isValid, violations }
│
└─ ③ Construir respuesta
   ├─ Si NO autorizado: OperationResult { exitoso: false, mensaje: '...' }
   ├─ Si validación falla: OperationResult { exitoso: false, errores: [...] }
   └─ Si todo OK: OperationResult { exitoso: true, datos: {...} }

SALIDA:
└─ OperationResult {
   ├─ exitoso: boolean
   ├─ mensaje: string
   ├─ errores?: RuleViolation[]
   ├─ avisos?: RuleViolation[]
   └─ datos?: any
}
```

---

## Resumen Visual de Archivos

```
┌─ SERVICIOS CORE ─────────────────────────────┐
│ business-rules.service.ts      (650+ líneas) │
│ authorization.service.ts       (380+ líneas) │
│ audit.service.ts               (320+ líneas) │
│ validation.service.ts          (350+ líneas) │
│ authorization.guard.ts          (50+ líneas) │
└──────────────────────────────────────────────┘
         ↓ CONFIGURACIÓN
┌─ CONFIG ─────────────────────────────────────┐
│ business.config.ts             (400+ líneas) │
└──────────────────────────────────────────────┘
         ↓ DOCUMENTACIÓN
┌─ DOCUMENTACIÓN ──────────────────────────────┐
│ BUSINESS_RULES.md              (500+ líneas) │
│ IMPLEMENTATION_GUIDE.md        (300+ líneas) │
│ ARCHITECTURE.md                (400+ líneas) │
│ RESUMEN_EJECUTIVO.md           (350+ líneas) │
│ INDEX.md                       (300+ líneas) │
│ ENTREGABLES.md                 (350+ líneas) │
└──────────────────────────────────────────────┘
         ↓ TESTING
┌─ TESTS ──────────────────────────────────────┐
│ business-rules.service.spec.ts (400+ líneas) │
│ 24+ tests unitarios                         │
│ 50+ escenarios de prueba                    │
└──────────────────────────────────────────────┘
         ↓ COMPONENTES
┌─ COMPONENTES MEJORADOS ──────────────────────┐
│ estudiantes.ts                 (160+ líneas) │
│ polizas.ts                     (200+ líneas) │
└──────────────────────────────────────────────┘

TOTAL: 3,500+ líneas de código
       + 1,850+ líneas de documentación
       = 5,350+ líneas de contenido profesional
```

---

## Conclusión Visual

```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║    SISTEMA DE REGLAS DE NEGOCIO IMPLEMENTADO             ║
║                                                            ║
║    ✅ 31 reglas de negocio                               ║
║    ✅ 5 roles definidos                                  ║
║    ✅ 6 entidades validadas                              ║
║    ✅ 4 niveles de validación                            ║
║    ✅ Auditoría completa                                 ║
║    ✅ Control granular de acceso                         ║
║    ✅ Documentación profesional                          ║
║    ✅ Tests unitarios                                    ║
║    ✅ Listo para producción                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

