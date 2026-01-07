"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstudiantesRepository = void 0;
// AdaptadorEstudianteFirebase
const firebase_1 = require("../../config/firebase");
const estudiante_1 = require("../../domain/estudiante");
class EstudiantesRepository {
    constructor() {
        this.collection = firebase_1.db.collection('estudiantes');
    }
    async obtenerPorCedula(cedula) {
        const snapshot = await this.collection.where('cedula', '==', cedula).limit(1).get();
        if (snapshot.empty)
            return null;
        const doc = snapshot.docs[0];
        return { idEstudiante: doc.id, ...doc.data() };
    }
    async obtenerPorId(idEstudiante) {
        const doc = await this.collection.doc(idEstudiante).get();
        if (!doc.exists)
            return null;
        return { idEstudiante: doc.id, ...doc.data() };
    }
    async crear(estudiante) {
        const docRef = await this.collection.add({
            ...estudiante,
            estadoAcademico: estudiante.estadoAcademico || estudiante_1.EstadoAcademico.ACTIVO,
            estadoCobertura: estudiante.estadoCobertura || estudiante_1.EstadoCobertura.VIGENTE
        });
        return docRef.id;
    }
    async actualizar(idEstudiante, datos) {
        await this.collection.doc(idEstudiante).update(datos);
    }
    async actualizarEstadoAcademico(idEstudiante, nuevoEstado) {
        await this.collection.doc(idEstudiante).update({ estadoAcademico: nuevoEstado });
    }
    async listar() {
        const snapshot = await this.collection.get();
        return snapshot.docs.map(doc => ({ idEstudiante: doc.id, ...doc.data() }));
    }
}
exports.EstudiantesRepository = EstudiantesRepository;
