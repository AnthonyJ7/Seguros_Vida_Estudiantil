import { RenderMode, ServerRoute } from '@angular/ssr';
import { routes } from './app.routes'; // Importamos el arreglo 'routes', no el modulo

export const serverRoutes: ServerRoute[] = [
  {
    path: 'login',
    renderMode: RenderMode.Prerender
  },
  {
    path: '**', 
    renderMode: RenderMode.Prerender
  }
];