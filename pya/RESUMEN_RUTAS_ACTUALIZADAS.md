# Resumen de Rutas Actualizadas - Sistema Seguros Vida

## Rutas Públicas
- **`/login`** - LoginComponent

## Rutas CLIENTE
- **`/cliente-inicio`** - ClienteInicioComponent (Página principal)
- **`/mi-solicitud`** - MiSolicitudComponent (Ver trámite personal)
- **`/envio-documentos`** - EnvioDocumentosComponent (Subir documentos)
- **`/notificaciones`** - NotificacionesComponent (Ver notificaciones)
- **`/siniestros`** - SiniestrosComponent (Registrar siniestros)
- **`/registro-siniestro`** - RegistroSiniestroComponent (Formulario de siniestro)

## Rutas GESTOR
- **`/gestor-dashboard`** - GestorDashComponent (Panel principal del gestor)
- **`/estudiantes`** - EstudiantesPage (Gestión de estudiantes)
- **`/documentos`** - DocumentosComponent (Gestión de documentos)

## Rutas ADMIN
- **`/admin-dashboard`** - AdminDashComponent (Panel principal del admin)
- **`/aseguradoras`** - AseguradorasPage (Gestión de aseguradoras)
- **`/auditoria`** - AuditoriaPage (Auditoría del sistema)
- **`/usuarios`** - UsuariosPage (Gestión de usuarios)
- **`/polizas`** - PolizasPage (Gestión de pólizas)

## Rutas ASEGURADORA
- **`/insurer-dashboard`** - InsurerDashComponent (Panel de aseguradora)

## Rutas de Error
- **`/acceso-denegado`** - AccesoDenegadoComponent (Error 403)
- **`/error`** - ErrorComponent (Error 500)

## Rutas Legacy (compatibilidad)
- **`/user-dashboard`** - UserDashComponent (redireccionado desde gestor-dashboard)

## Rutas por Defecto
- **`/`** → Redirige a `/login`
- **`/**`** (no encontrada) → Redirige a `/login`

---

## Cambios Realizados

✅ Renombradas rutas inconsistentes:
- `admin-dash` → `admin-dashboard`
- `gestor-dash` → `gestor-dashboard`
- `user-dashboard` → Se mantiene para compatibilidad

✅ Agregadas rutas faltantes:
- `/estudiantes`
- `/acceso-denegado`
- `/error`

✅ Añadidos roles en canActivate:
- Cada ruta ahora valida el rol del usuario
- CLIENTE solo accede a sus rutas
- GESTOR accede a gestión de estudiantes y documentos
- ADMIN accede a todas las rutas administrativas

✅ Creados componentes faltantes:
- AccesoDenegadoComponent
- ErrorComponent

---

## Cómo Probar

1. **CLIENTE** (bustamanteroberto49@gmail.com):
   - Puede acceder a: cliente-inicio, mi-solicitud, envio-documentos, notificaciones, siniestros
   - NO puede acceder a: admin-dashboard, gestor-dashboard, usuarios

2. **GESTOR**:
   - Puede acceder a: gestor-dashboard, estudiantes, documentos
   - NO puede acceder a: admin-dashboard, auditoria, usuarios

3. **ADMIN**:
   - Puede acceder a: admin-dashboard, aseguradoras, auditoria, usuarios, polizas
   - Acceso completo al sistema

4. **Rutas no protegidas**:
   - Login: Accesible sin autenticación
   - Error: Accesible para mostrar errores

---

## Validación de Guardias

Todas las rutas protegidas utilizan `roleGuard` que valida:
1. Si el usuario está autenticado (verifica localStorage.userRole)
2. Si tiene el rol requerido en la ruta
3. Si no cumple, redirige a `/login`
