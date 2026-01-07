// AdaptadorReglasFirebase
import { db } from '../../config/firebase';
import { ReglaNegocio } from '../../domain/regla-negocio';

export class ReglasRepository {
  private collection = db.collection('reglas_negocio');

  async obtenerPorId(idRegla: string): Promise<ReglaNegocio | null> {
    const doc = await this.collection.doc(idRegla).get();
    if (!doc.exists) return null;
    return { idRegla: doc.id, ...doc.data() } as ReglaNegocio;
  }

  async crear(regla: Omit<ReglaNegocio, 'idRegla'>): Promise<ReglaNegocio> {
    const docRef = await this.collection.add(regla);
    const created = await this.obtenerPorId(docRef.id);
    return created!;
  }

  async actualizar(idRegla: string, datos: Partial<ReglaNegocio>): Promise<ReglaNegocio> {
    await this.collection.doc(idRegla).update(datos);
    const updated = await this.obtenerPorId(idRegla);
    return updated!;
  }

  async obtenerActivas(): Promise<ReglaNegocio[]> {
    const snapshot = await this.collection.where('estado', '==', true).get();
    return snapshot.docs.map((doc: any) => ({ idRegla: doc.id, ...doc.data() } as ReglaNegocio));
  }

  async listar(): Promise<ReglaNegocio[]> {
    const snapshot = await this.collection.get();
    return snapshot.docs.map((doc: any) => ({ idRegla: doc.id, ...doc.data() } as ReglaNegocio));
  }

  async desactivar(idRegla: string): Promise<ReglaNegocio> {
    return await this.actualizar(idRegla, { estado: false });
  }

  async activar(idRegla: string): Promise<ReglaNegocio> {
    return await this.actualizar(idRegla, { estado: true });
  }

  async eliminar(idRegla: string): Promise<void> {
    await this.collection.doc(idRegla).delete();
  }
}
