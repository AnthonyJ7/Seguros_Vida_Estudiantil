"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentosRepository = void 0;
// AdaptadorDocumentoFirebase
const firebase_1 = require("../../config/firebase");
class DocumentosRepository {
    constructor() {
        this.collection = firebase_1.db.collection('documentos');
        this.bucket = firebase_1.storage.bucket();
    }
    async obtenerPorId(idDocumento) {
        const doc = await this.collection.doc(idDocumento).get();
        if (!doc.exists)
            return null;
        return { idDocumento: doc.id, ...doc.data() };
    }
    async crear(documento) {
        const docRef = await this.collection.add({
            ...documento,
            fechaSubida: documento.fechaSubida || new Date(),
            validado: documento.validado || false
        });
        const created = await this.obtenerPorId(docRef.id);
        return created;
    }
    async actualizar(idDocumento, datos) {
        await this.collection.doc(idDocumento).update(datos);
    }
    async marcarComoValidado(idDocumento) {
        await this.collection.doc(idDocumento).update({ validado: true });
    }
    async obtenerPorTramite(tramiteId) {
        const snapshot = await this.collection.where('tramiteId', '==', tramiteId).get();
        return snapshot.docs.map(doc => ({ idDocumento: doc.id, ...doc.data() }));
    }
    async eliminar(idDocumento) {
        const doc = await this.obtenerPorId(idDocumento);
        if (doc?.urlArchivo) {
            // Eliminar archivo de Storage
            try {
                const file = this.bucket.file(doc.urlArchivo);
                await file.delete();
            }
            catch (error) {
                console.error('Error eliminando archivo de Storage:', error);
            }
        }
        await this.collection.doc(idDocumento).delete();
    }
    // Método para subir archivo a Storage (acepta ruta local del archivo temporal)
    async subirArchivo(localFilePath, tramiteId) {
        const fileName = `tramites/${tramiteId}/${Date.now()}_${localFilePath.split('/').pop()}`;
        const fileUpload = this.bucket.file(fileName);
        await this.bucket.upload(localFilePath, {
            destination: fileName,
            metadata: {
                cacheControl: 'public, max-age=31536000'
            }
        });
        await fileUpload.makePublic();
        return fileUpload.publicUrl();
    }
}
exports.DocumentosRepository = DocumentosRepository;
