// Servicio de Estudiantes
import { EstudiantesRepository } from '../../infrastructure/repositories/estudiantes.repo';
import { Estudiante, verificarElegibilidad, EstadoAcademico } from '../../domain/estudiante';
import { AuditoriaRepository } from '../../infrastructure/repositories/auditoria.repo';

export class EstudiantesService {
  private repo = new EstudiantesRepository();
  private auditoriaRepo = new AuditoriaRepository();

  async obtenerPorCedula(cedula: string): Promise<Estudiante | null> {
    return await this.repo.obtenerPorCedula(cedula);
  }

  async obtenerPorId(idEstudiante: string): Promise<Estudiante | null> {
    return await this.repo.obtenerPorId(idEstudiante);
  }

  async verificarElegibilidad(cedula: string): Promise<{ elegible: boolean; razon?: string; estudiante?: Estudiante }> {
    const estudiante = await this.repo.obtenerPorCedula(cedula);
    
    if (!estudiante) {
      return { elegible: false, razon: 'Estudiante no encontrado' };
    }

    const resultado = verificarElegibilidad(estudiante);
    return { ...resultado, estudiante };
  }

  async crear(estudiante: Omit<Estudiante, 'idEstudiante'>, actorUid: string): Promise<string> {
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

  async actualizarEstadoAcademico(
    idEstudiante: string, 
    nuevoEstado: EstadoAcademico, 
    actorUid: string
  ): Promise<void> {
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

  async listar(): Promise<Estudiante[]> {
    return await this.repo.listar();
  }

  async eliminar(idEstudiante: string, actorUid: string): Promise<void> {
    const estudiante = await this.repo.obtenerPorId(idEstudiante);
    
    await this.repo.eliminar(idEstudiante);
    
    await this.auditoriaRepo.registrar({
      accion: 'ELIMINAR_ESTUDIANTE',
      usuario: actorUid,
      entidad: 'estudiantes',
      estadoAnterior: estudiante,
      detalles: `Estudiante ${estudiante?.nombreCompleto} (${estudiante?.cedula}) eliminado`
    });
  }
}
