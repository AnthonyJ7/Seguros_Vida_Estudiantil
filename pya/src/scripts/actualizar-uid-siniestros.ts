// Script para actualizar el campo uidUsuario en todos los siniestros existentes
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '../app/firebase.config';

// Configura tu UID aquí:
const UID_CLIENTE = 'PON_AQUI_EL_UID_DEL_CLIENTE';

async function actualizarUidSiniestros() {
  const app = initializeApp(firebaseConfig as any);
  const db = getFirestore(app);
  const siniestrosRef = collection(db, 'siniestros');
  const snapshot = await getDocs(siniestrosRef);
  let count = 0;
  for (const siniestroDoc of snapshot.docs) {
    await updateDoc(doc(db, 'siniestros', siniestroDoc.id), {
      uidUsuario: UID_CLIENTE
    });
    console.log(`Actualizado siniestro ${siniestroDoc.id}`);
    count++;
  }
  console.log(`Actualizados ${count} siniestros con uidUsuario = ${UID_CLIENTE}`);
}

actualizarUidSiniestros().catch(console.error);
