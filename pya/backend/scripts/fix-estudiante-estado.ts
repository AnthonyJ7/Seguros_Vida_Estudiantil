#!/usr/bin/env node
/**
 * Script para actualizar el estado académico de un estudiante en Firestore
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

const db = admin.firestore();

async function fixEstudianteEstado() {
  try {
    const cedula = '1102233445'; // Daniela Ramírez
    console.log(`🔍 Buscando estudiante con cédula: ${cedula}...\n`);

    const estudiantesRef = db.collection('estudiantes');
    const snapshot = await estudiantesRef.where('cedula', '==', cedula).limit(1).get();

    if (snapshot.empty) {
      console.log('❌ Estudiante no encontrado');
      process.exit(1);
    }

    const doc = snapshot.docs[0];
    const estudianteData = doc.data();

    console.log('📋 Estado actual del estudiante:');
    console.log(`   Nombre: ${estudianteData.nombreCompleto || estudianteData.nombre}`);
    console.log(`   Estado Académico: ${estudianteData.estadoAcademico}`);
    console.log(`   Estado Cobertura: ${estudianteData.estadoCobertura}\n`);

    // Actualizar a estado activo y cobertura vigente
    await estudiantesRef.doc(doc.id).update({
      estadoAcademico: 'activo',
      estadoCobertura: 'vigente',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('✅ Estudiante actualizado:');
    console.log('   Estado Académico: activo');
    console.log('   Estado Cobertura: vigente\n');

    console.log('✨ Actualización completada!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixEstudianteEstado();
