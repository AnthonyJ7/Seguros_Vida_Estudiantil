@echo off
REM Casos negativos — Windows CMD
REM Edita los valores antes de ejecutar

SET BASE=http://localhost:4000/api
SET TOKEN=REEMPLAZA_CON_TU_ID_TOKEN
SET CEDULA_NO_ELEGIBLE=1100000000
SET ID_TRAMITE=REEMPLAZA_CON_ID_TRAMITE
SET DOC_PATH=C:\ruta\a\archivo.exe

REM 1) Estudiante no elegible al crear tramite
echo === 1) Estudiante no elegible ===
curl -s -X POST %BASE%/tramites ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"cedula\":\"%CEDULA_NO_ELEGIBLE%\",\"tipo\":\"fallecimiento\",\"descripcion\":\"No elegible\"}"
echo.

REM 2) Transicion invalida: pago antes de aprobado
echo === 2) Pago antes de aprobado (espera 400) ===
curl -s -X POST %BASE%/tramites/%ID_TRAMITE%/pago ^
  -H "Authorization: Bearer %TOKEN%"
echo.

REM 3) Upload tipo no permitido
echo === 3) Upload invalido (espera 400) ===
curl -s -X POST %BASE%/documentos/upload ^
  -H "Authorization: Bearer %TOKEN%" ^
  -F "archivo=@%DOC_PATH%" ^
  -F "tramiteId=%ID_TRAMITE%" ^
  -F "tipo=otro" ^
  -F "descripcion=archivo no permitido"
echo.

exit /b 0
