import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from './loading.service';

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const loadingService = inject(LoadingService);
  
  // Ativa o loading global antes da requisição
  loadingService.show();

  return next(req).pipe(
    finalize(() => {
      // Finalize garante que será chamado tanto em next (sucesso) quanto em error
      loadingService.hide();
    })
  );
};
