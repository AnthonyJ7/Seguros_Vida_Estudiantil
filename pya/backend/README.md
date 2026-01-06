# Backend PYA (Node + Express + Firebase Admin)

Estructura en capas:
- `src/config`: inicialización Firebase Admin.
- `src/presentation`: servidor Express, rutas y middlewares.
- `src/application`: casos de uso (lógica de negocio).
- `src/domain`: modelos/entidades.
- `src/infrastructure`: acceso a Firestore/Storage/Auth.

## Requisitos
- Node 18+
- Credenciales de Firebase Admin (`GOOGLE_APPLICATION_CREDENTIALS` apuntando al service account) y `FIREBASE_PROJECT_ID`.

## Instalación
```
cd backend
npm install
cp .env.example .env
# ajusta PORT, FIREBASE_PROJECT_ID y credencial
```

## Scripts
- `npm run dev`: modo desarrollo con ts-node-dev.
- `npm run build`: compila a `dist/`.
- `npm start`: ejecuta compilado.

## Endpoints iniciales
- `GET /health`
- `POST /api/tramites` (CLIENTE/GESTOR)
- `GET /api/tramites` (GESTOR/ADMIN ven todos, CLIENTE ve propios)
- `PATCH /api/tramites/:id/aprobar|rechazar|observar` (GESTOR/ADMIN)

Autenticación: `Authorization: Bearer <idToken Firebase>`.
Roles: obtenidos de colección `usuarios` (campo `rol`).
