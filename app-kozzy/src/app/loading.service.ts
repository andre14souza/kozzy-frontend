import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  // BehaviorSubject guarda o estado atual (true = carregando, false = livre)
  private loadingSubject = new BehaviorSubject<boolean>(false);
  
  // O componente vai "escutar" essa variável
  public loading$ = this.loadingSubject.asObservable();

  constructor() { }

  show(): void {
    this.loadingSubject.next(true);
  }

  hide(): void {
    this.loadingSubject.next(false);
  }
}