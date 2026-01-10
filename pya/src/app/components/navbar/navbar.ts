import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ROLES_CONFIG, ROLE_STYLES, getRoleConfig, RoleStyles, RoleConfig } from '../../config/roles.config';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent implements OnInit {
  isOpen = true;
  userRole: string = '';
  roleConfig: RoleConfig | null = null;
  roleStyles: RoleStyles | null = null;
  userName: string = '';
  ROLES_CONFIG = ROLES_CONFIG;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const usuarioId = localStorage.getItem('uid') || '';
    const userRole = localStorage.getItem('role') || 'CLIENTE';
    this.userRole = userRole;
    this.roleConfig = getRoleConfig(userRole);
    this.roleStyles = ROLE_STYLES[userRole as keyof typeof ROLE_STYLES] || ROLE_STYLES['CLIENTE'];
    this.userName = localStorage.getItem('userName') || 'Usuario';
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  logout() {
    this.authService.logout();
  }

  getRoleColor(): string {
    return this.roleConfig?.color || '#10B981';
  }

  getRoleIcon(): string {
    return this.roleConfig?.icono || '👤';
  }

  canAccess(feature: string): boolean {
    if (!this.roleConfig) return false;
    return this.roleConfig.acceso[feature as keyof typeof this.roleConfig.acceso] || false;
  }
}