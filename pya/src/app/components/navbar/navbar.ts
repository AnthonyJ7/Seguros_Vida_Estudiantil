import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html'
})
export class NavbarComponent {
  isOpen = true; // Empezamos con él abierto si prefieres

  constructor(public authService: AuthService, private router: Router) {}

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  logout() {
    this.authService.logout();
  }
}