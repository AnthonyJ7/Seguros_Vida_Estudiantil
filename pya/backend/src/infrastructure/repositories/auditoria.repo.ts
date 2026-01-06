// AdaptadorAuditoriaFirebase
import { db } from '../../config/firebase';
import { AuditoriaSistema } from '../../domain/auditoria';

export class AuditoriaRepository {
  private collection = db.collection('auditoria');

  async registrar(auditoria: Omit<AuditoriaSistema, 'idAuditoria' | 'fechaHora'>): Promise<string> {
    const docRef = await this.collection.add({
      ...auditoria,
      fechaHora: new Date()
    });
    return docRef.id;
  }

  async obtenerPorTramite(tramiteId: string): Promise<AuditoriaSistema[]> {
    const snapshot = await this.collection
      .where('tramiteId', '==', tramiteId)
      .orderBy('fechaHora', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ 
      idAuditoria: doc.id, 
      ...doc.data() 
    } as AuditoriaSistema));
  }

  async obtenerPorUsuario(usuario: string, limite: number = 100): Promise<AuditoriaSistema[]> {
    const snapshot = await this.collection
      .where('usuario', '==', usuario)
      .orderBy('fechaHora', 'desc')
      .limit(limite)
      .get();
    
    return snapshot.docs.map(doc => ({ 
      idAuditoria: doc.id, 
      ...doc.data() 
    } as AuditoriaSistema));
  }

  async obtenerPorEntidad(entidad: string, limite: number = 100): Promise<AuditoriaSistema[]> {
    const snapshot = await this.collection
      .where('entidad', '==', entidad)
      .orderBy('fechaHora', 'desc')
      .limit(limite)
      .get();
    
    return snapshot.docs.map(doc => ({ 
      idAuditoria: doc.id, 
      ...doc.data() 
    } as AuditoriaSistema));
  }

  async obtenerPorFecha(fechaInicio: Date, fechaFin: Date): Promise<AuditoriaSistema[]> {
    const snapshot = await this.collection
      .where('fechaHora', '>=', fechaInicio)
      .where('fechaHora', '<=', fechaFin)
      .orderBy('fechaHora', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({ 
      idAuditoria: doc.id, 
      ...doc.data() 
    } as AuditoriaSistema));
  }

  async listar(limite: number = 500): Promise<AuditoriaSistema[]> {
    const snapshot = await this.collection
      .orderBy('fechaHora', 'desc')
      .limit(limite)
      .get();
    
    return snapshot.docs.map(doc => ({ 
      idAuditoria: doc.id, 
      ...doc.data() 
    } as AuditoriaSistema));
  }
}
