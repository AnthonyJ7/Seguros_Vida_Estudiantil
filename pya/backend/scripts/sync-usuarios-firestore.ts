#!/usr/bin/env node
/**
 * Script para sincronizar usuarios de Firebase Auth a Firestore
 * Crea documentos en la colección 'usuarios' para cada usuario en Firebase Auth
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error('❌ GOOGLE_APPLICATION_CREDENTIALS no está configurado en .env');
  process.exit(1);
}

const credentials = JSON.parse(fs.readFileSync(credPath, 'utf-8'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(credentials as admin.ServiceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const auth = admin.auth();
const db = admin.firestore();

// Mapeo de emails a roles y datos
const usuariosConfig: Record<string, { rol: string; nombre: string }> = {
  'daniela01@gmail.com': { rol: 'ADMIN', nombre: 'Daniela Admin' },
  'bustamanteroberto49@gmail.com': { rol: 'CLIENTE', nombre: 'Roberto Bustamante' },
  'paulfosi23@gmail.com': { rol: 'GESTOR', nombre: 'Paul Fosi' },
  'anthonyJhordy72@gmail.com': { rol: 'GESTOR', nombre: 'Anthony Jhordy' }
};

async function syncUsuarios() {
  try {
    console.log('📝 Sincronizando usuarios de Firebase Auth a Firestore...\n');

    const listResult = await auth.listUsers();
    const usuarios = listResult.users;

    console.log(`✅ Encontrados ${usuarios.length} usuarios en Firebase Auth\n`);

    for (const user of usuarios) {
      const email = user.email;
      if (!email) {
        console.log(`⏭️  Saltando usuario sin email: ${user.uid}`);
        continue;
      }

      const config = usuariosConfig[email];
      const rol = config?.rol || 'CLIENTE';
      const nombre = config?.nombre || (user.displayName || email.split('@')[0]);

      console.log(`📌 Procesando: ${email}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Rol: ${rol}`);

      // Verificar si ya existe el documento
      const usuariosRef = db.collection('usuarios');
      const snapshot = await usuariosRef.where('uid', '==', user.uid).limit(1).get();

      if (!snapshot.empty) {
        // Actualizar documento existente
        const docId = snapshot.docs[0].id;
        await usuariosRef.doc(docId).update({
          rol,
          nombre,
          correo: email,
          activo: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`   ✏️  Documento actualizado\n`);
      } else {
        // Crear nuevo documento
        await usuariosRef.add({
          uid: user.uid,
          correo: email,
          nombre,
          rol,
          activo: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`   ✨ Documento creado\n`);
      }
    }

    console.log('✅ Sincronización completada!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

syncUsuarios();
