import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TipoNotificacao = 
  | 'chamado_criado'
  | 'chamado_atribuido'
  | 'chamado_atualizado'
  | 'status_alterado'
  | 'novo_comentario'
  | 'chamado_compartilhado'
  | 'mensagem_chat';

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo?: string;
  mensagem: string;
  autor?: string;
  fotoAutor?: string;
  chamadoId?: string;
  numeroProtocolo?: string;
  nomeCliente?: string;
  assunto?: string;
  prioridade?: string;
  status?: string;
  remetenteId?: string;
  chatOrigem?: 'geral' | 'direto';
  chamado?: any;
  timestamp: string;
  lida: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private readonly STORAGE_KEY = 'kozzy_notificacoes';
  private notificacoesSubject = new BehaviorSubject<Notificacao[]>([]);
  public notificacoes$ = this.notificacoesSubject.asObservable();

  constructor() {
    this.carregarNotificacoesSalvas();
  }

  private carregarNotificacoesSalvas(): void {
    try {
      const salvas = localStorage.getItem(this.STORAGE_KEY);
      if (salvas) {
        this.notificacoesSubject.next(JSON.parse(salvas));
      }
    } catch (e) {
      console.warn('Erro ao carregar notificações do localStorage', e);
    }
  }

  private salvar(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notificacoesSubject.value));
    } catch (e) {
      console.warn('Erro ao salvar notificações no localStorage', e);
    }
  }

  get naoLidas(): number {
    return this.notificacoesSubject.value.filter(n => !n.lida).length;
  }

  get total(): number {
    return this.notificacoesSubject.value.length;
  }

  /**
   * Adiciona uma nova notificação recebida via Socket.io
   */
  adicionarNotificacao(data: Partial<Notificacao> & { mensagem: string }): void {
    const nova: Notificacao = {
      id: data.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tipo: (data.tipo as TipoNotificacao) || 'chamado_atualizado',
      titulo: data.titulo || this.getTituloPadrao(data.tipo as TipoNotificacao),
      mensagem: data.mensagem,
      autor: data.autor,
      fotoAutor: data.fotoAutor,
      chamadoId: data.chamadoId,
      numeroProtocolo: data.numeroProtocolo,
      nomeCliente: data.nomeCliente,
      assunto: data.assunto,
      prioridade: data.prioridade,
      status: data.status,
      remetenteId: data.remetenteId,
      chatOrigem: data.chatOrigem,
      chamado: data.chamado,
      timestamp: data.timestamp || new Date().toISOString(),
      lida: false
    };

    // Evita notificações duplicadas idênticas em curto intervalo
    const listaAtual = this.notificacoesSubject.value.filter(n => n.id !== nova.id);
    const lista = [nova, ...listaAtual].slice(0, 60); // Mantém as 60 mais recentes
    this.notificacoesSubject.next(lista);
    this.salvar();
  }

  private getTituloPadrao(tipo?: TipoNotificacao): string {
    switch (tipo) {
      case 'chamado_atribuido': return 'Novo Chamado Atribuído';
      case 'status_alterado': return 'Mudança de Status';
      case 'novo_comentario': return 'Novo Comentário';
      case 'chamado_compartilhado': return 'Chamado Compartilhado';
      case 'mensagem_chat': return 'Mensagem no Chat';
      case 'chamado_criado': return 'Novo Chamado Criado';
      default: return 'Notificação do Sistema';
    }
  }

  marcarTodasComoLidas(): void {
    const lidas = this.notificacoesSubject.value.map(n => ({ ...n, lida: true }));
    this.notificacoesSubject.next(lidas);
    this.salvar();
  }

  marcarComoLida(id: string): void {
    const lista = this.notificacoesSubject.value.map(n =>
      n.id === id ? { ...n, lida: true } : n
    );
    this.notificacoesSubject.next(lista);
    this.salvar();
  }

  removerNotificacao(id: string): void {
    const lista = this.notificacoesSubject.value.filter(n => n.id !== id);
    this.notificacoesSubject.next(lista);
    this.salvar();
  }

  limparTodas(): void {
    this.notificacoesSubject.next([]);
    this.salvar();
  }
}
