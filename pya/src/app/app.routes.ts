import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { UserDashComponent } from './pages/user-dash/user-dash';
import { AdminDashComponent } from './pages/admin-dash/admin-dash';
import { GestorDashComponent } from './pages/gestor-dash/gestor-dash';
import { RegistroSiniestroComponent } from './pages/registro-siniestro/registro-siniestro';
import { DocumentosComponent } from './pages/documentos/documentos';
import { SiniestrosComponent } from './pages/siniestros/siniestros';
import { ClienteInicioComponent } from './pages/cliente-inicio/cliente-inicio';
import { MiSolicitudComponent } from './pages/mi-solicitud/mi-solicitud';
import { EnvioDocumentosComponent } from './pages/envio-documentos/envio-documentos';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones';
import { roleGuard } from './services/role.guard';

// AGREGA 'export' antes de 'const'
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  // Nueva página principal del estudiante
  { path: 'cliente-inicio', component: ClienteInicioComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  { path: 'mi-solicitud', component: MiSolicitudComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  { path: 'envio-documentos', component: EnvioDocumentosComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  { path: 'notificaciones', component: NotificacionesComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  // Limitar acceso anterior para que CLIENTE no entre
  { path: 'user-dashboard', component: UserDashComponent, canActivate: [roleGuard], data: { roles: ['GESTOR'] } },
  { path: 'gestor-dashboard', component: UserDashComponent, canActivate: [roleGuard], data: { roles: ['GESTOR'] } },
  { path: 'admin-dashboard', component: AdminDashComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'registro-siniestro', component: RegistroSiniestroComponent },
  { path: 'documentos', component: DocumentosComponent },
  { path: 'siniestros', component: SiniestrosComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];