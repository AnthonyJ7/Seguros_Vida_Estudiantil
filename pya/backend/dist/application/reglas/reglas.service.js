"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReglasService = void 0;
// Servicio de Reglas de Negocio
const reglas_repo_1 = require("../../infrastructure/repositories/reglas.repo");
const regla_negocio_1 = require("../../domain/regla-negocio");
class ReglasService {
    constructor() {
        this.repo = new reglas_repo_1.ReglasRepository();
    }
    async obtenerActivas() {
        return await this.repo.obtenerActivas();
    }
    async aplicarReglasATramite(tramite) {
        const reglasActivas = await this.obtenerActivas();
        const errores = [];
        for (const regla of reglasActivas) {
            const resultado = (0, regla_negocio_1.aplicarRegla)(regla, tramite);
            if (!resultado.cumple) {
                errores.push(resultado.mensaje || `Regla ${regla.nombre} no cumplida`);
            }
        }
        return {
            cumple: errores.length === 0,
            errores
        };
    }
    async crear(regla, actorUid) {
        return await this.repo.crear(regla);
    }
    async actualizar(idRegla, datos, actorUid) {
        return await this.repo.actualizar(idRegla, datos);
    }
    async activar(idRegla, actorUid) {
        return await this.repo.activar(idRegla);
    }
    async desactivar(idRegla, actorUid) {
        return await this.repo.desactivar(idRegla);
    }
    async listar() {
        return await this.repo.listar();
    }
    async obtenerPorId(idRegla) {
        return await this.repo.obtenerPorId(idRegla);
    }
    async eliminar(idRegla, actorUid) {
        return await this.repo.eliminar(idRegla);
    }
}
exports.ReglasService = ReglasService;
