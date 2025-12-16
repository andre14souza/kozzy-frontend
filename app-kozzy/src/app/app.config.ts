// ABRIR: app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
// 💥 MUDANÇA AQUI: Importar withInterceptorsFromDi
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; 
import { provideAnimations } from '@angular/platform-browser/animations';
import { WithCredentialsInterceptor } from './with-credentials.interceptor'; // Caminho correto
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    
    // 💥 CORREÇÃO PRINCIPAL: Habilita a injeção do sistema antigo de interceptores
    provideHttpClient(withInterceptorsFromDi()), 

    // Manter o objeto HTTP_INTERCEPTORS com a classe (que agora será respeitada)
    {
      provide: HTTP_INTERCEPTORS,
      useClass: WithCredentialsInterceptor,
      multi: true
    },
    
    provideAnimations(),
    AuthService,
  ]
};