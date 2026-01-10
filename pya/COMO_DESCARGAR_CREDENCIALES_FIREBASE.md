# Cómo Descargar Nuevas Credenciales de Firebase

## Problema
El error `Invalid JWT Signature` indica que la clave privada en el archivo `segurosvidaestiudiantilutpl-firebase-adminsdk-fbsvc-ec24e7ae7e.json` ha sido **revocada o expirada**.

## Solución: Descargar Nueva Clave de Servicio

### Paso 1: Ir a la Consola de Firebase
1. Abre https://console.firebase.google.com/
2. Selecciona el proyecto **"segurosvidaestiudiantilutpl"**

### Paso 2: Navegar a Credenciales de Servicio
1. En el panel izquierdo, ve a **Configuración del proyecto** (⚙️)
2. Haz clic en la pestaña **"Cuentas de servicio"**

### Paso 3: Generar Nueva Clave
1. Busca la fila con **"firebase-adminsdk-fbsvc@segurosvidaestiudiantilutpl.iam.gserviceaccount.com"**
2. Haz clic en los **3 puntos (...)** al lado derecho
3. Selecciona **"Gestionar claves"**

### Paso 4: Crear Nueva Clave
1. Haz clic en **"Agregar clave"** > **"Crear clave nueva"**
2. Elige el tipo **JSON**
3. Se descargará automáticamente un archivo JSON

### Paso 5: Reemplazar el Archivo Local
1. Renombra el archivo descargado a: `segurosvidaestiudiantilutpl-firebase-adminsdk-fbsvc-ec24e7ae7e.json`
2. Reemplaza el archivo en: 
   ```
   C:\Users\busta\Desktop\Universidad\Proyecto arqui\Seguros_Vida_Estudiantil\pya\backend\
   ```

### Paso 6: Reiniciar el Backend
En la terminal:
```bash
cd backend
npm run dev
```

## Resultado
✅ El backend debería iniciarse sin errores de credenciales

## Alternativa: Usar Variables de Entorno
Si prefieres no guardar el archivo JSON, puedes:

1. Abrir el archivo JSON descargado
2. Copiar el contenido completo
3. Ponerlo en `.env` como (en una sola línea, sin saltos):
   ```
   FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...",}
   ```

---

**¿Necesitas ayuda?** Los logs del backend te dirán exactamente qué está mal.
