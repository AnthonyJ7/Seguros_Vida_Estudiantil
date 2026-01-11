import { db } from '../src/config/firebase';

/**
 * Script para corregir tramiteId en documentos
 * Los documentos antiguos tienen codigoUnico (ej: TR-2026-001)
 * Deben tener el ID de Firestore del trámite
 */
async function fixDocumentosTramiteId() {
  try {
    console.log('[fix-docs] Iniciando corrección de tramiteId en documentos...');
    
    // 1. Obtener todos los documentos
    const documentosSnapshot = await db.collection('documentos').get();
    console.log('[fix-docs] Total documentos encontrados:', documentosSnapshot.size);
    
    // 2. Obtener todos los trámites para mapear codigoUnico -> id
    const tramitesSnapshot = await db.collection('tramites').get();
    const tramitesMap = new Map<string, string>(); // codigoUnico -> id
    
    tramitesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.codigoUnico) {
        tramitesMap.set(data.codigoUnico, doc.id);
      }
    });
    
    console.log('[fix-docs] Total trámites mapeados:', tramitesMap.size);
    console.log('[fix-docs] Muestra del mapa:');
    let count = 0;
    for (const [codigo, id] of tramitesMap.entries()) {
      if (count < 5) {
        console.log(`  ${codigo} -> ${id}`);
        count++;
      }
    }
    
    // 3. Corregir cada documento
    let corregidos = 0;
    let sinCambios = 0;
    let errores = 0;
    
    for (const docSnap of documentosSnapshot.docs) {
      const docData = docSnap.data();
      const tramiteIdActual = docData.tramiteId;
      
      console.log(`\n[fix-docs] Procesando documento ${docSnap.id}:`);
      console.log(`  - Nombre: ${docData.nombreArchivo}`);
      console.log(`  - tramiteId actual: ${tramiteIdActual}`);
      
      // Si el tramiteId parece ser un codigoUnico (contiene 'TR-'), buscar el ID correcto
      if (tramiteIdActual && tramiteIdActual.includes('TR-')) {
        const idCorrecto = tramitesMap.get(tramiteIdActual);
        
        if (idCorrecto) {
          console.log(`  - ID correcto encontrado: ${idCorrecto}`);
          console.log(`  - Actualizando...`);
          
          try {
            await db.collection('documentos').doc(docSnap.id).update({
              tramiteId: idCorrecto
            });
            console.log(`  ✓ Documento actualizado`);
            corregidos++;
          } catch (err) {
            console.error(`  ✗ Error actualizando:`, err);
            errores++;
          }
        } else {
          console.log(`  ⚠ No se encontró trámite con codigoUnico: ${tramiteIdActual}`);
          errores++;
        }
      } else {
        console.log(`  - Ya tiene formato de ID de Firestore, sin cambios`);
        sinCambios++;
      }
    }
    
    console.log('\n[fix-docs] Resumen:');
    console.log(`  - Documentos corregidos: ${corregidos}`);
    console.log(`  - Documentos sin cambios: ${sinCambios}`);
    console.log(`  - Errores: ${errores}`);
    console.log('\n[fix-docs] Script completado');
    
    process.exit(0);
  } catch (error) {
    console.error('[fix-docs] Error fatal:', error);
    process.exit(1);
  }
}

fixDocumentosTramiteId();
