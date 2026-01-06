// AdaptadorEstudianteFirebase
import { db } from '../../config/firebase';
import { Estudiante, EstadoAcademico, EstadoCobertura } from '../../domain/estudiante';

export class EstudiantesRepository {
  private collection = db.collection('estudiantes');

  async obtenerPorCedula(cedula: string): Promise<Estudiante | null> {
    const snapshot = await this.collection.where('cedula', '==', cedula).limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { idEstudiante: doc.id, ...doc.data() } as Estudiante;
  }

  async obtenerPorId(idEstudiante: string): Promise<Estudiante | null> {
    const doc = await this.collection.doc(idEstudiante).get();
    if (!doc.exists) return null;
    
    return { idEstudiante: doc.id, ...doc.data() } as Estudiante;
  }

  async crear(estudiante: Omit<Estudiante, 'idEstudiante'>): Promise<string> {
    const docRef = await this.collection.add({
      ...estudiante,
      estadoAcademico: estudiante.estadoAcademico || EstadoAcademico.ACTIVO,
      estadoCobertura: estudiante.estadoCobertura || EstadoCobertura.VIGENTE
    });
    return docRef.id;
  }

  async actualizar(idEstudiante: string, datos: Partial<Estudiante>): Promise<void> {
    await this.collection.doc(idEstudiante).update(datos);
  }

  async actualizarEstadoAcademico(idEstudiante: string, nuevoEstado: EstadoAcademico): Promise<void> {
    await this.collection.doc(idEstudiante).update({ estadoAcademico: nuevoEstado });
  }

  async listar(): Promise<Estudiante[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map(doc => ({ idEstudiante: doc.id, ...doc.data() } as Estudiante));
  }
}
