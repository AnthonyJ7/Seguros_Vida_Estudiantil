"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReglasRepository = void 0;
// AdaptadorReglasFirebase
const firebase_1 = require("../../config/firebase");
class ReglasRepository {
    constructor() {
        this.collection = firebase_1.db.collection('reglas_negocio');
    }
    async obtenerPorId(idRegla) {
        const doc = await this.collection.doc(idRegla).get();
        if (!doc.exists)
            return null;
        return { idRegla: doc.id, ...doc.data() };
    }
    async crear(regla) {
        const docRef = await this.collection.add(regla);
        const created = await this.obtenerPorId(docRef.id);
        return created;
    }
    async actualizar(idRegla, datos) {
        await this.collection.doc(idRegla).update(datos);
        const updated = await this.obtenerPorId(idRegla);
        return updated;
    }
    async obtenerActivas() {
        const snapshot = await this.collection.where('estado', '==', true).get();
        return snapshot.docs.map((doc) => ({ idRegla: doc.id, ...doc.data() }));
    }
    async listar() {
        const snapshot = await this.collection.get();
        return snapshot.docs.map((doc) => ({ idRegla: doc.id, ...doc.data() }));
    }
    async desactivar(idRegla) {
        return await this.actualizar(idRegla, { estado: false });
    }
    async activar(idRegla) {
        return await this.actualizar(idRegla, { estado: true });
    }
    async eliminar(idRegla) {
        await this.collection.doc(idRegla).delete();
    }
}
exports.ReglasRepository = ReglasRepository;
