@echo off
REM Flujo E2E feliz — Windows CMD
REM Edita los valores antes de ejecutar

SET BASE=http://localhost:4000/api
SET TOKEN=REEMPLAZA_CON_TU_ID_TOKEN
SET CEDULA_EST=1104567890
SET ASEG_ID=REEMPLAZA_CON_ID_ASEGURADORA
SET DOC_PATH=C:\ruta\a\certificado.pdf

REM 1) Verificar elegibilidad
echo === 1) Verificar elegibilidad ===
curl -s -X POST %BASE%/estudiantes/verificar-elegibilidad ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"cedula\":\"%CEDULA_EST%\"}"
echo.

REM 2) Crear tramite
echo === 2) Crear tramite ===
curl -s -X POST %BASE%/tramites ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"cedula\":\"%CEDULA_EST%\",\"tipo\":\"fallecimiento\",\"descripcion\":\"Caso E2E\",\"beneficiario\":{\"nombreCompleto\":\"Juan Perez\",\"cedula\":\"1104567891\",\"relacion\":\"Padre\",\"telefono\":\"0987654321\",\"correo\":\"juan@example.com\"}}" > resp_crear.json

echo Respuesta crear: 
TYPE resp_crear.json
echo.

FOR /F "tokens=2 delims=:,\" }" %%A IN ('findstr /i "idTramite" resp_crear.json') DO SET ID_TRAMITE=%%A
SET ID_TRAMITE=%ID_TRAMITE: =%
echo ID_TRAMITE=%ID_TRAMITE%

REM 3) Subir documento (PDF/JPG/PNG, max 10MB)
echo === 3) Subir documento ===
curl -s -X POST %BASE%/documentos/upload ^
  -H "Authorization: Bearer %TOKEN%" ^
  -F "archivo=@%DOC_PATH%" ^
  -F "tramiteId=%ID_TRAMITE%" ^
  -F "tipo=certificado_defuncion" ^
  -F "descripcion=certificado inicial"
echo.

REM 4) Validar tramite (requiere rol gestor/admin)
echo === 4) Validar tramite ===
curl -s -X POST %BASE%/tramites/%ID_TRAMITE%/validar ^
  -H "Authorization: Bearer %TOKEN%"
echo.

REM 5) Enviar a aseguradora (requiere rol gestor/admin)
echo === 5) Enviar a aseguradora ===
curl -s -X POST %BASE%/tramites/%ID_TRAMITE%/enviar-aseguradora ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"idAseguradora\":\"%ASEG_ID%\"}"
echo.

REM 6) Registrar resultado (rol gestor/admin/aseguradora)
echo === 6) Registrar resultado ===
curl -s -X POST %BASE%/tramites/%ID_TRAMITE%/resultado ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"aprobado\":true,\"montoAprobado\":5000,\"observaciones\":\"Aprobado E2E\"}"
echo.

REM 7) Confirmar pago (requiere rol gestor/admin)
echo === 7) Confirmar pago ===
curl -s -X POST %BASE%/tramites/%ID_TRAMITE%/pago ^
  -H "Authorization: Bearer %TOKEN%"
echo.

REM 8) Historial
echo === 8) Historial ===
curl -s %BASE%/tramites/%ID_TRAMITE%/historial ^
  -H "Authorization: Bearer %TOKEN%"
echo.

exit /b 0
