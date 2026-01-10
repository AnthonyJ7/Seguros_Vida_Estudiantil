"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BeneficiariosRepository = void 0;
// AdaptadorBeneficiarioFirebase
const firebase_1 = require("../../config/firebase");
class BeneficiariosRepository {
    constructor() {
        this.collection = firebase_1.db.collection('beneficiarios');
    }
    async obtenerPorId(idBeneficiario) {
        const doc = await this.collection.doc(idBeneficiario).get();
        if (!doc.exists)
            return null;
        return { idBeneficiario: doc.id, ...doc.data() };
    }
    async crear(beneficiario) {
        const docRef = await this.collection.add(beneficiario);
        return docRef.id;
    }
    async actualizar(idBeneficiario, datos) {
        await this.collection.doc(idBeneficiario).update(datos);
    }
    async obtenerPorTramite(tramiteId) {
        const snapshot = await this.collection.where('tramiteId', '==', tramiteId).limit(1).get();
        if (snapshot.empty)
            return null;
        const doc = snapshot.docs[0];
        return { idBeneficiario: doc.id, ...doc.data() };
    }
    async eliminar(idBeneficiario) {
        await this.collection.doc(idBeneficiario).delete();
    }
}
exports.BeneficiariosRepository = BeneficiariosRepository;
