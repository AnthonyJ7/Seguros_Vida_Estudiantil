// Servicio de Reglas de Negocio
import { ReglasRepository } from '../../infrastructure/repositories/reglas.repo';
import { ReglaNegocio, aplicarRegla } from '../../domain/regla-negocio';
import { Tramite } from '../../domain/tramite';

export class ReglasService {
  private repo = new ReglasRepository();

  async obtenerActivas(): Promise<ReglaNegocio[]> {
    return await this.repo.obtenerActivas();
  }

  async aplicarReglasATramite(tramite: Tramite): Promise<{ cumple: boolean; errores: string[] }> {
    const reglasActivas = await this.obtenerActivas();
    const errores: string[] = [];

    for (const regla of reglasActivas) {
      const resultado = aplicarRegla(regla, tramite);
      if (!resultado.cumple) {
        errores.push(resultado.mensaje || `Regla ${regla.nombre} no cumplida`);
      }
    }

    return {
      cumple: errores.length === 0,
      errores
    };
  }

  async crear(regla: Omit<ReglaNegocio, 'idRegla'>, actorUid: string): Promise<ReglaNegocio> {
    return await this.repo.crear(regla);
  }

  async actualizar(idRegla: string, datos: Partial<ReglaNegocio>, actorUid: string): Promise<ReglaNegocio> {
    return await this.repo.actualizar(idRegla, datos);
  }

  async activar(idRegla: string, actorUid: string): Promise<ReglaNegocio> {
    return await this.repo.activar(idRegla);
  }

  async desactivar(idRegla: string, actorUid: string): Promise<ReglaNegocio> {
    return await this.repo.desactivar(idRegla);
  }

  async listar(): Promise<ReglaNegocio[]> {
    return await this.repo.listar();
  }

  async obtenerPorId(idRegla: string): Promise<ReglaNegocio | null> {
    return await this.repo.obtenerPorId(idRegla);
  }

  async eliminar(idRegla: string, actorUid: string): Promise<void> {
    return await this.repo.eliminar(idRegla);
  }
}
