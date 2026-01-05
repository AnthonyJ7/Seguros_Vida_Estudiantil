import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { UserDashComponent } from './pages/user-dash/user-dash';
import { InsurerDashComponent } from './pages/insurer-dash/insurer-dash';
import { AdminDashComponent } from './pages/admin-dash/admin-dash';

// AGREGA 'export' antes de 'const'
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'user-dashboard', component: UserDashComponent },
  { path: 'insurer-dashboard', component: InsurerDashComponent },
  { path: 'admin-dashboard', component: AdminDashComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];