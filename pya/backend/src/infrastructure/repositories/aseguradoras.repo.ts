// AdaptadorAseguradoraFirebase
import { db } from '../../config/firebase';
import { Aseguradora } from '../../domain/aseguradora';

export class AseguradorasRepository {
  private collection = db.collection('aseguradoras');

  async obtenerPorId(idAseguradora: string): Promise<Aseguradora | null> {
    const doc = await this.collection.doc(idAseguradora).get();
    if (!doc.exists) return null;
    return { idAseguradora: doc.id, ...doc.data() } as Aseguradora;
  }

  async crear(aseguradora: Omit<Aseguradora, 'idAseguradora'>): Promise<Aseguradora> {
    const docRef = await this.collection.add(aseguradora);
    const created = await this.obtenerPorId(docRef.id);
    return created!;
  }

  async actualizar(idAseguradora: string, datos: Partial<Aseguradora>): Promise<Aseguradora> {
    await this.collection.doc(idAseguradora).update(datos);
    const updated = await this.obtenerPorId(idAseguradora);
    return updated!;
  }

  async listar(): Promise<Aseguradora[]> {
    const snapshot = await this.collection.orderBy('nombre').get();
    return snapshot.docs.map((doc: any) => ({ idAseguradora: doc.id, ...doc.data() } as Aseguradora));
  }

  async listarTodos(): Promise<Aseguradora[]> {
    return this.listar();
  }

  async eliminar(idAseguradora: string): Promise<void> {
    await this.collection.doc(idAseguradora).delete();
  }
}
