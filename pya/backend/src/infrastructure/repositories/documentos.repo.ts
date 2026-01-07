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
  async subirArchivo(localFilePath: string, tramiteId: string): Promise<string> {
    const fileName = `tramites/${tramiteId}/${Date.now()}_${localFilePath.split('/').pop()}`;
    const bucket = this.getBucket();
    const fileUpload = bucket.file(fileName);

    await bucket.upload(localFilePath, {
      destination: fileName,
      metadata: {
        cacheControl: 'public, max-age=31536000'
      }
    });

    await fileUpload.makePublic();
    return fileUpload.publicUrl();
  }
}
