// ABRIR: app.config.ts

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
// 💥 MUDANÇA AQUI: Importar withInterceptorsFromDi
import { provideHttpClient, withInterceptorsFromDi, withInterceptors } from '@angular/common/http'; 
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthInterceptor } from './auth.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { routes } from './app.routes';
import { AuthService } from './auth.service';
import { loadingInterceptor } from './loading.interceptor';
import { APP_INITIALIZER } from '@angular/core';
import { ThemeService } from './theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes), 
    
    // 💥 CORREÇÃO PRINCIPAL: Habilita a injeção do sistema antigo de interceptores e do novo funcional
    provideHttpClient(
      withInterceptors([loadingInterceptor]),
      withInterceptorsFromDi()
    ), 
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor, // 💥 MUDAR PARA AuthInterceptor
      multi: true
    },
    
    {
      provide: APP_INITIALIZER,
      useFactory: (themeService: ThemeService) => () => themeService.initTheme(),
      deps: [ThemeService],
      multi: true
    },
    
    provideAnimations(),
    AuthService,
  ]
};