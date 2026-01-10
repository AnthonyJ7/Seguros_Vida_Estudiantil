# Pruebas Backend — Seguros Vida Estudiantil UTPL

Este directorio contiene scripts y guías para probar el backend vía cURL y Postman. Pensado para Windows (archivos .cmd) y también ejemplos para Bash.

## Requisitos
- Backend ejecutando en http://localhost:4000
- idToken de Firebase para cada rol que desees probar
- Rutas de prueba a archivos (PDF/JPG/PNG) para uploads

## Scripts (Windows .cmd)
- `curl\e2e.cmd` — Flujo feliz end-to-end (crear → adjuntar → validar → enviar → resultado → pago → historial)
- `curl\negative.cmd` — Casos negativos (transiciones inválidas, estudiante no elegible, documento inválido)
- `curl\rbac.cmd` — Verificación de permisos por rol (cliente, gestor, admin, aseguradora)

Antes de ejecutar, edita los placeholders dentro de cada script:
- `SET TOKEN=...` (idToken del usuario actual)
- `SET TOKEN_CLIENTE=...`, `SET TOKEN_GESTOR=...`, `SET TOKEN_ADMIN=...`, `SET TOKEN_ASEG=...`
- `SET ASEG_ID=...` (ID de una aseguradora en Firestore)
- `SET DOC_PATH=...` (ruta a un archivo .pdf/.jpg/.png)

Para ejecutar (CMD):
```
cd backend\tests\curl
.\e2e.cmd
.\negative.cmd
.\rbac.cmd
```

## Postman
- Importa `SegurosVidaUTPL.postman_collection.json`
- Configura variables de colección:
  - `base_url = http://localhost:4000/api`
  - `token = <tu idToken>`

## Opcional: Tests Automatizados
Sugerencia de setup con Jest + Supertest (no instalado aquí):
```
npm i -D jest ts-jest supertest @types/jest @types/supertest
npx ts-jest config:init
```
Luego crea `src/tests/tramites.e2e.spec.ts` con un flujo similar al script `e2e.cmd` usando Supertest.
