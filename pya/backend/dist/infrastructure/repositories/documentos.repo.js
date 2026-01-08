"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentosRepository = void 0;
// AdaptadorDocumentoFirebase
const firebase_1 = require("../../config/firebase");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
class DocumentosRepository {
    constructor() {
        this.collection = firebase_1.db.collection('documentos');
    }
    getBucket() {
        const configured = firebase_admin_1.default.app().options.storageBucket;
        const bucketName = process.env.FIREBASE_STORAGE_BUCKET || configured;
        if (!bucketName) {
            throw new Error('Firebase Storage bucket no configurado. Defina FIREBASE_STORAGE_BUCKET o storageBucket en firebase.ts');
        }
        return firebase_1.storage.bucket(bucketName);
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
                const file = this.getBucket().file(doc.urlArchivo);
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
exports.DocumentosRepository = DocumentosRepository;
