"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstudiantesService = void 0;
// Servicio de Estudiantes
const estudiantes_repo_1 = require("../../infrastructure/repositories/estudiantes.repo");
const estudiante_1 = require("../../domain/estudiante");
const auditoria_repo_1 = require("../../infrastructure/repositories/auditoria.repo");
class EstudiantesService {
    constructor() {
        this.repo = new estudiantes_repo_1.EstudiantesRepository();
        this.auditoriaRepo = new auditoria_repo_1.AuditoriaRepository();
    }
    async obtenerPorCedula(cedula) {
        return await this.repo.obtenerPorCedula(cedula);
    }
    async obtenerPorId(idEstudiante) {
        return await this.repo.obtenerPorId(idEstudiante);
    }
    async verificarElegibilidad(cedula) {
        const estudiante = await this.repo.obtenerPorCedula(cedula);
        if (!estudiante) {
            return { elegible: false, razon: 'Estudiante no encontrado' };
        }
        const resultado = (0, estudiante_1.verificarElegibilidad)(estudiante);
        return { ...resultado, estudiante };
    }
    async crear(estudiante, actorUid) {
        const id = await this.repo.crear(estudiante);
        await this.auditoriaRepo.registrar({
            accion: 'CREAR_ESTUDIANTE',
            usuario: actorUid,
            entidad: 'estudiantes',
            estadoNuevo: estudiante,
            detalles: `Estudiante ${estudiante.nombreCompleto} creado`
        });
        return id;
    }
    async actualizarEstadoAcademico(idEstudiante, nuevoEstado, actorUid) {
        const estudiante = await this.repo.obtenerPorId(idEstudiante);
        await this.repo.actualizarEstadoAcademico(idEstudiante, nuevoEstado);
        await this.auditoriaRepo.registrar({
            accion: 'ACTUALIZAR_ESTADO_ACADEMICO',
            usuario: actorUid,
            entidad: 'estudiantes',
            estadoAnterior: { estadoAcademico: estudiante?.estadoAcademico },
            estadoNuevo: { estadoAcademico: nuevoEstado },
            detalles: `Estado académico actualizado a ${nuevoEstado}`
        });
    }
    async listar() {
        return await this.repo.listar();
    }
}
exports.EstudiantesService = EstudiantesService;
