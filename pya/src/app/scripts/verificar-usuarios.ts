// Script para comparar usuarios de Firebase Auth y Firestore
// Ejecutar en un componente admin o desde consola del navegador en la app
import { getAuth } from 'firebase/auth';
import { FirestoreService } from '../services/firestore.service';

export async function verificarUsuarios(firestoreService: FirestoreService) {
  // 1. Obtener usuarios de Firestore
  const usuariosFirestore = await firestoreService.getDocuments('usuarios');
  // 2. Obtener usuarios de Auth (solo posible desde backend o admin SDK, no desde frontend por seguridad)
  // Por frontend solo puedes comparar los UID que tienes en Firestore con los que están logueados
  // Aquí mostramos cómo comparar los UID de Firestore con el usuario autenticado actual
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    console.log('No hay usuario autenticado.');
    return;
  }
  const uidAuth = user.uid;
  const usuarioFirestore = usuariosFirestore.find(u => u.uid === uidAuth);
  if (usuarioFirestore) {
    console.log('Usuario autenticado encontrado en Firestore:', usuarioFirestore);
    if (usuarioFirestore.activo) {
      console.log('El usuario está activo.');
    } else {
      console.warn('El usuario está INACTIVO en Firestore.');
    }
  } else {
    console.warn('El usuario autenticado NO existe en la colección usuarios de Firestore.');
  }
  // Listar todos los usuarios de Firestore
  console.log('Usuarios en Firestore:', usuariosFirestore);
}
