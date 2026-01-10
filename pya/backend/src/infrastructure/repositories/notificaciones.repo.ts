// AdaptadorNotificacionFirebase
import { db } from '../../config/firebase';
import { Notificacion, TipoNotificacion } from '../../domain/notificacion';

export class NotificacionesRepository {
  private collection = db.collection('notificaciones');

  async obtenerPorId(idNotificacion: string): Promise<Notificacion | null> {
    const doc = await this.collection.doc(idNotificacion).get();
    if (!doc.exists) return null;
    
    return { idNotificacion: doc.id, ...doc.data() } as Notificacion;
  }

  async crear(notificacion: Omit<Notificacion, 'idNotificacion' | 'fechaEnvio'>): Promise<string> {
    const docRef = await this.collection.add({
      ...notificacion,
      fechaEnvio: new Date(),
      leida: false
    });
    return docRef.id;
  }

  async marcarComoLeida(idNotificacion: string): Promise<void> {
    await this.collection.doc(idNotificacion).update({ leida: true });
  }

  async obtenerPorTramite(tramiteId: string): Promise<Notificacion[]> {
    const snapshot = await this.collection
      .where('tramiteId', '==', tramiteId)
      .orderBy('fechaEnvio', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ idNotificacion: doc.id, ...doc.data() } as Notificacion));
  }

  async obtenerPorDestinatario(destinatario: string, limite: number = 50): Promise<Notificacion[]> {
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
      } as Notificacion;
    });
    // Ordenar en memoria en lugar de en Firestore
    return notificaciones.sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime());
  }

  async obtenerNoLeidas(destinatario: string): Promise<Notificacion[]> {
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
      } as Notificacion;
    });
    // Ordenar en memoria en lugar de en Firestore
    return notificaciones.sort((a, b) => new Date(b.fechaEnvio).getTime() - new Date(a.fechaEnvio).getTime());
  }
}
