import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule], // IMPORTANTE
  templateUrl: './login.html'
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private router: Router) {}

  onLogin() {
    // Validamos según los correos que pediste
    if (this.password === '12345') {
      if (this.email === 'admin@pya.com') {
        this.router.navigate(['/admin-dashboard']);
      } 
      else if (this.email === 'pro@pya.com') {
        this.router.navigate(['/insurer-dashboard']);
      } 
      else if (this.email === 'cliente@pya.com') {
        this.router.navigate(['/user-dashboard']);
      } 
      else {
        alert('Usuario no reconocido');
      }
    } else {
      alert('Contraseña incorrecta (es 12345)');
    }
  }
}