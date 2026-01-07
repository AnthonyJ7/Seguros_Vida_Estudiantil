import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '../firebase.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // 1. Creamos un "sujeto" que guarda el estado actual del rol
  private roleSubject = new BehaviorSubject<string | null>(localStorage.getItem('role'));
  private userSubject = new BehaviorSubject<User | null>(null);
  private appInit = false;

  constructor(private router: Router) {}

  // 2. Exponemos el rol como un Observable si fuera necesario, 
  // pero mantendremos getRole() para tu compatibilidad actual
  login(role: string) {
    const cleanRole = role.toUpperCase(); // Aseguramos mayúsculas
    localStorage.setItem('role', cleanRole);
    localStorage.setItem('userRole', cleanRole);
    
    // 3. Notificamos a toda la app que el rol cambió
    this.roleSubject.next(cleanRole);

    // Redirección profesional
    switch (cleanRole) {
      case 'ADMIN':
        this.router.navigate(['/admin-dash']);
        break;
      case 'GESTOR':
        this.router.navigate(['/gestor-dash']);
        break;
      case 'CLIENTE':
        this.router.navigate(['/user-dash']);
        break;
      default:
        this.router.navigate(['/user-dash']);
        break;
    }
  }

  logout() {
    localStorage.removeItem('role');
    // 4. Notificamos que ahora el rol es nulo
    this.roleSubject.next(null);
    // Cerrar sesión en Firebase
    try {
      const auth = this.ensureFirebase();
      signOut(auth);
    } catch {}
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

  // ===== Firebase Auth integration =====
  private ensureFirebase() {
    if (!this.appInit) {
      // App ya está inicializada en firebase.config.ts; si no, getApps() estará vacío
      const app = getApps().length ? getApp() : undefined;
      const auth = getAuth(app);
      this.appInit = true;
      onAuthStateChanged(auth, (user) => {
        this.userSubject.next(user);
        if (user) {
          localStorage.setItem('uid', user.uid);
        } else {
          localStorage.removeItem('uid');
        }
      });
    }
    return getAuth();
  }

  async loginWithEmailPassword(email: string, password: string) {
    const auth = this.ensureFirebase();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const token = await cred.user.getIdToken();
    localStorage.setItem('idToken', token);
    return cred.user;
  }

  async getIdToken(forceRefresh = false): Promise<string | null> {
    try {
      const auth = this.ensureFirebase();
      const user = auth.currentUser;
      if (!user) {
        const cached = localStorage.getItem('idToken');
        return cached;
      }
      const token = await user.getIdToken(forceRefresh);
      localStorage.setItem('idToken', token);
      return token;
    } catch (e) {
      return localStorage.getItem('idToken');
    }
  }
}