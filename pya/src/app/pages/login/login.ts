
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
      console.log('🔐 Iniciando login con:', this.email);
      const auth = getAuth();
      // Autenticación segura con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      const user = userCredential.user;
      console.log('✅ Firebase Auth exitoso. UID:', user.uid);
      
      // IMPORTANTE: Obtener y guardar el token ANTES de llamar al backend
      const token = await user.getIdToken();
      localStorage.setItem('idToken', token);
      localStorage.setItem('uid', user.uid);
      console.log('✅ Token obtenido y guardado en localStorage');
      
      // Ahora sí, buscar datos adicionales desde backend (perfil del usuario autenticado)
      console.log('📡 Llamando a /api/usuarios/me...');
      const usuario = await new Promise<any>((resolve, reject) => {
        this.usuariosHttp.me().subscribe({ 
          next: (data) => {
            console.log('✅ Respuesta de /api/usuarios/me:', data);
            resolve(data);
          },
          error: (error) => {
            console.error('❌ Error en /api/usuarios/me:', error);
            reject(error);
          }
        });
      });
      
      if (!usuario) {
        alert('Usuario sin perfil en backend');
        console.error('❌ usuario es null o undefined');
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
      console.log('✅ Datos de usuario guardados. Rol:', usuario.rol);
      this.authService.login(usuario.rol);
    } catch (error: any) {
      console.error('❌ Error en onLogin:', error);
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