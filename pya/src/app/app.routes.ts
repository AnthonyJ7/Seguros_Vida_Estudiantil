import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { UserDashComponent } from './pages/user-dash/user-dash';
import { AdminDashComponent } from './pages/admin-dash/admin-dash';
import { GestorDashComponent } from './pages/gestor-dash/gestor-dash';
import { EstudiantesPage } from './pages/estudiantes/estudiantes';
import { RegistroSiniestroComponent } from './pages/registro-siniestro/registro-siniestro';
import { DocumentosComponent } from './pages/documentos/documentos';
import { SiniestrosComponent } from './pages/siniestros/siniestros';
import { ClienteInicioComponent } from './pages/cliente-inicio/cliente-inicio';
import { MiSolicitudComponent } from './pages/mi-solicitud/mi-solicitud';
import { EnvioDocumentosComponent } from './pages/envio-documentos/envio-documentos';
import { NotificacionesComponent } from './pages/notificaciones/notificaciones';
import { AseguradorasPage } from './pages/aseguradoras/aseguradoras';
import { AuditoriaPage } from './pages/auditoria/auditoria';
import { UsuariosPage } from './pages/usuarios/usuarios';
import { PolizasPage } from './pages/polizas/polizas';
import { InsurerDashComponent } from './pages/insurer-dash/insurer-dash';
import { HistorialTramitesComponent } from './pages/historial-tramites/historial-tramites';
import { AccesoDenegadoComponent } from './pages/acceso-denegado/acceso-denegado';
import { ErrorComponent } from './pages/error/error';
import { roleGuard } from './services/role.guard';

// AGREGA 'export' antes de 'const'
export const routes: Routes = [
  // Public Routes
  { path: 'login', component: LoginComponent },
  
  // Cliente Routes
  { path: 'cliente-inicio', component: ClienteInicioComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  { path: 'mi-solicitud', component: MiSolicitudComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  { path: 'envio-documentos', component: EnvioDocumentosComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  // Notificaciones también lo usan gestores (y admins para debug), no solo clientes
  { path: 'notificaciones', component: NotificacionesComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE', 'GESTOR', 'ADMIN'] } },
  { path: 'siniestros', component: SiniestrosComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  { path: 'registro-siniestro', component: RegistroSiniestroComponent, canActivate: [roleGuard], data: { roles: ['CLIENTE'] } },
  
  // Gestor Routes
  { path: 'gestor-dashboard', component: GestorDashComponent, canActivate: [roleGuard], data: { roles: ['GESTOR'] } },
  { path: 'estudiantes', component: EstudiantesPage, canActivate: [roleGuard], data: { roles: ['GESTOR', 'ADMIN'] } },
  { path: 'documentos', component: DocumentosComponent, canActivate: [roleGuard], data: { roles: ['GESTOR', 'ADMIN'] } },
  { path: 'historial-tramites', component: HistorialTramitesComponent, canActivate: [roleGuard], data: { roles: ['GESTOR', 'ADMIN'] } },
  
  // Admin Routes
  { path: 'admin-dashboard', component: AdminDashComponent, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'aseguradoras', component: AseguradorasPage, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'auditoria', component: AuditoriaPage, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'usuarios', component: UsuariosPage, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
  { path: 'polizas', component: PolizasPage, canActivate: [roleGuard], data: { roles: ['ADMIN'] } },
  
  // Insurer Routes
  { path: 'insurer-dashboard', component: InsurerDashComponent, canActivate: [roleGuard], data: { roles: ['ASEGURADORA'] } },
  
  // Legacy Routes (for backwards compatibility)
  { path: 'user-dashboard', component: UserDashComponent, canActivate: [roleGuard], data: { roles: ['GESTOR'] } },
  
  // Error Routes
  { path: 'acceso-denegado', component: AccesoDenegadoComponent },
  { path: 'error', component: ErrorComponent },
  
  // Default Routes
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];