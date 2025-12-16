// ABRIR: app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
// 💥 MUDANÇA AQUI: Importar withInterceptorsFromDi
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'; 
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from './auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    
    // 💥 CORREÇÃO PRINCIPAL: Habilita a injeção do sistema antigo de interceptores
    provideHttpClient(withInterceptorsFromDi()), 
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor, // 💥 MUDAR PARA AuthInterceptor
      multi: true
    },
    
    provideAnimations(),
    AuthService,
  ]
};