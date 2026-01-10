@echo off
REM RBAC — Validar permisos por rol
REM Proporciona tokens por rol

SET BASE=http://localhost:4000/api
SET TOKEN_CLIENTE=TOKEN_CLIENTE
SET TOKEN_GESTOR=TOKEN_GESTOR
SET TOKEN_ADMIN=TOKEN_ADMIN
SET TOKEN_ASEG=TOKEN_ASEGURADORA
SET ID_TRAMITE=REEMPLAZA_CON_ID_TRAMITE
SET ASEG_ID=REEMPLAZA_CON_ID_ASEGURADORA

REM === Cliente intenta validar (espera 403) ===
echo === Cliente valida (403) ===
curl -i -s -X POST %BASE%/tramites/%ID_TRAMITE%/validar ^
  -H "Authorization: Bearer %TOKEN_CLIENTE%"
echo.

REM === Gestor valida (200) ===
echo === Gestor valida (200) ===
curl -i -s -X POST %BASE%/tramites/%ID_TRAMITE%/validar ^
  -H "Authorization: Bearer %TOKEN_GESTOR%"
echo.

REM === Cliente intenta enviar a aseguradora (403) ===
echo === Cliente envia (403) ===
curl -i -s -X POST %BASE%/tramites/%ID_TRAMITE%/enviar-aseguradora ^
  -H "Authorization: Bearer %TOKEN_CLIENTE%" ^
  -H "Content-Type: application/json" ^
  -d "{\"idAseguradora\":\"%ASEG_ID%\"}"
echo.

REM === Gestor envia a aseguradora (200) ===
echo === Gestor envia (200) ===
curl -i -s -X POST %BASE%/tramites/%ID_TRAMITE%/enviar-aseguradora ^
  -H "Authorization: Bearer %TOKEN_GESTOR%" ^
  -H "Content-Type: application/json" ^
  -d "{\"idAseguradora\":\"%ASEG_ID%\"}"
echo.

REM === Aseguradora registra resultado (200) ===
echo === Aseguradora resultado (200) ===
curl -i -s -X POST %BASE%/tramites/%ID_TRAMITE%/resultado ^
  -H "Authorization: Bearer %TOKEN_ASEG%" ^
  -H "Content-Type: application/json" ^
  -d "{\"aprobado\":true,\"montoAprobado\":1000}"
echo.

REM === Admin consulta por estado (200) ===
echo === Admin lista por estado (200) ===
curl -i -s %BASE%/tramites/estado/validado ^
  -H "Authorization: Bearer %TOKEN_ADMIN%"
echo.

exit /b 0
