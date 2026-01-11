#!/usr/bin/env node
/**
 * Script para listar todos los estudiantes en Firestore
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

async function listarEstudiantes() {
  try {
    console.log('📝 Listando estudiantes en Firestore...\n');

    const estudiantesRef = db.collection('estudiantes');
    const snapshot = await estudiantesRef.get();

    if (snapshot.empty) {
      console.log('❌ No hay estudiantes en la colección');
      process.exit(1);
    }

    console.log(`✅ Encontrados ${snapshot.size} estudiantes:\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📌 ID: ${doc.id}`);
      console.log(`   Cédula: ${data.cedula}`);
      console.log(`   Nombre: ${data.nombreCompleto || data.nombre}`);
      console.log(`   Estado Académico: ${data.estadoAcademico}`);
      console.log(`   Estado Cobertura: ${data.estadoCobertura}`);
      console.log('');
    });

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

listarEstudiantes();
