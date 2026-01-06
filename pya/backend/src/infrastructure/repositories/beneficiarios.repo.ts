// AdaptadorBeneficiarioFirebase
import { db } from '../../config/firebase';
import { Beneficiario } from '../../domain/beneficiario';

export class BeneficiariosRepository {
  private collection = db.collection('beneficiarios');

  async obtenerPorId(idBeneficiario: string): Promise<Beneficiario | null> {
    const doc = await this.collection.doc(idBeneficiario).get();
    if (!doc.exists) return null;
    
    return { idBeneficiario: doc.id, ...doc.data() } as Beneficiario;
  }

  async crear(beneficiario: Omit<Beneficiario, 'idBeneficiario'>): Promise<string> {
    const docRef = await this.collection.add(beneficiario);
    return docRef.id;
  }

  async actualizar(idBeneficiario: string, datos: Partial<Beneficiario>): Promise<void> {
    await this.collection.doc(idBeneficiario).update(datos);
  }

  async obtenerPorTramite(tramiteId: string): Promise<Beneficiario | null> {
    const snapshot = await this.collection.where('tramiteId', '==', tramiteId).limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return { idBeneficiario: doc.id, ...doc.data() } as Beneficiario;
  }

  async eliminar(idBeneficiario: string): Promise<void> {
    await this.collection.doc(idBeneficiario).delete();
  }
}
