"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacionesRepository = void 0;
// AdaptadorNotificacionFirebase
const firebase_1 = require("../../config/firebase");
class NotificacionesRepository {
    constructor() {
        this.collection = firebase_1.db.collection('notificaciones');
    }
    async obtenerPorId(idNotificacion) {
        const doc = await this.collection.doc(idNotificacion).get();
        if (!doc.exists)
            return null;
        return { idNotificacion: doc.id, ...doc.data() };
    }
    async crear(notificacion) {
        const docRef = await this.collection.add({
            ...notificacion,
            fechaEnvio: new Date(),
            leida: false
        });
        return docRef.id;
    }
    async marcarComoLeida(idNotificacion) {
        await this.collection.doc(idNotificacion).update({ leida: true });
    }
    async obtenerPorTramite(tramiteId) {
        const snapshot = await this.collection
            .where('tramiteId', '==', tramiteId)
            .orderBy('fechaEnvio', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ idNotificacion: doc.id, ...doc.data() }));
    }
    async obtenerPorDestinatario(destinatario, limite = 50) {
        const snapshot = await this.collection
            .where('destinatario', '==', destinatario)
            .limit(limite)
            .get();
        const notificaciones = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                idNotificacion: doc.id,
                ...data,
                fechaEnvio: data.fechaEnvio?.toDate ? data.fechaEnvio.toDate() : data.fechaEnvio
            };
        });
        // Ordenar en memoria en lugar de en Firestore
        return notificaciones.sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime());
    }
    async obtenerNoLeidas(destinatario) {
        const snapshot = await this.collection
            .where('destinatario', '==', destinatario)
            .where('leida', '==', false)
            .get();
        const notificaciones = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                idNotificacion: doc.id,
                ...data,
                fechaEnvio: data.fechaEnvio?.toDate ? data.fechaEnvio.toDate() : data.fechaEnvio
            };
        });
        // Ordenar en memoria en lugar de en Firestore
        return notificaciones.sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime());
    }
}
exports.NotificacionesRepository = NotificacionesRepository;
