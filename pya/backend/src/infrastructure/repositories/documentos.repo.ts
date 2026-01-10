// AdaptadorDocumentoFirebase
import { db, storage } from '../../config/firebase';
import admin from 'firebase-admin';
import { Documento, TipoDocumento } from '../../domain/documento';

export class DocumentosRepository {
  private collection = db.collection('documentos');
  private getBucket() {
    const configured = (admin.app().options as any).storageBucket as string | undefined;
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || configured;
    if (!bucketName) {
      throw new Error('Firebase Storage bucket no configurado. Defina FIREBASE_STORAGE_BUCKET o storageBucket en firebase.ts');
    }
    return storage.bucket(bucketName);
  }

  async obtenerPorId(idDocumento: string): Promise<Documento | null> {
    const doc = await this.collection.doc(idDocumento).get();
    if (!doc.exists) return null;
    
    return { idDocumento: doc.id, ...doc.data() } as Documento;
  }

  async crear(documento: Omit<Documento, 'idDocumento'>): Promise<Documento> {
    const docRef = await this.collection.add({
      ...documento,
      fechaSubida: documento.fechaSubida || new Date(),
      validado: documento.validado || false
    });
    const created = await this.obtenerPorId(docRef.id);
    return created!;
  }

  async actualizar(idDocumento: string, datos: Partial<Documento>): Promise<void> {
    await this.collection.doc(idDocumento).update(datos);
  }

  async marcarComoValidado(idDocumento: string): Promise<void> {
    await this.collection.doc(idDocumento).update({ validado: true });
  }

  async obtenerPorTramite(tramiteId: string): Promise<Documento[]> {
    const snapshot = await this.collection.where('tramiteId', '==', tramiteId).get();
    return snapshot.docs.map(doc => ({ idDocumento: doc.id, ...doc.data() } as Documento));
  }

  async eliminar(idDocumento: string): Promise<void> {
    const doc = await this.obtenerPorId(idDocumento);
    if (doc?.urlArchivo) {
      // Eliminar archivo de Storage
      try {
        const file = this.getBucket().file(doc.urlArchivo);
        await file.delete();
      } catch (error) {
        console.error('Error eliminando archivo de Storage:', error);
      }
    }
    await this.collection.doc(idDocumento).delete();
  }

  // Método para subir archivo a Storage (acepta ruta local del archivo temporal)
  // NOTA: Firebase Storage es un servicio de pago. Por ahora usamos URLs mock.
  // Para activar Storage real en el futuro:
  // 1. Habilitar Cloud Storage en Firebase Console
  // 2. Descomentar el código con storage.googleapis.com
  // 3. Asegurar que FIREBASE_STORAGE_BUCKET esté configurado en .env
  async subirArchivo(localFilePath: string, tramiteId: string): Promise<string> {
    try {
      const fs = require('fs');
      const fileName = `tramites/${tramiteId}/${Date.now()}_${localFilePath.split('/').pop()}`;
      
      // MOCK: Generar URL simulada (sin Storage real)
      const mockUrl = `https://storage.mock.local/${fileName}`;
      console.log(`[documentos.repo] Mock URL: ${mockUrl}`);
      
      // TODO: Reemplazar con código real cuando Storage esté habilitado:
      /*
      const bucket = this.getBucket();
      const fileUpload = bucket.file(fileName);
      await fileUpload.save(fs.readFileSync(localFilePath), {
        metadata: {
          cacheControl: 'public, max-age=31536000'
        }
      });
      await fileUpload.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      console.log(`[documentos.repo] Archivo subido: ${publicUrl}`);
      return publicUrl;
      */
      
      return mockUrl;
    } catch (error: any) {
      console.error('[documentos.repo] Error subiendo archivo:', error);
      throw new Error(`Error subiendo archivo: ${error.message}`);
    }
  }
}
