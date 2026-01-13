import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar';
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
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // 1. Control de visibilidad del Navbar
      this.showNavbar = !(event.urlAfterRedirects.includes('login') || event.urlAfterRedirects === '/');

      // 2. AUTO-SCROLL AL INICIO: Cada vez que cambies de página, sube al top
      window.scrollTo(0, 0);
      
      // Si el scroll está dentro del <main>, forzamos el scroll del elemento
      const mainContent = document.querySelector('main');
      if (mainContent) mainContent.scrollTop = 0;
    });

    this.backend.down$.subscribe(v => this.backendDown = v);
    this.backend.message$.subscribe(m => this.backendMsg = m);
  }
}