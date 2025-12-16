// ABRIR: with-credentials.interceptor.ts (RENOMEAR PARA auth.interceptor.ts)

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor { // 💥 RENOMEADO
  
  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = request.url.startsWith(environment.apiUrl);
    
    // 💥 NOVO: Pega o token do Local Storage
    const usuarioString = localStorage.getItem('usuario') || sessionStorage.getItem('usuario');
    const usuario = usuarioString ? JSON.parse(usuarioString) : null;
    const token = usuario?.token; // Assume que o token é salvo junto com o usuário

    if (isApiRequest && token) {
      // 💥 ENVIA O TOKEN NO HEADER "Authorization"
      const authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}` 
        },
        withCredentials: false // 💥 MUDANÇA: Não precisa mais de withCredentials
      });
      return next.handle(authRequest);
    }
    
    // 💥 MUDANÇA: O withCredentials não é mais necessário
    return next.handle(request.clone({ withCredentials: false }));
  }
}