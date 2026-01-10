# Flujo de Trabajo: Aseguradoras

## Estados del Trámite en Aseguradoras

```
┌─────────────────────────────────────────────────────────────────┐
│                    CICLO DE VIDA DEL TRÁMITE                    │
└─────────────────────────────────────────────────────────────────┘

1️⃣ INICIAL: ENVIADO_ASEGURADORA
   └─ Trámite aparece en "Trámites Pendientes"
   └─ Aseguradoras revisa y toma decisión

2️⃣ DESPUÉS DE ACCIÓN: REVISADO_ASEGURADORA
   ├─ Si clickea "✓ Listo para Aprobar"
   │  └─ Se crea notificación tipo: LISTO_APROBACION
   │  └─ Se guarda: aseguradoraRevisado = true
   │  └─ Se guarda: fechaRevisionAseguradora = ahora
   │
   └─ Si clickea "⚠️ Requiere Correcciones"
      └─ Se crea notificación tipo: REQUIERE_CORRECCIONES
      └─ Se guarda: motivoRevisionAseguradora = texto del motivo
      └─ Se guarda: fechaRevisionAseguradora = ahora

3️⃣ MOSTRADO EN: "Ver Historial"
   └─ Trámite desaparece de "Pendientes"
   └─ Trámite aparece en "Historial"
   └─ Espera decisión del GESTOR en gestor-dash
```

## Cambios en Firestore

### Cuando se aprueba ("Listo para Aprobar")
```javascript
{
  estadoCaso: "REVISADO_ASEGURADORA",
  aseguradoraRevisado: true,
  fechaRevisionAseguradora: <fecha actual>,
  
  // Notificación creada con:
  // - tipo: "LISTO_APROBACION"
  // - destinatario: "UAGpe4hb4gXKsVEK97fn3MFQKK53" (gestor)
  // - origen: "ASEGURADORA"
}
```

### Cuando se requieren correcciones
```javascript
{
  estadoCaso: "REVISADO_ASEGURADORA",
  aseguradoraRevisado: true,
  fechaRevisionAseguradora: <fecha actual>,
  motivoRevisionAseguradora: "<texto ingresado por aseguradoras>",
  
  // Notificación creada con:
  // - tipo: "REQUIERE_CORRECCIONES"
  // - mensaje incluye el motivo
  // - destinatario: "UAGpe4hb4gXKsVEK97fn3MFQKK53" (gestor)
  // - origen: "ASEGURADORA"
}
```

## Flujo de Datos

```
┌──────────────────────────────────┐
│   ASEGURADORAS.TS                │
│  (src/app/pages/aseguradoras/)   │
└──────────────────┬───────────────┘
                   │
        ┌──────────┴───────────┐
        │                      │
        ▼                      ▼
┌─────────────────┐    ┌─────────────────────┐
│ Clic Botón      │    │ Clic Modal Motivo   │
│ Listo Aprobar   │    │ Requiere Correcciones
└────────┬────────┘    └────────┬────────────┘
         │                      │
         └──────────┬───────────┘
                    │
         ┌──────────▼──────────┐
         │                     │
         ▼                     ▼
    UPDATE Firestore    CREATE Notification
    (Trámite)           (Notificaciones)
         │                     │
         └──────────┬──────────┘
                    │
       ┌────────────▼─────────────┐
       │                          │
       ▼                          ▼
   Reload                    Reload
   Pendientes                Historial
       │                          │
       └────────────┬─────────────┘
                    │
                    ▼
          Mostrar mensaje éxito
          y actualizar UI
```

## Diferencias Clave

| Aspecto | ANTES | AHORA |
|---------|-------|-------|
| **Acción Aprobar** | Actualiza `estadoCaso: 'APROBADO'` | Actualiza `estadoCaso: 'REVISADO_ASEGURADORA'` + envía notificación |
| **Acción Rechazar** | Actualiza `estadoCaso: 'RECHAZADO'` | Actualiza `estadoCaso: 'REVISADO_ASEGURADORA'` + motivo + notificación |
| **Cambios DB** | Aseguradoras modifica estado final | Aseguradoras solo indica revisión |
| **Aprobación Final** | Hecha por Aseguradoras | Hecha por Gestor (en gestor-dash) |
| **Visible en Pendientes** | Mientras estado ≠ APROBADO/RECHAZADO | Solo si estado = ENVIADO_ASEGURADORA |
| **Visible en Historial** | Estados APROBADO/RECHAZADO | Estados REVISADO_ASEGURADORA + finales |

## Métodos Principales

### `cargarTramitesPendientes()`
- Filtra: `estadoCaso === 'ENVIADO_ASEGURADORA'`
- Mapea fechas de Timestamp a Date
- Mostrado en pestaña "Trámites Pendientes"

### `cargarHistorial()`
- Filtra: estados que incluyen 'REVISADO_ASEGURADORA' o finales
- Ordena por `fechaRevisionAseguradora` (más reciente primero)
- Mostrado en pestaña "Ver Historial"

### `aprobarTramite(tramite)`
1. Actualiza Firestore: `estadoCaso: 'REVISADO_ASEGURADORA'`
2. Crea notificación: `tipo: 'LISTO_APROBACION'`
3. Recarga pendientes (se quita de lista)
4. Recarga historial (aparece en lista)

### `rechazarTramite()`
1. Valida que exista motivo
2. Actualiza Firestore: `estadoCaso: 'REVISADO_ASEGURADORA'` + `motivoRevisionAseguradora`
3. Crea notificación: `tipo: 'REQUIERE_CORRECCIONES'` con motivo
4. Cierra modal
5. Recarga pendientes y historial

## Próximos Pasos

El **gestor-dash** debe:
1. ✅ Recibir las notificaciones del tipo `LISTO_APROBACION`
2. ✅ Recibir las notificaciones del tipo `REQUIERE_CORRECCIONES`
3. ✅ Permitir al gestor aprobar el trámite (estado final: APROBADO)
4. ✅ Permitir al gestor rechazar el trámite (estado final: RECHAZADO)
5. ✅ Marcar notificaciones como leídas

Cuando gestor-dash actualice a APROBADO/RECHAZADO, el trámite desaparecerá de "Historial de Aseguradoras" y pasará a estado final en gestor-dash.
