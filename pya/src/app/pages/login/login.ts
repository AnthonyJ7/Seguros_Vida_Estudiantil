
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../services/auth.service';
import { UsuariosHttpService } from '../../services/usuarios-http.service';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // IMPORTANTE
  templateUrl: './login.html',
  providers: []
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private usuariosHttp: UsuariosHttpService) {}

  async onLogin() {
    try {
      const auth = getAuth();
      // Autenticación segura con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      const user = userCredential.user;
      
      // IMPORTANTE: Obtener y guardar el token ANTES de llamar al backend
      const token = await user.getIdToken();
      localStorage.setItem('idToken', token);
      localStorage.setItem('uid', user.uid);
      
      // Ahora sí, buscar datos adicionales desde backend (perfil del usuario autenticado)
      const usuario = await new Promise<any>((resolve, reject) => {
        this.usuariosHttp.me().subscribe({ next: resolve, error: reject });
      });
      if (!usuario) {
        alert('Usuario sin perfil en backend');
        return;
      }
      if (usuario.activo === false) {
        alert('Usuario inactivo, contacte al administrador');
        return;
      }
      // Persistir datos para navbar
      localStorage.setItem('userRole', (usuario.rol || '').toUpperCase());
      if (usuario.nombre) {
        localStorage.setItem('userName', usuario.nombre);
      }
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