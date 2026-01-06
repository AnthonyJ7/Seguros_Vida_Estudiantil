# 👥 CLASIFICACIÓN DE ROLES MEJORADA

## Resumen Ejecutivo

Se ha implementado un sistema de roles claramente definido y jerárquico con **5 niveles de acceso**:

1. **ADMIN** - Control total del sistema
2. **GESTOR** - Gestión administrativa
3. **INSURER** - Gestión de seguros
4. **CLIENTE** - Acceso básico
5. **AUDITOR** - Lectura y auditoría

---

## 📊 Matriz de Roles

### ADMIN (Administrador)
| Propiedad | Valor |
|-----------|-------|
| **Nivel** | ADMINISTRADOR |
| **Color** | 🔴 Rojo (#EF4444) |
| **Icono** | 👨‍💼 |
| **Descripción** | Control total del sistema |
| **Jerarquía** | 5/5 (Máxima) |

**Permisos:**
- ✅ CRUD de usuarios
- ✅ CRUD de estudiantes
- ✅ CRUD de pólizas
- ✅ CRUD de siniestros
- ✅ CRUD de documentos
- ✅ Auditoría completa
- ✅ Configuración global
- ✅ Generación de reportes

**Acceso:**
- Dashboard: ✅
- Usuarios: ✅
- Estudiantes: ✅
- Pólizas: ✅
- Siniestros: ✅
- Documentos: ✅
- Auditoría: ✅
- Configuración: ✅

---

### GESTOR (Gestor Administrativo)
| Propiedad | Valor |
|-----------|-------|
| **Nivel** | GESTIÓN |
| **Color** | 🟠 Ámbar (#F59E0B) |
| **Icono** | 👨‍💻 |
| **Descripción** | Gestión de estudiantes, trámites y documentos |
| **Jerarquía** | 3/5 |

**Permisos:**
- ✅ Crear/leer/actualizar estudiantes
- ✅ Crear/leer/actualizar siniestros
- ✅ Crear/leer/eliminar documentos
- ✅ Leer pólizas
- ✅ Generar reportes básicos
- ❌ CRUD de usuarios
- ❌ Auditoría
- ❌ Configuración

**Acceso:**
- Dashboard: ✅
- Usuarios: ❌
- Estudiantes: ✅
- Pólizas: ✅
- Siniestros: ✅
- Documentos: ✅
- Reportes: ✅
- Auditoría: ❌
- Configuración: ❌

---

### INSURER (Gestor de Seguros)
| Propiedad | Valor |
|-----------|-------|
| **Nivel** | GESTIÓN |
| **Color** | 🔵 Azul (#3B82F6) |
| **Icono** | 🏢 |
| **Descripción** | Gestión de pólizas, siniestros y validaciones |
| **Jerarquía** | 3/5 |

**Permisos:**
- ✅ Crear/leer/actualizar/aprobar pólizas
- ✅ Leer/actualizar/aprobar siniestros
- ✅ Leer documentos
- ✅ Leer estudiantes
- ✅ Generar reportes de pólizas
- ❌ Eliminar pólizas
- ❌ Auditoría
- ❌ Configuración

**Acceso:**
- Dashboard: ✅
- Usuarios: ❌
- Estudiantes: ✅
- Pólizas: ✅
- Siniestros: ✅
- Documentos: ✅
- Reportes: ✅
- Auditoría: ❌
- Configuración: ❌

---

### CLIENTE (Estudiante Asegurado)
| Propiedad | Valor |
|-----------|-------|
| **Nivel** | CLIENTE |
| **Color** | 🟢 Verde (#10B981) |
| **Icono** | 👨‍🎓 |
| **Descripción** | Acceso a información personal y pólizas |
| **Jerarquía** | 1/5 |

**Permisos:**
- ✅ Leer datos propios
- ✅ Actualizar perfil propio
- ✅ Leer pólizas propias
- ✅ Crear siniestros
- ✅ Leer siniestros propios
- ✅ Crear documentos
- ✅ Leer notificaciones
- ❌ Ver otros usuarios
- ❌ Modificar datos de otros
- ❌ Acceso administrativo

**Acceso:**
- Dashboard: ✅ (propio)
- Usuarios: ❌
- Estudiantes: ❌
- Pólizas: ✅ (propias)
- Siniestros: ✅ (propios)
- Documentos: ✅ (propios)
- Reportes: ❌
- Auditoría: ❌
- Configuración: ❌

---

### AUDITOR (Auditor del Sistema)
| Propiedad | Valor |
|-----------|-------|
| **Nivel** | AUDITOR |
| **Color** | 🟣 Violeta (#8B5CF6) |
| **Icono** | 👁️ |
| **Descripción** | Acceso de lectura y generación de reportes |
| **Jerarquía** | 2/5 |

**Permisos:**
- ✅ Leer todas las entidades
- ✅ Acceso a auditoría completa
- ✅ Generar reportes
- ❌ Crear/modificar/eliminar datos
- ❌ Cambiar configuración
- ❌ Gestionar usuarios

**Acceso:**
- Dashboard: ✅
- Usuarios: ❌
- Estudiantes: ✅
- Pólizas: ✅
- Siniestros: ✅
- Documentos: ✅
- Reportes: ✅
- Auditoría: ✅
- Configuración: ❌

---

## 🎨 Estilos Visuales por Rol

### Paleta de Colores

```css
ADMIN:    #EF4444 (Red)
GESTOR:   #F59E0B (Amber)
INSURER:  #3B82F6 (Blue)
CLIENTE:  #10B981 (Emerald)
AUDITOR:  #8B5CF6 (Violet)
```

### Componentes Visuales

Cada rol tiene asociados:
- ✅ Color de fondo (bgColor)
- ✅ Color de borde (borderColor)
- ✅ Color de texto (textColor)
- ✅ Color de insignia (badgeColor)
- ✅ Color de botón (buttonColor)
- ✅ Icono emoji único
- ✅ Descripción clara

---

## 🔐 Jerarquía y Privilegios

```
ADMIN (5/5)
  ├── Incluye todos los permisos de INSURER
  ├── Incluye todos los permisos de GESTOR
  ├── Incluye todos los permisos de AUDITOR
  └── Más: Gestión de usuarios y configuración

GESTOR (3/5) e INSURER (3/5)
  ├── Incluyen algunos permisos de AUDITOR
  └── Acceso limitado a datos específicos

AUDITOR (2/5)
  ├── Solo lectura
  └── Sin permisos de modificación

CLIENTE (1/5)
  ├── Solo acceso a datos propios
  └── Acciones limitadas
```

---

## 📋 Matriz de Operaciones

| Operación | ADMIN | GESTOR | INSURER | CLIENTE | AUDITOR |
|-----------|-------|--------|---------|---------|---------|
| Crear estudiante | ✅ | ✅ | ❌ | ❌ | ❌ |
| Leer estudiante | ✅ | ✅ | ✅ | ❌ | ✅ |
| Actualizar estudiante | ✅ | ✅ | ❌ | ❌ | ❌ |
| Eliminar estudiante | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crear póliza | ✅ | ❌ | ✅ | ❌ | ❌ |
| Leer póliza | ✅ | ✅ | ✅ | ✅* | ✅ |
| Actualizar póliza | ✅ | ❌ | ✅ | ❌ | ❌ |
| Aprobar póliza | ✅ | ❌ | ✅ | ❌ | ❌ |
| Eliminar póliza | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crear siniestro | ✅ | ✅ | ❌ | ✅ | ❌ |
| Leer siniestro | ✅ | ✅ | ✅ | ✅* | ✅ |
| Actualizar siniestro | ✅ | ✅ | ✅ | ❌ | ❌ |
| Aprobar siniestro | ✅ | ❌ | ✅ | ❌ | ❌ |
| Eliminar siniestro | ✅ | ❌ | ❌ | ❌ | ❌ |
| Crear documento | ✅ | ✅ | ❌ | ✅ | ❌ |
| Leer documento | ✅ | ✅ | ✅ | ✅* | ✅ |
| Eliminar documento | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crear usuario | ✅ | ❌ | ❌ | ❌ | ❌ |
| Leer usuario | ✅ | ❌ | ❌ | ❌ | ✅ |
| Actualizar usuario | ✅ | ❌ | ❌ | ❌ | ❌ |
| Cambiar rol | ✅ | ❌ | ❌ | ❌ | ❌ |
| Eliminar usuario | ✅ | ❌ | ❌ | ❌ | ❌ |
| Leer auditoría | ✅ | ❌ | ❌ | ❌ | ✅ |
| Generar reportes | ✅ | ✅ | ✅ | ❌ | ✅ |
| Modificar config | ✅ | ❌ | ❌ | ❌ | ❌ |

*Solo acceso a datos propios

---

## 🎯 Casos de Uso Comunes

### ADMIN - Director de Seguros
```
Tareas:
- Crear nuevos usuarios y asignar roles
- Monitorear todas las operaciones
- Ajustar configuración del sistema
- Generar reportes consolidados
- Revisar auditoría completa
```

### GESTOR - Gestor Administrativo
```
Tareas:
- Registrar nuevos estudiantes
- Validar documentos entregados
- Registrar y actualizar siniestros
- Generar reportes administrativos
- Dar seguimiento a trámites
```

### INSURER - Gestor de Aseguradora
```
Tareas:
- Crear pólizas para estudiantes
- Revisar y aprobar siniestros
- Actualizar montos de cobertura
- Generar reportes de pólizas
- Validar solicitudes
```

### CLIENTE - Estudiante
```
Tareas:
- Ver información personal
- Consultar mis pólizas
- Reportar un siniestro
- Subir documentos
- Ver estado de solicitudes
```

### AUDITOR - Auditor Externo
```
Tareas:
- Revisar todas las operaciones
- Generar reportes de auditoría
- Verificar cumplimiento normativo
- Seguimiento a pistas de auditoría
- No puede modificar nada
```

---

## 🔧 Archivos Relacionados

### Configuración
- [roles.config.ts](./src/app/config/roles.config.ts) - Definición completa de roles

### Componentes
- [navbar.ts](./src/app/components/navbar/navbar.ts) - Navegación por rol
- [role-badge.ts](./src/app/components/role-badge/role-badge.ts) - Insignia de rol

### Servicios
- [authorization.service.ts](./src/app/services/authorization.service.ts) - Control de acceso

---

## 📌 Notas Importantes

1. **Acceso Conditional**: El navbar y menú se adaptan automáticamente según el rol
2. **Estilos Dinámicos**: Cada rol tiene su propio esquema de colores
3. **Insignias Visuales**: Los iconos emoji identifican rápidamente el rol
4. **Hierarchía Implícita**: ADMIN puede hacer todo; CLIENTE solo cosas personales
5. **Operaciones**: Cada operación tiene una lista de roles permitidos

---

## ✅ Checklist de Implementación

- [x] Definir 5 tipos de roles claramente
- [x] Crear matriz de permisos
- [x] Implementar jerarquía de privilegios
- [x] Asignar colores únicos por rol
- [x] Crear insignias visuales
- [x] Mejorar navegación (navbar)
- [x] Adaptar menú según rol
- [x] Crear componente de badge
- [x] Documentar casos de uso
- [ ] Probar en todos los navegadores
- [ ] Capacitar usuarios sobre roles
- [ ] Monitorear uso en producción

---

## 🚀 Próximos Pasos

1. **Pruebas de Acceso**: Verificar que cada rol solo puede hacer lo permitido
2. **UI/UX**: Mejorar dashboards específicos para cada rol
3. **Documentación**: Crear guías para usuarios de cada rol
4. **Capacitación**: Entrenar al equipo sobre el nuevo sistema
5. **Monitoreo**: Configurar alertas para actividades inusuales
