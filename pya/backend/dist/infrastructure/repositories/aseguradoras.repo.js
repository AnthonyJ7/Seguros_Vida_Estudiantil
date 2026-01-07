"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AseguradorasRepository = void 0;
// AdaptadorAseguradoraFirebase
const firebase_1 = require("../../config/firebase");
class AseguradorasRepository {
    constructor() {
        this.collection = firebase_1.db.collection('aseguradoras');
    }
    async obtenerPorId(idAseguradora) {
        const doc = await this.collection.doc(idAseguradora).get();
        if (!doc.exists)
            return null;
        return { idAseguradora: doc.id, ...doc.data() };
    }
    async crear(aseguradora) {
        const docRef = await this.collection.add(aseguradora);
        const created = await this.obtenerPorId(docRef.id);
        return created;
    }
    async actualizar(idAseguradora, datos) {
        await this.collection.doc(idAseguradora).update(datos);
        const updated = await this.obtenerPorId(idAseguradora);
        return updated;
    }
    async listar() {
        const snapshot = await this.collection.orderBy('nombre').get();
        return snapshot.docs.map((doc) => ({ idAseguradora: doc.id, ...doc.data() }));
    }
    async listarTodos() {
        return this.listar();
    }
    async eliminar(idAseguradora) {
        await this.collection.doc(idAseguradora).delete();
    }
}
exports.AseguradorasRepository = AseguradorasRepository;
