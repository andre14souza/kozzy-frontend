import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notificacao {
  id: string;
  tipo: 'chamado_criado' | 'chamado_atualizado';
  mensagem: string;
  chamadoId: string;
  chamado?: any;
  timestamp: string;
  lida: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private notificacoesSubject = new BehaviorSubject<Notificacao[]>([]);
  public notificacoes$ = this.notificacoesSubject.asObservable();

  get naoLidas(): number {
    return this.notificacoesSubject.value.filter(n => !n.lida).length;
  }

  /**
   * Adiciona uma nova notificação recebida via Socket.io.
   */
  adicionarNotificacao(data: Omit<Notificacao, 'id' | 'lida'>): void {
    const nova: Notificacao = {
      ...data,
      id: `${Date.now()}-${Math.random()}`,
      lida: false
    };
    const lista = [nova, ...this.notificacoesSubject.value].slice(0, 50); // máx 50
    this.notificacoesSubject.next(lista);
  }

  marcarTodasComoLidas(): void {
    const lidas = this.notificacoesSubject.value.map(n => ({ ...n, lida: true }));
    this.notificacoesSubject.next(lidas);
  }

  marcarComoLida(id: string): void {
    const lista = this.notificacoesSubject.value.map(n =>
      n.id === id ? { ...n, lida: true } : n
    );
    this.notificacoesSubject.next(lista);
  }

  limparTodas(): void {
    this.notificacoesSubject.next([]);
  }
}
