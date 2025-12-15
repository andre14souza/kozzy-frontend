import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // Importe se for usar HttpClient
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { AuthService } from './auth.service'; // Importe o AuthService

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), // Configura o roteamento da aplicação
    provideHttpClient(),
    provideAnimations(), // Fornece o HttpClient para requisições HTTP (se necessário)
    AuthService // Fornece o AuthService para injeção de dependência em toda a aplicação
  ]
};


