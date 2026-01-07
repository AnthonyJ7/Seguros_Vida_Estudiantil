import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { UserDashComponent } from './pages/user-dash/user-dash';
import { AdminDashComponent } from './pages/admin-dash/admin-dash';
import { GestorDashComponent } from './pages/gestor-dash/gestor-dash';
import { RegistroSiniestroComponent } from './pages/registro-siniestro/registro-siniestro';
import { DocumentosComponent } from './pages/documentos/documentos';
import { SiniestrosComponent } from './pages/siniestros/siniestros';
import { EstudiantesPage } from './pages/estudiantes/estudiantes';
import { PolizasPage } from './pages/polizas/polizas';
import { NotificacionesPage } from './pages/notificaciones/notificaciones';
import { roleGuard } from './services/role.guard';

// AGREGA 'export' antes de 'const'
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'user-dash', component: UserDashComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  { path: 'admin-dash', component: AdminDashComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'gestor-dash', component: GestorDashComponent, canActivate: [roleGuard], data: { roles: ['GESTOR'] } },
  { path: 'estudiantes', component: EstudiantesPage, canActivate: [roleGuard], data: { roles: ['GESTOR', 'ADMIN'] } },
  { path: 'registro-siniestro', component: RegistroSiniestroComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE', 'GESTOR'] } },
  { path: 'documentos', component: DocumentosComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE', 'GESTOR', 'ADMIN'] } },
  { path: 'polizas', component: PolizasPage, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  { path: 'notificaciones', component: NotificacionesPage, canActivate: [roleGuard], data: { roles: ['CLIENTE', 'GESTOR', 'ADMIN'] } },
  { path: 'siniestros', component: SiniestrosComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE', 'GESTOR', 'ADMIN'] } },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];