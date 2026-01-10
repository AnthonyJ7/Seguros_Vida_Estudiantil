import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 1. Creamos un "sujeto" que guarda el estado actual del rol
  private roleSubject = new BehaviorSubject<string | null>(localStorage.getItem('role'));

  constructor(private router: Router) {}

  // 2. Exponemos el rol como un Observable si fuera necesario, 
  // pero mantendremos getRole() para tu compatibilidad actual
  login(role: string) {
    const cleanRole = role.toUpperCase(); // Aseguramos mayúsculas
    localStorage.setItem('role', cleanRole);
    
    // 3. Notificamos a toda la app que el rol cambió
    this.roleSubject.next(cleanRole);

    // Redirección profesional
    switch (cleanRole) {
      case 'ADMIN':
        this.router.navigate(['/admin-dashboard']);
        break;
        case 'GESTOR':
          this.router.navigate(['/gestor-dashboard']);
        break;
        case 'CLIENTE':
          this.router.navigate(['/cliente-inicio']);
          break;
      default:
        this.router.navigate(['/cliente-inicio']);
        break;
    }
  }

  logout() {
    localStorage.removeItem('role');
    // 4. Notificamos que ahora el rol es nulo
    this.roleSubject.next(null);
    this.router.navigate(['/login']);
  }

  // 5. Este método ahora siempre devuelve el valor más fresco
  getRole(): string {
    return this.roleSubject.value || '';
  }

  // Opcional: Para saber si está autenticado
  isAuthenticated(): boolean {
    return !!this.roleSubject.value;
  }
}