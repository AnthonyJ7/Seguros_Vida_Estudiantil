#!/usr/bin/env node
/**
 * Script para crear un usuario de prueba en Firebase Auth
 * Uso: npx ts-node scripts/create-test-user.ts
 */

import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

async function createTestUser() {
  const email = 'bustamanteroberto49@gmail.com';
  const password = 'admin123';
  
  try {
    console.log(`📝 Creando usuario: ${email}`);
    
    // Primero intenta obtener el usuario (podría existir)
    try {
      const existingUser = await auth.getUserByEmail(email);
      console.log(`✅ El usuario ya existe con UID: ${existingUser.uid}`);
      process.exit(0);
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') throw e;
    }
    
    // Crear nuevo usuario
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: 'Roberto Bustamante'
    });
    
    console.log(`✅ Usuario creado exitosamente!`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Contraseña: ${password}`);
    
    process.exit(0);
  } catch (error: any) {
    console.error(`❌ Error creando usuario:`, error.message);
    process.exit(1);
  }
}

createTestUser();
