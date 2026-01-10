# Checklist de Prueba: Aseguradoras

## Configuración Inicial

- [ ] La aplicación está corriendo en `http://localhost:60835/` (o puerto indicado)
- [ ] Backend está ejecutándose en puerto 4000
- [ ] Base de datos Firestore está accesible

## Prueba 1: Ver Trámites Pendientes

1. [ ] Ir a la sección "Aseguradoras" (accesible solo para ADMIN)
2. [ ] Verificar que se carga la lista de "Trámites Pendientes de Aprobación"
3. [ ] Confirmar que solo aparecen trámites con estado `ENVIADO_ASEGURADORA`
4. [ ] Verificar que se muestra: Código, Estudiante, Tipo, Descripción, Estado, Fecha, Acciones

## Prueba 2: Acción "Listo para Aprobar"

1. [ ] Seleccionar un trámite pendiente
2. [ ] Hacer clic en botón verde "✓ Listo para Aprobar"
3. [ ] Confirmar la acción en el popup
4. [ ] **Verificar que aparezca el mensaje**: "Trámite movido a historial y notificación enviada al gestor"
5. [ ] **Verificar que el trámite desaparece** de "Trámites Pendientes"
6. [ ] Hacer clic en "📜 Ver Historial"
7. [ ] **Verificar que el trámite aparece ahora** en la tabla de historial
8. [ ] **Verificar que el estado es**: "REVISADO_ASEGURADORA"
9. [ ] **Verificar que la columna "Observación" muestra**: "✓ En espera de gestor" (azul)

## Prueba 3: Acción "Requiere Correcciones"

1. [ ] Volver a "Trámites Pendientes"
2. [ ] Seleccionar un trámite pendiente
3. [ ] Hacer clic en botón naranja "⚠️ Requiere Correcciones"
4. [ ] **Modal debe mostrar** título "Motivo de Correcciones"
5. [ ] **Modal debe tener campos de**:
   - Código del trámite
   - Nombre del estudiante
   - TextArea para "Motivo de Correcciones"
6. [ ] Escribir un motivo de ejemplo: "Falta documentación de ID"
7. [ ] Hacer clic en "Notificar Correcciones"
8. [ ] **Verificar que aparezca el mensaje**: "Trámite movido a historial y notificación de correcciones enviada al gestor"
9. [ ] **Verificar que el trámite desaparece** de "Trámites Pendientes"
10. [ ] Ir a "📜 Ver Historial"
11. [ ] **Verificar que el trámite aparece** en la tabla
12. [ ] **Verificar que la columna "Observación" muestra el motivo**: "Falta documentación de ID" (naranja)

## Prueba 4: Verificar Cambios en Firestore

Acceder a Firestore Console y verificar:

1. [ ] Abrir colección `tramites`
2. [ ] Seleccionar un trámite que fue procesado
3. [ ] **Verificar que contiene**:
   - `estadoCaso: "REVISADO_ASEGURADORA"`
   - `aseguradoraRevisado: true`
   - `fechaRevisionAseguradora: <fecha actual>`
4. [ ] Para trámites con "Requiere Correcciones":
   - [ ] Verificar que existe `motivoRevisionAseguradora: "<texto>"`

## Prueba 5: Verificar Notificaciones Creadas

Acceder a Firestore Console:

1. [ ] Abrir colección `notificaciones`
2. [ ] **Debe haber nuevos documentos con**:
   - `tipo: "LISTO_APROBACION"` (para aprobaciones)
   - `tipo: "REQUIERE_CORRECCIONES"` (para correcciones)
3. [ ] Verificar que tienen:
   - `destinatario: "UAGpe4hb4gXKsVEK97fn3MFQKK53"` (ID del gestor)
   - `origen: "ASEGURADORA"`
   - `leida: false`
   - `titulo: <mensaje descriptivo>`
   - `mensaje: <detalle>`

## Prueba 6: Gestor-Dash Recibe Notificaciones

1. [ ] Entrar como usuario GESTOR (rol debe ser GESTOR)
2. [ ] Ver el dashboard `gestor-dash`
3. [ ] **Verificar que en "Notificaciones pendientes" aparecen**:
   - [ ] Las nuevas notificaciones de tipo `LISTO_APROBACION`
   - [ ] Las nuevas notificaciones de tipo `REQUIERE_CORRECCIONES`
4. [ ] Verificar que muestra:
   - Icono 📨
   - Mensaje de la notificación
   - ID del trámite
   - Fecha de envío
   - Botón "Marcar leída"

## Prueba 7: Marcar Notificaciones como Leídas

1. [ ] En gestor-dash, ver notificación pendiente
2. [ ] Hacer clic en "Marcar leída"
3. [ ] **Verificar que**:
   - El botón muestra "Marcando..."
   - La notificación desaparece de la lista
   - El contador se actualiza

## Prueba 8: Historial Visual

1. [ ] En "Ver Historial" de aseguradoras
2. [ ] Verificar tabla completa:
   - [ ] Código del trámite
   - [ ] Nombre y cédula del estudiante
   - [ ] Tipo de trámite
   - [ ] Descripción
   - [ ] Estado: "REVISADO_ASEGURADORA"
   - [ ] **Fecha Proceso**: Debe mostrar `fechaRevisionAseguradora`
   - [ ] **Observación**: Motivo o "✓ En espera de gestor"

## Prueba 9: Filtros y Búsqueda

1. [ ] En "Trámites Pendientes" (si hay múltiples)
2. [ ] Verificar que se filtra correctamente solo por `ENVIADO_ASEGURADORA`
3. [ ] En "Historial"
4. [ ] Verificar que muestra solo `REVISADO_ASEGURADORA` y estados finales

## Prueba 10: Sin Errores en Consola

1. [ ] Abrir la consola del navegador (F12)
2. [ ] Pestaña "Console"
3. [ ] **Verificar que NO hay errores rojo**
4. [ ] Verificar que hay logs de color (info):
   - `[aseguradoras] Trámites filtrados: X`
   - `[aseguradoras] Historial cargado: X`
   - `[aseguradoras] Notificación creada para el gestor`

## Prueba 11: Edge Cases

1. [ ] **Sin trámites pendientes**:
   - [ ] Debe mostrar: "No hay trámites pendientes de revisión."
   - [ ] Botón "Ver Historial" debe funcionar igual

2. [ ] **Sin historial**:
   - [ ] Debe mostrar: "No hay trámites en el historial."
   - [ ] Debe poder volver a "Ver Pendientes"

3. [ ] **Modal sin motivo**:
   - [ ] Escribir "Requiere Correcciones" sin rellenar el motivo
   - [ ] Hacer clic en "Notificar Correcciones"
   - [ ] **Debe mostrar error**: "Debe proporcionar un motivo"

4. [ ] **Cancelar modal**:
   - [ ] Abrir modal
   - [ ] Escribir un motivo
   - [ ] Hacer clic en "Cancelar"
   - [ ] **Verificar que modal se cierra sin guardar**

## Prueba 12: Refresh de Página

1. [ ] Ir a aseguradoras
2. [ ] Procesar un trámite (Listo para Aprobar o Correcciones)
3. [ ] Presionar F5 para refrescar la página
4. [ ] **Verificar que**:
   - [ ] Los cambios persisten
   - [ ] El trámite sigue en historial
   - [ ] NO aparece en pendientes nuevamente
   - [ ] Los datos se cargan correctamente

## Estado de Pruebas

| Prueba | Resultado | Notas |
|--------|-----------|-------|
| 1. Ver Pendientes | [ ] Pasar / [ ] Fallar | |
| 2. Listo Aprobar | [ ] Pasar / [ ] Fallar | |
| 3. Requiere Correcciones | [ ] Pasar / [ ] Fallar | |
| 4. Firestore Actualizado | [ ] Pasar / [ ] Fallar | |
| 5. Notificaciones Creadas | [ ] Pasar / [ ] Fallar | |
| 6. Gestor-Dash Recibe | [ ] Pasar / [ ] Fallar | |
| 7. Marcar Leída | [ ] Pasar / [ ] Fallar | |
| 8. Historial Visual | [ ] Pasar / [ ] Fallar | |
| 9. Filtros Correctos | [ ] Pasar / [ ] Fallar | |
| 10. Sin Errores Console | [ ] Pasar / [ ] Fallar | |
| 11. Edge Cases | [ ] Pasar / [ ] Fallar | |
| 12. Refresh Persiste | [ ] Pasar / [ ] Fallar | |

**RESULTADO FINAL**: [ ] TODO OK / [ ] REQUIERE AJUSTES

## Problemas Encontrados y Soluciones

(Espacio para documentar cualquier problema durante las pruebas)

```
Problema: [Describir]
Causa: [Investigación]
Solución: [Implementada]
```

---

**Última Actualización**: 10 de Enero de 2026
**Estado**: Listo para pruebas en ambiente local
