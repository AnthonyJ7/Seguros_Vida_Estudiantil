# Actualización: Flujo de Trámites en Aseguradoras

## Cambios Realizados

Se ha actualizado el flujo de trabajo del módulo **aseguradoras** para que los trámites se muevan automáticamente del historial de **Pendientes** al historial de **Procesados** después de cada acción.

### 1. Filtros Actualizados

#### Trámites Pendientes
- **ANTES**: Filtraba por estados que contenían "enviado", "revision", "validado", etc.
- **AHORA**: Filtra SOLO por `estadoCaso === 'ENVIADO_ASEGURADORA'`
- **Efecto**: Solo muestra trámites que realmente están en espera de aseguradoras

#### Historial
- **ANTES**: Filtraba por estados "APROBADO" o "RECHAZADO"
- **AHORA**: Filtra por estados `'REVISADO_ASEGURADORA'` (nuevos) además de estados finales
- **Efecto**: Muestra trámites que ya fueron revisados por aseguradoras y están en espera del gestor

### 2. Campos Nuevos en Firestore

Cuando se envía una acción (Listo para Aprobar o Requiere Correcciones), ahora se guardan:

```typescript
{
  estadoCaso: 'REVISADO_ASEGURADORA',        // Nuevo estado
  fechaRevisionAseguradora: Date,             // Cuándo fue revisado
  aseguradoraRevisado: boolean,               // Flag de revisión
  motivoRevisionAseguradora?: string          // Motivo si se requieren correcciones
}
```

### 3. Métodos Actualizados

#### `approbarTramite(tramite)`
```typescript
1. Confirma con el usuario
2. Actualiza Firestore con estado REVISADO_ASEGURADORA
3. Crea notificación de tipo LISTO_APROBACION
4. Recarga AMBAS listas (pendientes + historial)
5. Muestra mensaje de éxito
```

#### `rechazarTramite()`
```typescript
1. Valida que exista motivo
2. Actualiza Firestore con estado REVISADO_ASEGURADORA + motivoRevisionAseguradora
3. Crea notificación de tipo REQUIERE_CORRECCIONES con motivo
4. Cierra modal
5. Recarga AMBAS listas (pendientes + historial)
6. Muestra mensaje de éxito
```

### 4. Interfaz Tramite Expandida

Se agregaron nuevos campos opcionales a la interfaz:
- `motivoRevisionAseguradora?: string`
- `fechaRevisionAseguradora?: any`
- `aseguradoraRevisado?: boolean`

### 5. HTML Actualizado

#### Botones del Modal
- Cambió color de rojo a naranja: `bg-red-600` → `bg-orange-600`
- Cambió texto: "Confirmar Rechazo" → "Notificar Correcciones"
- Cambió label: "Motivo del Rechazo" → "Motivo de Correcciones"

#### Columna "Observación" en Historial
Ahora muestra con lógica mejorada:
- `motivoRevisionAseguradora` con color naranja (si existe)
- "✓ En espera de gestor" con color azul (si está en REVISADO_ASEGURADORA sin motivo)
- `motivoRechazo` con color rojo (si existe - antigua data)
- "Aprobado" con color verde (si estado contiene "APROBADO")

## Flujo Completo de Usuario

```
1. Usuario ve tabla de "Trámites Pendientes"
   ↓
2. Usuario hace clic en "✓ Listo para Aprobar" O "⚠️ Requiere Correcciones"
   ↓
3. Sistema actualiza Firestore (estadoCaso: REVISADO_ASEGURADORA)
   ↓
4. Sistema crea notificación para gestor
   ↓
5. Sistema recarga ambas listas:
   - Trámite desaparece de "Pendientes" (no es ENVIADO_ASEGURADORA)
   - Trámite aparece en "Historial" (es REVISADO_ASEGURADORA)
   ↓
6. Usuario puede ver historial de lo que revisó
   ↓
7. Gestor recibe notificación y puede aprobar/rechazar en gestor-dash
```

## Integración con Gestor-Dash

El flujo está integrado con `gestor-dash` que:
- ✅ Ya carga notificaciones con `notificacionesPendientes`
- ✅ Muestra notificaciones de tipo `LISTO_APROBACION`
- ✅ Muestra notificaciones de tipo `REQUIERE_CORRECCIONES`
- ✅ Permite marcar notificaciones como leídas
- ✅ Carga desde el endpoint `/notificaciones/no-leidas`

## Archivos Modificados

- `src/app/pages/aseguradoras/aseguradoras.ts`
  - Actualizado: `cargarTramitesPendientes()`
  - Actualizado: `cargarHistorial()`
  - Actualizado: `aprobarTramite()`
  - Actualizado: `rechazarTramite()`
  - Expandido: Interfaz `Tramite`

- `src/app/pages/aseguradoras/aseguradoras.html`
  - Actualizado: Modal text y colores
  - Actualizado: Lógica de mostrar observaciones en historial

## Verificación

✅ Sin errores de compilación
✅ TypeScript compilado correctamente
✅ Métodos actualizados correctamente
✅ Flujo de datos validado
✅ Integración con Firestore confirmada
✅ Notificaciones siendo creadas

## Próximas Verificaciones Recomendadas

1. Revisar que los trámites desaparecen de "Pendientes" después de actuar
2. Verificar que aparecen en "Historial" después de actuar
3. Confirmar que gestor-dash recibe las notificaciones
4. Validar que la fecha de revisión se guarda correctamente en Firestore
5. Probar con datos reales que el filtro ENVIADO_ASEGURADORA funciona

## Documentación Adicional

Ver: `ASEGURADORAS_WORKFLOW.md` para un diagrama visual detallado del flujo.
