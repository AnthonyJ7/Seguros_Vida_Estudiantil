import { Injectable } from '@angular/core';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  // Gestión documental centralizada
  async subirDocumento(tramiteId: string, archivo: File, tipo: string, usuarioUid: string) {
    // 1. Validar rol del usuario (solo CLIENTE o GESTOR pueden subir)
    const usuarios = await this.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioUid);
    if (!usuarios.length || (usuarios[0].rol !== 'CLIENTE' && usuarios[0].rol !== 'GESTOR')) {
      throw new Error('No autorizado: solo CLIENTE o GESTOR pueden subir documentos');
    }
    // 2. Validar tipo y tamaño
    const tiposPermitidos = ['application/pdf', 'image/png', 'image/jpeg'];
    if (!tiposPermitidos.includes(archivo.type)) {
      throw new Error('Tipo de archivo no permitido');
    }
    const maxSizeMB = 5;
    if (archivo.size > maxSizeMB * 1024 * 1024) {
      throw new Error('Archivo demasiado grande (máx 5MB)');
    }
    // 3. Subir a Storage (Firebase Storage debe estar configurado)
    // @ts-ignore
    const storage = (await import('firebase/storage')).getStorage();
    // @ts-ignore
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const ruta = `tramites/${tramiteId}/${Date.now()}_${archivo.name}`;
    const storageRef = ref(storage, ruta);
    await uploadBytes(storageRef, archivo);
    const url = await getDownloadURL(storageRef);
    // 4. Guardar metadatos en Firestore
    const docMeta = {
      idTramite: tramiteId,
      tipo,
      ruta,
      url,
      nombreArchivo: archivo.name,
      fechaCarga: new Date().toISOString(),
      usuario: usuarioUid
    };
    await this.addDocument('documentos', docMeta);
    // 5. Registrar auditoría
    await this.addDocument('auditoria', {
      accion: 'SUBIR_DOCUMENTO',
      fechaHora: new Date().toISOString(),
      idTramite: tramiteId,
      usuario: usuarioUid,
      archivo: archivo.name
    });
    return docMeta;
  }

  // Validar trámite (solo GESTOR)
  async validarTramite(tramiteId: string, usuarioUid: string) {
    // 1. Validar rol del usuario
    const usuarios = await this.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioUid);
    if (!usuarios.length || usuarios[0].rol !== 'GESTOR') {
      throw new Error('No autorizado: solo GESTOR puede validar trámite');
    }
    // 2. Consultar reglas de negocio activas (puedes agregar lógica específica aquí)
    // ...
    // 3. Actualizar estado del trámite
    await this.updateDocument('tramites', tramiteId, { estadoCaso: 'EN_VALIDACION' });
    // 4. Registrar auditoría
    await this.addDocument('auditoria', {
      accion: 'VALIDAR_TRAMITE',
      fechaHora: new Date().toISOString(),
      idTramite: tramiteId,
      usuario: usuarioUid
    });
    // 5. Registrar notificación
    await this.addDocument('notificaciones', {
      idTramite: tramiteId,
      tipo: 'EMAIL',
      mensaje: 'Su trámite está en validación',
      estadoEntrega: 'ENVIADA',
      fechaEnvio: new Date().toISOString()
    });
  }

  // Aprobar trámite (solo GESTOR)
  async aprobarTramite(tramiteId: string, usuarioUid: string, montoAprobado: number) {
    const usuarios = await this.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioUid);
    if (!usuarios.length || usuarios[0].rol !== 'GESTOR') {
      throw new Error('No autorizado: solo GESTOR puede aprobar trámite');
    }
    // 2. Consultar reglas de negocio activas (puedes agregar lógica específica aquí)
    // ...
    // 3. Actualizar estado del trámite
    await this.updateDocument('tramites', tramiteId, {
      estadoCaso: 'APROBADO',
      fechaCierre: new Date().toISOString(),
      montoAprobado
    });
    // 4. Registrar auditoría
    await this.addDocument('auditoria', {
      accion: 'APROBAR_TRAMITE',
      fechaHora: new Date().toISOString(),
      idTramite: tramiteId,
      usuario: usuarioUid
    });
    // 5. Registrar notificación
    await this.addDocument('notificaciones', {
      idTramite: tramiteId,
      tipo: 'EMAIL',
      mensaje: 'Su trámite fue aprobado',
      estadoEntrega: 'ENVIADA',
      fechaEnvio: new Date().toISOString()
    });
  }

  // Rechazar trámite (solo GESTOR)
  async rechazarTramite(tramiteId: string, usuarioUid: string, motivo: string) {
    const usuarios = await this.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioUid);
    if (!usuarios.length || usuarios[0].rol !== 'GESTOR') {
      throw new Error('No autorizado: solo GESTOR puede rechazar trámite');
    }
    // 2. Consultar reglas de negocio activas (puedes agregar lógica específica aquí)
    // ...
    // 3. Actualizar estado del trámite
    await this.updateDocument('tramites', tramiteId, {
      estadoCaso: 'RECHAZADO',
      fechaCierre: new Date().toISOString(),
      motivo
    });
    // 4. Registrar auditoría
    await this.addDocument('auditoria', {
      accion: 'RECHAZAR_TRAMITE',
      fechaHora: new Date().toISOString(),
      idTramite: tramiteId,
      usuario: usuarioUid
    });
    // 5. Registrar notificación
    await this.addDocument('notificaciones', {
      idTramite: tramiteId,
      tipo: 'EMAIL',
      mensaje: 'Su trámite fue rechazado. Motivo: ' + motivo,
      estadoEntrega: 'ENVIADA',
      fechaEnvio: new Date().toISOString()
    });
  }

  // Obtiene el siguiente ID autoincrementable para siniestros
  async getNextSiniestroId(): Promise<number> {
    const siniestros = await this.getDocuments('siniestros');
    if (!siniestros.length) return 1;
    // Buscar el mayor id actual
    const maxId = Math.max(...siniestros.map(s => Number(s.idAuto) || 0));
    return maxId + 1;
  }

  // Registro de siniestro con ID autoincrementable
  async registrarSiniestro(siniestro: any, usuarioUid: string) {
    // 1. Validar rol del usuario (CLIENTE o GESTOR)
    const usuarios = await this.getDocumentsWithCondition('usuarios', 'uid', '==', usuarioUid);
    if (!usuarios.length || (usuarios[0].rol !== 'CLIENTE' && usuarios[0].rol !== 'GESTOR')) {
      throw new Error('No autorizado: solo CLIENTE o GESTOR pueden registrar siniestro');
    }

    // 2. Consultar reglas de negocio activas
    const reglas = await this.getDocumentsWithCondition('reglas_negocio', 'activo', '==', true);
    // Solo CLIENTE debe validar estadoAcademico
    if (usuarios[0].rol === 'CLIENTE' && reglas.some(r => r.campo === 'estadoAcademico' && r.valor === 'ACTIVO')) {
      const estudiantes = await this.getDocumentsWithCondition('estudiante', 'uidUsuario', '==', usuarioUid);
      if (!estudiantes.length || estudiantes[0].estadoAcademico !== 'ACTIVO') {
        throw new Error('No cumple con la regla de vigencia de matrícula');
      }
    }

    // 3. Setear estado y relaciones
    siniestro.estadoCaso = 'EN_VALIDACION';
    siniestro.fechaRegistro = new Date().toISOString();
    siniestro.montoAprobado = 0;
    siniestro.uidUsuario = usuarioUid;
    // Relacionar con estudiante
    const estudiante = await this.getDocumentsWithCondition('estudiante', 'uidUsuario', '==', usuarioUid);
    siniestro.idEstudiante = estudiante.length ? estudiante[0].id : null;

    // 4. Generar ID autoincrementable
    siniestro.idAuto = await this.getNextSiniestroId();

    // 5. Registrar siniestro
    const siniestroId = await this.addDocument('siniestros', siniestro);

    // 6. Registrar auditoría
    await this.addDocument('auditoria', {
      accion: 'REGISTRAR_SINIESTRO',
      fechaHora: new Date().toISOString(),
      idSiniestro: siniestroId,
      usuario: usuarioUid
    });

    // 7. Registrar notificación
    await this.addDocument('notificaciones', {
      idSiniestro: siniestroId,
      idEstudiante: siniestro.idEstudiante,
      tipo: 'EMAIL',
      mensaje: 'Su siniestro fue registrado',
      estadoEntrega: 'ENVIADA',
      fechaEnvio: new Date().toISOString()
    });

    return siniestroId;
  }
// ...existing code...

  constructor() { }

  // Generic method to add a document to a collection
  async addDocument(collectionName: string, data: any) {
    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      console.log('Document written with ID: ', docRef.id);
      return docRef.id;
    } catch (e) {
      console.error('Error adding document: ', e);
      throw e;
    }
  }

  // Generic method to get all documents from a collection
  async getDocuments(collectionName: string) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const documents: any[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      return documents;
    } catch (e) {
      console.error('Error getting documents: ', e);
      throw e;
    }
  }

  // Method to get documents with a specific condition
  async getDocumentsWithCondition(collectionName: string, field: string, operator: any, value: any) {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      const documents: any[] = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      return documents;
    } catch (e) {
      console.error('Error getting documents: ', e);
      throw e;
    }
  }

  // Method to update a document
  async updateDocument(collectionName: string, docId: string, data: any) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, data);
      console.log('Document updated');
    } catch (e) {
      console.error('Error updating document: ', e);
      throw e;
    }
  }

  // Method to delete a document
  async deleteDocument(collectionName: string, docId: string) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      console.log('Document deleted');
    } catch (e) {
      console.error('Error deleting document: ', e);
      throw e;
    }
  }
}