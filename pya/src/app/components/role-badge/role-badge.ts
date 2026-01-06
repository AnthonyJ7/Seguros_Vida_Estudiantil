import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getRoleConfig, ROLE_STYLES, RoleStyles } from '../../config/roles.config';

/**
 * Componente para mostrar insignias de rol
 * Uso: <app-role-badge [role]="'ADMIN'"></app-role-badge>
 */
@Component({
  selector: 'app-role-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold'"
      [ngClass]="getRoleStyles().badgeColor || 'bg-gray-100 text-gray-800'">
      <span class="text-lg">{{ getRoleConfig()?.icono || '👤' }}</span>
      <span>{{ getRoleConfig()?.nombre || role }}</span>
    </div>
  `,
  styles: []
})
export class RoleBadgeComponent {
  @Input() role: string = 'CLIENTE';

  getRoleConfig() {
    return getRoleConfig(this.role);
  }

  getRoleStyles(): RoleStyles {
    return ROLE_STYLES[this.role.toUpperCase() as keyof typeof ROLE_STYLES] || ROLE_STYLES['CLIENTE'];
  }
}
