# API Documentation - Sistema de Seguros de Vida Estudiantil UTPL

## Base URL
```
http://localhost:4000/api
```

## Autenticación
Todas las rutas (excepto login/registro) requieren el header:
```
Authorization: Bearer <firebase_id_token>
```

El token se valida con Firebase Auth y extrae `uid` y `rol` del usuario.

---

## 1. Trámites (`/tramites`)

### POST `/tramites`
**Roles:** `cliente`, `gestor`  
**Descripción:** Crear nuevo trámite (Registrar Nuevo Trámite del diagrama de secuencia)  
**Body:**
```json
{
  "cedula": "1104567890",
  "tipo": "fallecimiento",
  "descripcion": "Fallecimiento por causa natural",
  "beneficiario": {
    "nombreCompleto": "Juan Pérez",
    "cedula": "1104567891",
    "relacion": "Padre",
    "telefono": "0987654321",
    "correo": "juan@example.com"
  }
}
```
**Flujo:**
1. Verifica elegibilidad del estudiante (estado académico activo + cobertura vigente)
2. Aplica reglas de negocio activas
3. Crea trámite con estado `REGISTRADO`
4. Agrega beneficiario si se proporciona
5. Envía notificación inicial
6. Registra auditoría

**Response 201:**
```json
{
  "idTramite": "abc123",
  "codigoUnico": "T-20240115-001",
  "estado": "registrado",
  "estudianteEmbebido": {...},
  "fechaCreacion": "2024-01-15T10:30:00Z"
}
```

---

### GET `/tramites`
**Roles:** Todos (filtrado por rol)  
**Descripción:** Listar trámites del usuario
- **gestor/admin:** Todos los trámites
- **cliente/aseguradora:** Solo trámites propios

**Response 200:**
```json
[
  {
    "idTramite": "abc123",
    "codigoUnico": "T-20240115-001",
    "estado": "registrado",
    "tipo": "fallecimiento",
    "fechaCreacion": "2024-01-15T10:30:00Z"
  }
]
```

---

### GET `/tramites/:id`
**Roles:** Todos  
**Descripción:** Obtener trámite por ID

**Response 200:**
```json
{
  "idTramite": "abc123",
  "codigoUnico": "T-20240115-001",
  "estado": "registrado",
  "tipo": "fallecimiento",
  "descripcion": "...",
  "estudianteEmbebido": {...},
  "beneficiarioOpcional": {...},
  "documentos": [],
  "historial": [
    {
      "estadoAnterior": "borrador",
      "estadoNuevo": "registrado",
      "fecha": "2024-01-15T10:30:00Z",
      "actorUid": "user123",
      "observacion": "Trámite creado"
    }
  ],
  "fechaCreacion": "2024-01-15T10:30:00Z"
}
```

---

### GET `/tramites/:id/historial`
**Roles:** Todos  
**Descripción:** Obtener historial completo (estados + auditoría)

**Response 200:**
```json
{
  "historialEstados": [...],
  "auditorias": [
    {
      "accion": "CREAR_TRAMITE",
      "usuarioId": "user123",
      "fecha": "2024-01-15T10:30:00Z",
      "datosAnteriores": null,
      "datosNuevos": {...}
    }
  ]
}
```

---

### GET `/tramites/estado/:estado`
**Roles:** `gestor`, `admin`  
**Descripción:** Listar trámites por estado

**Parámetros URL:**
- `estado`: registrado | en_validacion | validado | observado | enviado_aseguradora | con_respuesta | aprobado | rechazado | con_observaciones | correcciones_pendientes | pago_pendiente | pagado | cerrado

---

### POST `/tramites/:id/validar`
**Roles:** `gestor`, `admin`  
**Descripción:** Validar información del trámite (Validar Información del diagrama)  
**Body:**
```json
{
  "vigenciaMatricula": true,
  "requisitosSiniestro": true,
  "observaciones": "Documentos completos"
}
```
**Flujo:**
1. Valida vigencia matrícula
2. Valida requisitos de siniestro
3. Cambia estado a `VALIDADO` o `OBSERVADO`
4. Registra auditoría
5. Envía notificación

---

### POST `/tramites/:id/enviar-aseguradora`
**Roles:** `gestor`, `admin`  
**Descripción:** Enviar trámite a aseguradora (Procesar y Resolver del diagrama)  
**Body:**
```json
{
  "idAseguradora": "aseg123"
}
```
**Flujo:**
1. Valida estado sea `VALIDADO`
2. Actualiza `aseguradora` en trámite
3. Cambia estado a `ENVIADO_ASEGURADORA`
4. Registra auditoría

---

### POST `/tramites/:id/resultado`
**Roles:** `gestor`, `admin`, `aseguradora`  
**Descripción:** Registrar resultado de aseguradora  
**Body:**
```json
{
  "aprobado": true,
  "montoAprobado": 5000,
  "observaciones": "Aprobado según póliza"
}
```
**Flujo:**
1. Valida estado sea `ENVIADO_ASEGURADORA` o `CON_RESPUESTA`
2. Actualiza `respuestaAseguradora`
3. Cambia estado a `APROBADO`, `RECHAZADO` o `CON_OBSERVACIONES`
4. Registra auditoría
5. Envía notificación

---

### POST `/tramites/:id/correcciones`
**Roles:** `gestor`, `admin`  
**Descripción:** Solicitar correcciones (Gestionar Correcciones del diagrama)  
**Body:**
```json
{
  "descripcion": "Falta certificado de defunción actualizado"
}
```
**Flujo:**
1. Crea registro de corrección
2. Cambia estado a `CORRECCIONES_PENDIENTES`
3. Registra auditoría
4. Envía notificación

---

### POST `/tramites/:id/pago`
**Roles:** `gestor`, `admin`  
**Descripción:** Confirmar pago (Monitorear Pago del diagrama)  
**Flujo:**
1. Valida estado sea `APROBADO` o `PAGO_PENDIENTE`
2. Cambia estado: `PAGO_PENDIENTE` → `PAGADO` → `CERRADO`
3. Actualiza `estadoPago` y `fechaPago`
4. Registra auditoría
5. Envía notificación

---

## 2. Estudiantes (`/estudiantes`)

### POST `/estudiantes/verificar-elegibilidad`
**Roles:** Todos  
**Descripción:** Verificar elegibilidad para crear trámite (Verificar Elegibilidad caso de uso)  
**Body:**
```json
{
  "cedula": "1104567890"
}
```
**Response 200:**
```json
{
  "elegible": true,
  "razon": null,
  "estudiante": {
    "idEstudiante": "est123",
    "cedula": "1104567890",
    "nombreCompleto": "María López",
    "estadoAcademico": "activo",
    "estadoCobertura": "vigente",
    "periodoAcademico": "2024-1"
  }
}
```

---

### GET `/estudiantes/cedula/:cedula`
**Roles:** Todos  
**Descripción:** Obtener estudiante por cédula

---

### GET `/estudiantes/:id`
**Roles:** Todos  
**Descripción:** Obtener estudiante por ID

---

### GET `/estudiantes`
**Roles:** `gestor`, `admin`  
**Descripción:** Listar todos los estudiantes

---

### POST `/estudiantes`
**Roles:** `gestor`, `admin`  
**Descripción:** Crear estudiante  
**Body:**
```json
{
  "cedula": "1104567890",
  "nombreCompleto": "María López",
  "periodoAcademico": "2024-1",
  "estadoAcademico": "activo",
  "estadoCobertura": "vigente"
}
```

---

### PATCH `/estudiantes/:id/estado`
**Roles:** `gestor`, `admin`  
**Descripción:** Actualizar estado académico  
**Body:**
```json
{
  "estadoAcademico": "inactivo"
}
```
**Valores permitidos:** `activo`, `inactivo`, `graduado`, `retirado`

---

## 3. Documentos (`/documentos`)

### POST `/documentos/upload`
**Roles:** Todos  
**Descripción:** Subir documento (Adjuntar Documentos caso de uso)  
**Content-Type:** `multipart/form-data`  
**Form Data:**
- `archivo`: File (PDF, JPEG, PNG; max 10MB)
- `tramiteId`: string
- `tipo`: cedula | certificado_defuncion | informe_medico | certificado_matricula | acta_accidente | otro
- `descripcion`: string (opcional)

**Flujo:**
1. Valida tipo de archivo (PDF, JPEG, PNG)
2. Sube archivo a Firebase Storage (`tramites/{tramiteId}/{timestamp}_{filename}`)
3. Crea registro en Firestore con `urlArchivo`, `validado: false`

**Response 201:**
```json
{
  "idDocumento": "doc123",
  "tramiteId": "abc123",
  "tipo": "certificado_defuncion",
  "nombreArchivo": "certificado.pdf",
  "urlArchivo": "https://storage.googleapis.com/...",
  "fechaSubida": "2024-01-15T10:30:00Z",
  "validado": false
}
```

---

### GET `/documentos/tramite/:tramiteId`
**Roles:** Todos  
**Descripción:** Obtener documentos de un trámite

---

### GET `/documentos/:id`
**Roles:** Todos  
**Descripción:** Obtener documento por ID

---

### PATCH `/documentos/:id/validar`
**Roles:** `gestor`, `admin`  
**Descripción:** Marcar documento como validado (Validar Información)  
**Flujo:**
1. Actualiza `validado: true`

---

### PUT `/documentos/:id`
**Roles:** Todos  
**Descripción:** Actualizar metadatos del documento

---

### DELETE `/documentos/:id`
**Roles:** Todos  
**Descripción:** Eliminar documento (elimina archivo de Storage y registro de Firestore)

---

## 4. Notificaciones (`/notificaciones`)

### GET `/notificaciones/mis-notificaciones`
**Roles:** Todos  
**Descripción:** Obtener notificaciones del usuario autenticado

**Response 200:**
```json
[
  {
    "idNotificacion": "not123",
    "tipo": "sistema",
    "mensaje": "Trámite T-20240115-001 ha sido validado",
    "destinatario": "user123",
    "tramiteId": "abc123",
    "fechaEnvio": "2024-01-15T11:00:00Z",
    "leida": false
  }
]
```

---

### GET `/notificaciones/no-leidas`
**Roles:** Todos  
**Descripción:** Obtener notificaciones no leídas

---

### GET `/notificaciones/tramite/:tramiteId`
**Roles:** Todos  
**Descripción:** Obtener notificaciones de un trámite

---

### PATCH `/notificaciones/:id/leer`
**Roles:** Todos  
**Descripción:** Marcar notificación como leída

---

## 5. Reglas de Negocio (`/reglas`)

### GET `/reglas`
**Roles:** `gestor`, `admin`  
**Descripción:** Listar todas las reglas

---

### GET `/reglas/activas`
**Roles:** Todos  
**Descripción:** Obtener reglas activas (usadas en validación automática)

---

### GET `/reglas/:id`
**Roles:** `gestor`, `admin`  
**Descripción:** Obtener regla por ID

---

### POST `/reglas`
**Roles:** `admin`  
**Descripción:** Crear regla de negocio  
**Body:**
```json
{
  "nombre": "MONTO_MAXIMO",
  "descripcion": "Monto máximo permitido por trámite",
  "valor": 10000,
  "estado": true
}
```

---

### PUT `/reglas/:id`
**Roles:** `admin`  
**Descripción:** Actualizar regla

---

### PATCH `/reglas/:id/activar`
**Roles:** `admin`  
**Descripción:** Activar regla

---

### PATCH `/reglas/:id/desactivar`
**Roles:** `admin`  
**Descripción:** Desactivar regla

---

## 6. Auditoría (`/auditoria`)

### GET `/auditoria/tramite/:tramiteId`
**Roles:** `gestor`, `admin`  
**Descripción:** Obtener auditoría de un trámite

**Response 200:**
```json
[
  {
    "accion": "CREAR_TRAMITE",
    "entidad": "tramite",
    "entidadId": "abc123",
    "usuarioId": "user123",
    "fecha": "2024-01-15T10:30:00Z",
    "datosAnteriores": null,
    "datosNuevos": {...},
    "ipAddress": "192.168.1.1"
  }
]
```

---

### GET `/auditoria/usuario/:usuarioId`
**Roles:** `admin`  
**Descripción:** Obtener auditoría de un usuario

---

### GET `/auditoria/entidad/:entidad`
**Roles:** `admin`  
**Descripción:** Obtener auditoría por entidad  
**Parámetros:** `entidad` = tramite | estudiante | regla | documento

---

### GET `/auditoria/fecha/:fechaInicio/:fechaFin`
**Roles:** `admin`  
**Descripción:** Obtener auditoría por rango de fechas  
**Formato fechas:** ISO 8601 (2024-01-15)

---

### POST `/auditoria`
**Roles:** `admin`  
**Descripción:** Registrar evento de auditoría manualmente

---

## 7. Aseguradoras (`/aseguradoras`)

### GET `/aseguradoras`
**Roles:** Todos  
**Descripción:** Listar todas las aseguradoras

---

### GET `/aseguradoras/:id`
**Roles:** Todos  
**Descripción:** Obtener aseguradora por ID

---

### POST `/aseguradoras`
**Roles:** `admin`  
**Descripción:** Crear aseguradora  
**Body:**
```json
{
  "nombre": "Seguros Bolívar",
  "correoContacto": "contacto@segurosbolivar.com"
}
```

---

### PUT `/aseguradoras/:id`
**Roles:** `admin`  
**Descripción:** Actualizar aseguradora

---

### DELETE `/aseguradoras/:id`
**Roles:** `admin`  
**Descripción:** Eliminar aseguradora

---

## 8. Beneficiarios (`/beneficiarios`)

### GET `/beneficiarios/tramite/:tramiteId`
**Roles:** Todos  
**Descripción:** Obtener beneficiarios de un trámite

---

### GET `/beneficiarios/:id`
**Roles:** Todos  
**Descripción:** Obtener beneficiario por ID

---

### POST `/beneficiarios`
**Roles:** Todos  
**Descripción:** Crear beneficiario  
**Body:**
```json
{
  "tramiteId": "abc123",
  "nombreCompleto": "Juan Pérez",
  "cedula": "1104567891",
  "relacion": "Padre",
  "telefono": "0987654321",
  "correo": "juan@example.com"
}
```

---

### PUT `/beneficiarios/:id`
**Roles:** Todos  
**Descripción:** Actualizar beneficiario

---

### DELETE `/beneficiarios/:id`
**Roles:** Todos  
**Descripción:** Eliminar beneficiario

---

## Flujo Completo del Sistema

### 1. Crear Trámite
```
POST /estudiantes/verificar-elegibilidad
  → elegible: true
POST /tramites
  → estado: registrado
POST /documentos/upload (múltiples archivos)
  → documentos adjuntados
```

### 2. Validación
```
POST /tramites/:id/validar
  → estado: validado
```

### 3. Envío a Aseguradora
```
POST /tramites/:id/enviar-aseguradora
  → estado: enviado_aseguradora
```

### 4. Resultado de Aseguradora
```
POST /tramites/:id/resultado
  → estado: aprobado | rechazado | con_observaciones
```

### 5. Correcciones (si es necesario)
```
POST /tramites/:id/correcciones
  → estado: correcciones_pendientes
(usuario adjunta nuevos documentos)
POST /tramites/:id/validar
  → estado: validado
(repetir paso 3)
```

### 6. Pago y Cierre
```
POST /tramites/:id/pago
  → estado: pago_pendiente → pagado → cerrado
```

---

## Estados del Trámite (Máquina de Estados)

```
borrador → registrado → en_validacion → [validado | observado]
  ↓
validado → enviado_aseguradora → con_respuesta
  ↓
con_respuesta → [aprobado | rechazado | con_observaciones]
  ↓
aprobado → pago_pendiente → pagado → cerrado
  ↓
correcciones_pendientes → en_validacion (bucle)
```

**Transiciones válidas:** Ver `TRANSICIONES_VALIDAS` en [tramite.ts](../domain/tramite.ts)

---

## Códigos de Error

- **400 Bad Request:** Datos inválidos, transición de estado no permitida
- **401 Unauthorized:** Token no válido o no proporcionado
- **403 Forbidden:** Usuario no tiene permisos para esta acción
- **404 Not Found:** Recurso no encontrado
- **500 Internal Server Error:** Error del servidor

---

## Notas Importantes

1. **Autenticación:** Todos los endpoints (excepto login) requieren token Firebase válido
2. **Roles:** `cliente`, `gestor`, `admin`, `aseguradora`
3. **Auditoría:** Todas las operaciones críticas se registran automáticamente
4. **Notificaciones:** Se envían automáticamente en cambios de estado (implementación stub para email/SMS/FCM)
5. **Reglas de Negocio:** Se aplican automáticamente en `POST /tramites` (validación de elegibilidad + reglas activas)
6. **Storage:** Archivos se suben a Firebase Storage en `tramites/{tramiteId}/`
7. **Firestore Collections:**
   - `tramites`
   - `estudiantes`
   - `beneficiarios`
   - `documentos`
   - `notificaciones`
   - `reglas_negocio`
   - `auditoria`
   - `aseguradoras`
   - `usuarios` (para autenticación y roles)

---

## Testing con Postman

1. **Obtener token Firebase:**
   - Login con email/password en frontend Angular
   - Copiar `idToken` de Firebase Auth

2. **Configurar Postman:**
   - Collection variable: `token` = `<firebase_id_token>`
   - Header global: `Authorization: Bearer {{token}}`

3. **Orden de prueba:**
   - Crear estudiante
   - Verificar elegibilidad
   - Crear trámite
   - Subir documentos
   - Validar trámite
   - Enviar a aseguradora
   - Registrar resultado
   - Confirmar pago

---

**Arquitectura:** DDD con 5 capas (Domain → Application → Infrastructure → Presentation → Platform)  
**Generado:** 15 Enero 2024  
**Versión API:** 0.1.0
