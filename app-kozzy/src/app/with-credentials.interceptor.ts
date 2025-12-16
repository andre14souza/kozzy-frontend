// ABRIR: with-credentials.interceptor.ts (CRIAR ESTE ARQUIVO)

import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'; // Ajuste o caminho se necessário

@Injectable()
export class WithCredentialsInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Verifica se a requisição está indo para o seu Backend
    const isApiRequest = request.url.startsWith(environment.apiUrl);

    if (isApiRequest) {
      // Clona a requisição e adiciona a flag withCredentials: true
      const clonedRequest = request.clone({
        withCredentials: true
      });
      return next.handle(clonedRequest);
    }

    // Para todas as outras requisições, segue o fluxo normal
    return next.handle(request);
  }
}