"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditoriaRepository = void 0;
// AdaptadorAuditoriaFirebase
const firebase_1 = require("../../config/firebase");
class AuditoriaRepository {
    constructor() {
        this.collection = firebase_1.db.collection('auditoria');
    }
    async registrar(auditoria) {
        const docRef = await this.collection.add({
            ...auditoria,
            fechaHora: new Date()
        });
        return docRef.id;
    }
    async obtenerPorTramite(tramiteId) {
        const snapshot = await this.collection
            .where('tramiteId', '==', tramiteId)
            .orderBy('fechaHora', 'desc')
            .get();
        return snapshot.docs.map(doc => ({
            idAuditoria: doc.id,
            ...doc.data()
        }));
    }
    async obtenerPorUsuario(usuario, limite = 100) {
        const snapshot = await this.collection
            .where('usuario', '==', usuario)
            .orderBy('fechaHora', 'desc')
            .limit(limite)
            .get();
        return snapshot.docs.map(doc => ({
            idAuditoria: doc.id,
            ...doc.data()
        }));
    }
    async obtenerPorEntidad(entidad, limite = 100) {
        const snapshot = await this.collection
            .where('entidad', '==', entidad)
            .orderBy('fechaHora', 'desc')
            .limit(limite)
            .get();
        return snapshot.docs.map(doc => ({
            idAuditoria: doc.id,
            ...doc.data()
        }));
    }
    async obtenerPorFecha(fechaInicio, fechaFin) {
        const snapshot = await this.collection
            .where('fechaHora', '>=', fechaInicio)
            .where('fechaHora', '<=', fechaFin)
            .orderBy('fechaHora', 'desc')
            .get();
        return snapshot.docs.map(doc => ({
            idAuditoria: doc.id,
            ...doc.data()
        }));
    }
    async listar(limite = 500) {
        const snapshot = await this.collection
            .orderBy('fechaHora', 'desc')
            .limit(limite)
            .get();
        return snapshot.docs.map(doc => ({
            idAuditoria: doc.id,
            ...doc.data()
        }));
    }
}
exports.AuditoriaRepository = AuditoriaRepository;
