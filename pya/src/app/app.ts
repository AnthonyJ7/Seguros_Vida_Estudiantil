import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router'; // Añadido NavigationEnd
import { filter } from 'rxjs/operators'; // Añadido filter
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar'; // Asegura que la ruta sea correcta

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.html'
})
export class AppComponent {
  showNavbar: boolean = false;

  constructor(private router: Router) {
    // Esto soluciona los errores de tu captura:
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Si estamos en login, showNavbar es FALSE
      this.showNavbar = !(event.urlAfterRedirects.includes('login') || event.urlAfterRedirects === '/');
    });
  }
}