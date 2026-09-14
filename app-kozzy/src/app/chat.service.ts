import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { SocketService } from './socket.service';
import { AuthService } from './auth.service';

export interface ContatoChat {
  _id: string;
  id?: string;
  nomeCompleto: string;
  email?: string;
  perfilAcesso?: string;
  fotoPerfil?: string;
  cargo?: string;
  departamento?: string;
  statusPresenca?: 'online' | 'ausente' | 'ocupado' | 'offline';
}

export interface MensagemChat {
  _id: string;
  remetente: ContatoChat;
  destinatario?: ContatoChat | null;
  tipoCanal: 'direto' | 'geral';
  texto: string;
  chamado?: {
    _id: string;
    id?: string;
    numeroProtocolo: string;
    tipoCliente?: string;
    nomeCliente?: string;
    categoriaAssunto?: string;
    assuntoEspecifico?: string;
    nivelPrioridade?: string;
    avanco?: string;
    descricaoDetalhada?: string;
    dataAtendimento?: string;
    hora?: string;
    solucao?: string;
  } | null;
  anexos?: {
    nomeOriginal: string;
    caminho?: string;
    url: string;
    mimetype?: string;
  }[];
  lida?: boolean;
  createdAt: string;
}

export interface ConversaResumo {
  contato: ContatoChat;
  ultimaMensagem: {
    texto: string;
    data: string;
    remetenteId?: string;
    lida?: boolean;
  };
  naoLidas: number;
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly API_CHAT = `${environment.apiUrl}/chat`;

  private conversasSubject = new BehaviorSubject<ConversaResumo[]>([]);
  public conversas$ = this.conversasSubject.asObservable();

  private canalGeralSubject = new BehaviorSubject<any>({ id: 'geral', nome: 'Canal Geral da Equipe', naoLidas: 0 });
  public canalGeral$ = this.canalGeralSubject.asObservable();

  private mensagensAtivasSubject = new BehaviorSubject<MensagemChat[]>([]);
  public mensagensAtivas$ = this.mensagensAtivasSubject.asObservable();

  private contatoAtivoSubject = new BehaviorSubject<ContatoChat | { id: 'geral'; nome: string } | null>(null);
  public contatoAtivo$ = this.contatoAtivoSubject.asObservable();

  private totalNaoLidasSubject = new BehaviorSubject<number>(0);
  public totalNaoLidas$ = this.totalNaoLidasSubject.asObservable();

  private digitandoSubject = new BehaviorSubject<{ [key: string]: boolean }>({});
  public digitando$ = this.digitandoSubject.asObservable();

  private isChatAbertoSubject = new BehaviorSubject<boolean>(false);
  public isChatAberto$ = this.isChatAbertoSubject.asObservable();

  private socketSubs: Subscription[] = [];

  constructor(
    private http: HttpClient,
    private socketService: SocketService,
    private authService: AuthService
  ) {
    this.iniciarSockets();
  }

  get isChatAberto(): boolean {
    return this.isChatAbertoSubject.value;
  }

  abrirChat(contato?: ContatoChat): void {
    this.isChatAbertoSubject.next(true);
    if (contato) {
      this.selecionarContato(contato);
    } else if (!this.contatoAtivoSubject.value) {
      // Abre o canal geral por padrão se nenhum contato estiver selecionado
      this.selecionarCanalGeral();
    }
  }

  fecharChat(): void {
    this.isChatAbertoSubject.next(false);
  }

  toggleChat(): void {
    const novoEstado = !this.isChatAbertoSubject.value;
    this.isChatAbertoSubject.next(novoEstado);
    if (novoEstado && !this.contatoAtivoSubject.value) {
      this.selecionarCanalGeral();
    }
  }

  iniciarSockets(): void {
    this.socketService.connect();
    this.socketService.emit('join:chat_geral');

    // Mensagem recebida em tempo real
    const msgSub = this.socketService.on<MensagemChat>('chat:mensagem_recebida').subscribe(msg => {
      const contatoAtual = this.contatoAtivoSubject.value;
      const usuarioLogado = this.authService.getUsuarioLogado();

      // Se a conversa aberta for a desta mensagem
      const isConversaAtiva = 
        (msg.tipoCanal === 'geral' && contatoAtual && 'id' in contatoAtual && contatoAtual.id === 'geral') ||
        (msg.tipoCanal === 'direto' && contatoAtual && '_id' in contatoAtual && 
          (contatoAtual._id === msg.remetente._id || (msg.destinatario && contatoAtual._id === msg.destinatario._id)));

      if (isConversaAtiva) {
        const listaAtual = this.mensagensAtivasSubject.value;
        if (!listaAtual.some(m => m._id === msg._id)) {
          this.mensagensAtivasSubject.next([...listaAtual, msg]);
        }
        // Se a janela estiver aberta e o chat ativo, marca como lida se não for do próprio usuário
        if (this.isChatAberto && msg.remetente._id !== usuarioLogado?.id) {
          const idContato = msg.tipoCanal === 'geral' ? 'geral' : msg.remetente._id;
          this.marcarComoLidas(idContato).subscribe();
        }
      }

      // Atualiza lista de conversas
      this.carregarConversas().subscribe();
    });
    this.socketSubs.push(msgSub);

    // Indicador de digitação
    const digSub = this.socketService.on<any>('chat:digitando').subscribe(dados => {
      if (dados.remetenteId && dados.remetenteId !== this.authService.getUsuarioLogado()?.id) {
        const mapa = { ...this.digitandoSubject.value, [dados.remetenteId]: true };
        this.digitandoSubject.next(mapa);
      }
    });
    this.socketSubs.push(digSub);

    const parouSub = this.socketService.on<any>('chat:parou_digitar').subscribe(dados => {
      if (dados.remetenteId) {
        const mapa = { ...this.digitandoSubject.value, [dados.remetenteId]: false };
        this.digitandoSubject.next(mapa);
      }
    });
    this.socketSubs.push(parouSub);
  }

  getUsuarios(): Observable<ContatoChat[]> {
    return this.http.get<ContatoChat[]>(`${this.API_CHAT}/usuarios`, { withCredentials: true });
  }

  carregarConversas(): Observable<any> {
    return this.http.get<any>(`${this.API_CHAT}/conversas`, { withCredentials: true }).pipe(
      tap(res => {
        if (res) {
          this.conversasSubject.next(res.conversas || []);
          this.canalGeralSubject.next(res.canalGeral || { id: 'geral', nome: 'Canal Geral da Equipe', naoLidas: 0 });

          const naoLidasDiretas = (res.conversas || []).reduce((acc: number, c: ConversaResumo) => acc + (c.naoLidas || 0), 0);
          const naoLidasGeral = res.canalGeral?.naoLidas || 0;
          this.totalNaoLidasSubject.next(naoLidasDiretas + naoLidasGeral);
        }
      })
    );
  }

  carregarMensagens(contatoId: string): Observable<MensagemChat[]> {
    return this.http.get<MensagemChat[]>(`${this.API_CHAT}/mensagens/${contatoId}`, { withCredentials: true }).pipe(
      tap(msgs => {
        this.mensagensAtivasSubject.next(msgs);
        this.marcarComoLidas(contatoId).subscribe();
      })
    );
  }

  selecionarContato(contato: ContatoChat): void {
    this.contatoAtivoSubject.next(contato);
    this.carregarMensagens(contato._id || contato.id || '').subscribe();
  }

  selecionarCanalGeral(): void {
    const canalGeral = { id: 'geral', nome: 'Canal Geral da Equipe' } as any;
    this.contatoAtivoSubject.next(canalGeral);
    this.carregarMensagens('geral').subscribe();
  }

  enviarMensagem(payload: FormData | any): Observable<MensagemChat> {
    return this.http.post<MensagemChat>(`${this.API_CHAT}/mensagens`, payload, { withCredentials: true }).pipe(
      tap(msg => {
        const listaAtual = this.mensagensAtivasSubject.value;
        if (!listaAtual.some(m => m._id === msg._id)) {
          this.mensagensAtivasSubject.next([...listaAtual, msg]);
        }
        this.carregarConversas().subscribe();
      })
    );
  }

  compartilharChamado(chamadoId: string, textoAdicional: string = '', destinatarioId: string = 'geral'): Observable<MensagemChat> {
    const isGeral = destinatarioId === 'geral';
    const payload = {
      tipoCanal: isGeral ? 'geral' : 'direto',
      destinatario: isGeral ? null : destinatarioId,
      chamadoId: chamadoId,
      texto: textoAdicional || 'Compartilhou um chamado para acompanhamento.'
    };
    return this.enviarMensagem(payload);
  }

  marcarComoLidas(contatoId: string): Observable<any> {
    return this.http.put(`${this.API_CHAT}/mensagens/lidas/${contatoId}`, {}, { withCredentials: true }).pipe(
      tap(() => {
        // Atualiza contadores locais
        if (contatoId === 'geral') {
          const geral = { ...this.canalGeralSubject.value, naoLidas: 0 };
          this.canalGeralSubject.next(geral);
        } else {
          const conversas = this.conversasSubject.value.map(c => 
            c.contato._id === contatoId ? { ...c, naoLidas: 0 } : c
          );
          this.conversasSubject.next(conversas);
        }
        this.recalcularTotalNaoLidas();
      })
    );
  }

  private recalcularTotalNaoLidas(): void {
    const diretas = this.conversasSubject.value.reduce((acc, c) => acc + (c.naoLidas || 0), 0);
    const geral = this.canalGeralSubject.value?.naoLidas || 0;
    this.totalNaoLidasSubject.next(diretas + geral);
  }

  emitirDigitando(destinatarioId?: string, tipoCanal: string = 'direto'): void {
    const usuarioLogado = this.authService.getUsuarioLogado();
    this.socketService.emit('chat:digitando', {
      remetenteId: usuarioLogado?.id,
      remetenteNome: usuarioLogado?.nome,
      destinatarioId: destinatarioId,
      tipoCanal: tipoCanal
    });
  }

  emitirParouDigitar(destinatarioId?: string, tipoCanal: string = 'direto'): void {
    const usuarioLogado = this.authService.getUsuarioLogado();
    this.socketService.emit('chat:parou_digitar', {
      remetenteId: usuarioLogado?.id,
      destinatarioId: destinatarioId,
      tipoCanal: tipoCanal
    });
  }

  ngOnDestroy(): void {
    this.socketSubs.forEach(s => s.unsubscribe());
  }
}
