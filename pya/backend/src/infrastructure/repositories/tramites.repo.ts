// AdaptadorTramiteFirebase actualizado
import { db } from '../../config/firebase';
import { Tramite, EstadoCaso, HistorialEstado } from '../../domain/tramite';

export class TramitesRepository {
  private collection = db.collection('tramites');

  async crear(tramite: Omit<Tramite, 'id'>): Promise<string> {
    const docRef = await this.collection.add(tramite);
    return docRef.id;
  }

  async obtenerPorId(id: string): Promise<Tramite | null> {
    const doc = await this.collection.doc(id).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() } as Tramite;
    }

    // Compatibilidad: si recibimos un codigoUnico en lugar del ID de documento
    const byCodigo = await this.obtenerPorCodigoUnico(id);
    return byCodigo;
  }

  async obtenerPorCodigoUnico(codigoUnico: string): Promise<Tramite | null> {
    const snapshot = await this.collection.where('codigoUnico', '==', codigoUnico).limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Tramite;
  }

  async listarTodos(limite: number = 100): Promise<Tramite[]> {
    const snapshot = await this.collection
      .orderBy('fechaRegistro', 'desc')
      .limit(limite)
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tramite));
  }

  async listarPorEstudiante(idEstudiante: string): Promise<Tramite[]> {
    const snapshot = await this.collection
      .where('estudiante.idEstudiante', '==', idEstudiante)
      .orderBy('fechaRegistro', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tramite));
  }

  async listarPorEstado(estado: EstadoCaso): Promise<Tramite[]> {
    const snapshot = await this.collection
      .where('estadoCaso', '==', estado)
      .orderBy('fechaRegistro', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tramite));
  }

  async listarPorCreador(creadoPor: string): Promise<Tramite[]> {
    try {
      // Intenta con índice (orderBy + where)
      const snapshot = await this.collection
        .where('creadoPor', '==', creadoPor)
        .orderBy('fechaRegistro', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tramite));
    } catch (error: any) {
      // Si falla el índice, hacer query simple y ordenar en memoria
      console.warn('[TramitesRepo] Indice no disponible, ordenando en memoria:', error.message);
      const snapshot = await this.collection
        .where('creadoPor', '==', creadoPor)
        .get();
      
      const tramites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tramite));
      return tramites.sort((a, b) => {
        const aTime = a.fechaRegistro instanceof Date ? a.fechaRegistro.getTime() : new Date(a.fechaRegistro).getTime();
        const bTime = b.fechaRegistro instanceof Date ? b.fechaRegistro.getTime() : new Date(b.fechaRegistro).getTime();
        return bTime - aTime;
      });
    }
  }

  async actualizar(id: string, datos: Partial<Tramite>): Promise<void> {
    await this.collection.doc(id).update(datos);
  }

  async agregarHistorial(id: string, historial: HistorialEstado): Promise<void> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    
    if (doc.exists) {
      const tramite = doc.data() as Tramite;
      const nuevoHistorial = [...(tramite.historial || []), historial];
      await docRef.update({ 
        historial: nuevoHistorial,
        estadoCaso: historial.estadoNuevo,
        actorUltimo: historial.actor,
        rolUltimo: historial.rol
      });
    }
  }

  async cambiarEstado(
    id: string, 
    nuevoEstado: EstadoCaso, 
    actor: string, 
    rol: string, 
    nota?: string
  ): Promise<void> {
    const doc = await this.obtenerPorId(id);
    if (!doc) throw new Error('Trámite no encontrado');

    const historial: HistorialEstado = {
      estadoAnterior: doc.estadoCaso,
      estadoNuevo: nuevoEstado,
      fecha: new Date(),
      actor,
      rol,
      nota
    };

    await this.agregarHistorial(id, historial);
  }

  async eliminar(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }
}
