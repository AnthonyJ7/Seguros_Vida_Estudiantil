
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // IMPORTANTE
  templateUrl: './login.html',
  providers: [FirestoreService]
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private firestoreService: FirestoreService) {}

  async onLogin() {
    try {
      const auth = getAuth();
      // Autenticación segura con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      const user = userCredential.user;
      // Buscar datos adicionales (rol, nombre, etc) en Firestore por uid
      const usuarios = await this.firestoreService.getDocumentsWithCondition('usuarios', 'uid', '==', user.uid);
      if (!usuarios.length) {
        alert('Usuario sin perfil en Firestore');
        return;
      }
      const usuario = usuarios[0];
      if (usuario.activo === false) {
        alert('Usuario inactivo, contacte al administrador');
        return;
      }
      localStorage.setItem('uid', usuario.uid || usuario.id);
      this.authService.login(usuario.rol);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        alert('Usuario no encontrado');
      } else if (error.code === 'auth/wrong-password') {
        alert('Contraseña incorrecta');
      } else {
        alert('Error de autenticación: ' + (error.message || error));
      }
    }
  }
}