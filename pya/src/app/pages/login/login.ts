import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { UsuariosHttpService } from '../../services/usuarios-http.service';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = ''; 
  isLoading = false;
  showPassword = false;
  invalidPassword = false;
  showCheck = false;

  togglePassword() {
  this.showPassword = !this.showPassword;
}

  onPasswordInput() {
    this.invalidPassword = false;
    this.errorMessage = '';
  }

  constructor(private authService: AuthService, private usuariosHttp: UsuariosHttpService) {}

  async onLogin() {
    this.errorMessage = ''; 
    this.invalidPassword = false;

    // show check icon immediately on click
    this.showCheck = true;
    setTimeout(() => { this.showCheck = false; }, 200);

    // --- VALIDACIONES INSTANTÁNEAS (Sin delay) ---
    if (!this.email.trim() || !this.password.trim()) {
      this.showCheck = false;
      this.errorMessage = 'Por favor, completa todos los campos.';
      return; // Se detiene aquí, no sale el "Validando"
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showCheck = false;
      this.errorMessage = 'El correo no es válido (ejemplo@utpl.edu.ec).';
      return; // Se detiene aquí
    }

    // --- INICIO DE PROCESO ---
    this.isLoading = true; 

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
      const user = userCredential.user;
      
      // success: clear invalid password indicator immediately
      this.invalidPassword = false;
      this.errorMessage = '';
      
      const token = await user.getIdToken();
      localStorage.setItem('idToken', token);
      localStorage.setItem('uid', user.uid);
      
      this.usuariosHttp.me().subscribe({ 
        next: (usuario) => {
          this.isLoading = false;
          if (!usuario || usuario.activo === false) {
            this.errorMessage = 'Cuenta inactiva o sin perfil.';
            return;
          }
          localStorage.setItem('userRole', (usuario.rol || '').toUpperCase());
          this.authService.login(usuario.rol); 
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Error de conexión con el servidor.';
        }
      });

    } catch (error: any) {
      // --- RESPUESTA RÁPIDA A ERRORES DE FIREBASE ---
      this.isLoading = false; // Quitamos el "Validando..." de inmediato
      
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          this.errorMessage = 'Correo o contraseña incorrectos.';
          this.invalidPassword = true;
          break;
        case 'auth/too-many-requests':
          this.errorMessage = 'Demasiados intentos. Intenta más tarde.';
          break;
        default:
          this.errorMessage = 'Error al ingresar. Revisa tus datos.';
      }
    }
  }
}