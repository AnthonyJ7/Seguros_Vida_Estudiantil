import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router'; // Añadido NavigationEnd
import { filter } from 'rxjs/operators'; // Añadido filter
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar'; // Asegura que la ruta sea correcta
import { BackendStatusService } from './services/backend-status.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.html'
})
export class AppComponent {
  showNavbar: boolean = false;
  backendDown = false;
  backendMsg = '';

  constructor(private router: Router, private backend: BackendStatusService) {
    // Esto soluciona los errores de tu captura:
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Si estamos en login, showNavbar es FALSE
      this.showNavbar = !(event.urlAfterRedirects.includes('login') || event.urlAfterRedirects === '/');
    });

    this.backend.down$.subscribe(v => this.backendDown = v);
    this.backend.message$.subscribe(m => this.backendMsg = m);
  }
}