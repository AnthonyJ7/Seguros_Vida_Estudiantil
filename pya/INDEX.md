# 📑 ÍNDICE RÁPIDO - Sistema de Reglas de Negocio

## 🚀 Acceso Rápido por Necesidad

### "Necesito implementar validaciones en un componente"
→ Ver: `IMPLEMENTATION_GUIDE.md` - Sección "Comenzar a Usar"
→ Ejemplo: `src/app/components/estudiantes/estudiantes.ts`

### "¿Cuáles son todas las reglas de negocio?"
→ Ver: `BUSINESS_RULES.md` - Sección "Validaciones por Entidad"

### "¿Cómo protejo una ruta?"
→ Ver: `ARCHITECTURE.md` - Sección "Configurar Guards"
→ Código: `src/app/services/authorization.guard.ts`

### "¿Qué roles y permisos hay?"
→ Ver: `BUSINESS_RULES.md` - Sección "Control de Acceso y Autorización"

### "¿Cómo funciona la auditoría?"
→ Ver: `BUSINESS_RULES.md` - Sección "Auditoría y Logs"
→ Servicio: `src/app/services/audit.service.ts`

### "¿Cómo agregar una nueva regla?"
→ Ver: `ARCHITECTURE.md` - Sección "Cómo Agregar Una Nueva Regla"

### "Necesito ver ejemplos de código"
→ Ver: `IMPLEMENTATION_GUIDE.md` - Sección "Ejemplos Completos"

### "¿Cuál es la arquitectura del sistema?"
→ Ver: `ARCHITECTURE.md` - Diagrama General

### "¿Dónde están los tests?"
→ Ver: `src/app/services/business-rules.service.spec.ts`
→ Ejecutar: `ng test`

---

## 📂 Estructura de Archivos Clave

```
SERVICIOS
├── business-rules.service.ts
│   └── validateEstudianteRegistro()
│       validatePolizaCreacion()
│       validateSiniestroRegistro()
│       validateUsuarioCreacion()
│       validateDocumentoSubida()
│       validateBeneficiario()
│
├── authorization.service.ts
│   └── tienePermiso()
│       tienePermisoPropio()
│       esAdmin()
│       obtenerPermisosUsuario()
│       cambiarRolUsuario()
│
├── audit.service.ts
│   └── registrarCreacion()
│       registrarActualizacion()
│       registrarEliminacion()
│       registrarOperacionFallida()
│       generarReporteDiario()
│
└── validation.service.ts
    └── crearEstudiante()
        crearPoliza()
        registrarSiniestro()
        subirDocumento()
        crearUsuario()
        agregarBeneficiario()
```

---

## 🔍 Buscar por Palabra Clave

### "edad"
- BUSINESS_RULES.md → Validaciones Estudiantes → EDAD_MINIMA
- business-rules.service.ts → método calcularEdad()
- business.config.ts → ESTUDIANTE.EDAD_MINIMA = 18

### "permiso"
- BUSINESS_RULES.md → Control de Acceso
- authorization.service.ts → métodos tienePermiso()
- ARCHITECTURE.md → Matriz de Permisos

### "auditoría"
- BUSINESS_RULES.md → Auditoría y Logs
- audit.service.ts → todos los métodos
- ARCHITECTURE.md → Ciclo de Vida

### "validación"
- BUSINESS_RULES.md → Validaciones por Entidad
- business-rules.service.ts → validate*() methods
- validation.service.ts → crear*() methods

### "error"
- BUSINESS_RULES.md → Validaciones → Reglas Obligatorias
- VALIDATION_MESSAGES en business.config.ts
- validation.service.ts → obtenerMensajeError()

---

## 📋 Servicios por Responsabilidad

### ¿Quiero validar datos?
→ `BusinessRulesService`
```typescript
const resultado = await businessRules.validateEstudianteRegistro(datos);
```

### ¿Quiero verificar si tengo permiso?
→ `AuthorizationService`
```typescript
const tienePermiso = await authorization.tienePermiso(usuarioId, 'estudiante', 'create');
```

### ¿Quiero auditar una operación?
→ `AuditService`
```typescript
await audit.registrarCreacion(usuarioId, 'estudiantes', docRef, datos);
```

### ¿Quiero hacer todo junto (validar + autorizar + auditar)?
→ `ValidationService`
```typescript
const resultado = await validation.crearEstudiante(usuarioId, datos);
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Registrar un Estudiante

1. **Archivo**: `estudiantes.ts`
2. **Método**: `addEstudiante()`
3. **Pasos**:
   ```typescript
   // 1. Validar
   const resultado = await this.validation.crearEstudiante(usuarioId, datos);
   
   // 2. Si falla
   if (!resultado.exitoso) {
     this.errores = resultado.errores;
     return;
   }
   
   // 3. Guardar
   const docRef = await this.firestore.addDocument('estudiantes', datos);
   
   // 4. Auditar
   await this.audit.registrarCreacion(usuarioId, 'estudiantes', docRef, datos);
   ```

### Caso 2: Crear una Póliza

1. **Archivo**: `polizas.ts`
2. **Método**: `addPoliza()`
3. **Diferencia**: Validar que estudiante y aseguradora existan

### Caso 3: Registrar un Siniestro

1. **Archivo**: `siniestros.ts` (mejorar)
2. **Método**: `registrarSiniestro()`
3. **Validaciones críticas**: Póliza vigente, fecha en cobertura, monto ≤ cobertura

### Caso 4: Crear Usuario (Solo ADMIN)

1. **Archivo**: `usuarios.ts` (mejorar)
2. **Método**: `crearUsuario()`
3. **Restricción**: Solo ADMIN puede crear usuarios
4. **Verificación**: Contraseña segura

---

## 📊 Checklist de Implementación

- [ ] Leer `IMPLEMENTATION_GUIDE.md`
- [ ] Revisar `BUSINESS_RULES.md`
- [ ] Estudiar `ARCHITECTURE.md`
- [ ] Inyectar `ValidationService` en componentes
- [ ] Implementar validación antes de guardar
- [ ] Mostrar errores y avisos al usuario
- [ ] Registrar en auditoría operaciones exitosas
- [ ] Proteger rutas con `AuthorizationGuard`
- [ ] Ejecutar tests: `ng test`
- [ ] Revisar auditoría en la consola
- [ ] Documentar nuevas reglas agregadas

---

## 🔗 Enlaces Internos

### Dentro de BUSINESS_RULES.md
- [Descripción General](#descripción-general)
- [Arquitectura de Reglas](#arquitectura-de-reglas)
- [Validaciones por Entidad](#validaciones-por-entidad)
- [Control de Acceso](#control-de-acceso-y-autorización)
- [Auditoría](#auditoría-y-logs)
- [Integración en Componentes](#integración-en-componentes)
- [Ejemplos de Uso](#ejemplos-de-uso)

### Dentro de ARCHITECTURE.md
- [Diagrama General](#-diagrama-general-del-sistema)
- [Flujo de Validación](#🔄-flujo-de-validación-detallado)
- [Servicios Principales](#🎯-servicios-principales)
- [Matriz de Roles](#🔐-matriz-de-roles-y-permisos)
- [Ciclo de Vida](#📝-ejemplo-flujo-completo-de-crear-póliza)

### Dentro de IMPLEMENTATION_GUIDE.md
- [Comenzar a Usar](#-comenzar-a-usar)
- [Roles y Permisos](#🔐-roles-y-permisos)
- [Auditoría](#📊-auditoría)
- [Ejemplos Completos](#-ejemplos-completos)
- [Próximos Pasos](#-próximos-pasos)

---

## 🆘 Troubleshooting

### Error: "No tiene permisos"
→ Revisar: BUSINESS_RULES.md → Matriz de Permisos
→ Verificar: authorization.service.ts → método tienePermiso()

### Error: "Validación fallida"
→ Revisar: Los errores específicos en resultado.errores
→ Usar: validation.obtenerMensajeError() para mensaje amigable

### Error: "Entidad no existe"
→ Verificar: Que el ID es correcto
→ Revisar: Base de datos en Firebase

### Auditoría no registra
→ Verificar: BUSINESS_CONFIG.GENERAL.REGISTRAR_AUDITORÍA = true
→ Revisar: FirestoreService puede guardar en colección 'auditoria'

### Tests fallan
→ Ejecutar: `ng test --browsers=Chrome --watch=true`
→ Revisar: Que los servicios están correctamente mockados

---

## 📞 Preguntas Frecuentes

### P: ¿Dónde agrego una nueva validación?
**R**: En `BusinessRulesService.validateX()`, luego integrar en `ValidationService`

### P: ¿Cómo cambio los parámetros de validación?
**R**: En `src/app/config/business.config.ts`

### P: ¿Puedo mostrar advertencias sin rechazar?
**R**: Sí, retorna severity 'WARNING' en RuleViolation

### P: ¿Cómo auditamos cambios de rol?
**R**: `audit.registrarCambioPermiso()` lo registra automáticamente

### P: ¿Dónde veo el historial de auditoría?
**R**: `audit.obtenerAuditoriaPorEntidad()` o `audit.obtenerAuditoriaDelUsuario()`

### P: ¿Puedo crear reportes personalizados?
**R**: Sí, usando métodos de `AuditService` para obtener datos, luego procesarlos

---

## 💾 Configuración Mínima Requerida

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // REQUERIDO
    BusinessRulesService,
    AuthorizationService,
    AuditService,
    ValidationService,
    
    // RECOMENDADO
    AuthorizationGuard,
    FirestoreService
  ]
};

// En componente
constructor(
  private validation: ValidationService,
  private audit: AuditService
) {}

// En ruta
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [AuthorizationGuard],
  data: { rol: 'ADMIN' }
}
```

---

## 🎓 Flujo de Aprendizaje Recomendado

### Día 1: Entendimiento
1. Lee: `RESUMEN_EJECUTIVO.md` (20 min)
2. Lee: `IMPLEMENTATION_GUIDE.md` (30 min)
3. Revisa: `BUSINESS_RULES.md` - primeras secciones (30 min)

### Día 2: Implementación
1. Implementa validaciones en 1 componente (1 hora)
2. Agrega auditoría (30 min)
3. Protege una ruta (30 min)

### Día 3: Profundización
1. Lee: `ARCHITECTURE.md` completo (1 hora)
2. Ejecuta tests: `ng test` (30 min)
3. Agrega una nueva regla (1 hora)

### Día 4-5: Dominio
1. Implementa en todos los componentes (2-3 horas)
2. Crea dashboard de auditoría (2-3 horas)
3. Testing en desarrollo (2 horas)

---

## 📈 Métricas de Éxito

Verifica que el sistema funciona correctamente:

- ✅ Validaciones previenen errores en BD
- ✅ Usuarios ven mensajes claros de error
- ✅ Auditoría registra todas las operaciones
- ✅ Permisos se respetan en todas las operaciones
- ✅ Tests pasan correctamente
- ✅ No hay warnings en consola

---

## 🎯 Siguientes Documentos a Leer

1. **RESUMEN_EJECUTIVO.md** ← Estás aquí (índice y overview)
2. **IMPLEMENTATION_GUIDE.md** ← Para empezar a usar
3. **BUSINESS_RULES.md** ← Referencia completa de reglas
4. **ARCHITECTURE.md** ← Para entender el diseño
5. **Código fuente** → Para profundizar

---

**¡Sistema listo para usar! Comienza con IMPLEMENTATION_GUIDE.md →**

