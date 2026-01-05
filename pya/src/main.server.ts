import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app'; // Tu componente principal
import { config } from './app/app.config.server'; // El archivo de configuración del servidor

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;