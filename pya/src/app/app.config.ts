import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser'; // Importa esto

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration() // Esto ayuda a que el navegador entienda el renderizado
  ]
};