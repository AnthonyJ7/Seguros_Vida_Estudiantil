"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TramitesRepository = void 0;
// AdaptadorTramiteFirebase actualizado
const firebase_1 = require("../../config/firebase");
// Función auxiliar para limpiar valores undefined de objetos
function limpiarUndefined(obj) {
    const limpio = {};
    for (const key in obj) {
        if (obj[key] !== undefined) {
            limpio[key] = obj[key];
        }
    }
    return limpio;
}
class TramitesRepository {
    constructor() {
        this.collection = firebase_1.db.collection('tramites');
    }
    async crear(tramite) {
        const docRef = await this.collection.add(tramite);
        return docRef.id;
    }
    async obtenerPorId(id) {
        const doc = await this.collection.doc(id).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        // Compatibilidad: si recibimos un codigoUnico en lugar del ID de documento
        const byCodigo = await this.obtenerPorCodigoUnico(id);
        return byCodigo;
    }
    async obtenerPorCodigoUnico(codigoUnico) {
        const snapshot = await this.collection.where('codigoUnico', '==', codigoUnico).limit(1).get();
        if (snapshot.empty)
            return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    }
    async listarTodos(limite = 100) {
        const snapshot = await this.collection
            .orderBy('fechaRegistro', 'desc')
            .limit(limite)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    async listarPorEstudiante(idEstudiante) {
        const snapshot = await this.collection
            .where('estudiante.idEstudiante', '==', idEstudiante)
            .orderBy('fechaRegistro', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    async listarPorEstado(estado) {
        const snapshot = await this.collection
            .where('estadoCaso', '==', estado)
            .orderBy('fechaRegistro', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    async listarPorCreador(creadoPor) {
        try {
            // Intenta con índice (orderBy + where)
            const snapshot = await this.collection
                .where('creadoPor', '==', creadoPor)
                .orderBy('fechaRegistro', 'desc')
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
        catch (error) {
            // Si falla el índice, hacer query simple y ordenar en memoria
            console.warn('[TramitesRepo] Indice no disponible, ordenando en memoria:', error.message);
            const snapshot = await this.collection
                .where('creadoPor', '==', creadoPor)
                .get();
            const tramites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return tramites.sort((a, b) => {
                const aTime = a.fechaRegistro instanceof Date ? a.fechaRegistro.getTime() : new Date(a.fechaRegistro).getTime();
                const bTime = b.fechaRegistro instanceof Date ? b.fechaRegistro.getTime() : new Date(b.fechaRegistro).getTime();
                return bTime - aTime;
            });
        }
    }
    async actualizar(id, datos) {
        const datosLimpios = limpiarUndefined(datos);
        await this.collection.doc(id).update(datosLimpios);
    }
    async agregarHistorial(id, historial) {
        const docRef = this.collection.doc(id);
        const doc = await docRef.get();
        if (doc.exists) {
            const tramite = doc.data();
            // Limpiar undefined del historial antes de agregarlo
            const historialLimpio = limpiarUndefined(historial);
            const nuevoHistorial = [...(tramite.historial || []), historialLimpio];
            await docRef.update({
                historial: nuevoHistorial,
                estadoCaso: historial.estadoNuevo,
                actorUltimo: historial.actor,
                rolUltimo: historial.rol
            });
        }
    }
    async cambiarEstado(id, nuevoEstado, actor, rol, nota) {
        const doc = await this.obtenerPorId(id);
        if (!doc)
            throw new Error('Trámite no encontrado');
        const historial = {
            estadoAnterior: doc.estadoCaso,
            estadoNuevo: nuevoEstado,
            fecha: new Date(),
            actor,
            rol,
            nota
        };
        await this.agregarHistorial(id, historial);
    }
    async eliminar(id) {
        await this.collection.doc(id).delete();
    }
}
exports.TramitesRepository = TramitesRepository;
