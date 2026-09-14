import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatService, ContatoChat, MensagemChat, ConversaResumo } from '../chat.service';
import { ChamadosService, Chamado } from '../chamados.service';
import { AuthService, UsuarioLogado } from '../auth.service';
import { UrlAnexoPipe } from '../url-anexo.pipe';

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, UrlAnexoPipe],
  templateUrl: './chat-drawer.component.html',
  styleUrls: ['./chat-drawer.component.css']
})
export class ChatDrawerComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Output() abrirChamado = new EventEmitter<string>();
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  usuarioLogado: UsuarioLogado | null = null;
  isOpen = false;
  
  // Contatos e Mensagens
  conversas: ConversaResumo[] = [];
  canalGeral: any = { id: 'geral', nome: 'Canal Geral da Equipe', naoLidas: 0 };
  todosUsuarios: ContatoChat[] = [];
  contatosFiltrados: ContatoChat[] = [];
  contatoAtivo: any = null;
  mensagens: MensagemChat[] = [];
  
  // Controles de Input
  textoMensagem: string = '';
  buscaContato: string = '';
  arquivoSelecionado: File | null = null;
  isEnviando: boolean = false;
  
  // Modal / Popover Compartilhar Chamado
  showModalCompartilharChamado = false;
  buscaChamadoTermo: string = '';
  todosChamados: Chamado[] = [];
  chamadosFiltradosParaEnvio: Chamado[] = [];
  chamadoParaCompartilhar: Chamado | null = null;
  
  // Indicador de digitação
  digitandoMapa: { [key: string]: boolean } = {};
  digitandoTimeout: any = null;

  private subs: Subscription[] = [];
  private shouldScrollBottom = false;

  constructor(
    public chatService: ChatService,
    private chamadosService: ChamadosService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuarioLogado = this.authService.getUsuarioLogado();

    this.subs.push(
      this.chatService.isChatAberto$.subscribe(open => {
        this.isOpen = open;
        if (open) {
          this.shouldScrollBottom = true;
          this.carregarDadosIniciais();
        }
      }),

      this.chatService.conversas$.subscribe(convs => {
        this.conversas = convs;
      }),

      this.chatService.canalGeral$.subscribe(geral => {
        this.canalGeral = geral;
      }),

      this.chatService.contatoAtivo$.subscribe(ativo => {
        this.contatoAtivo = ativo;
        this.shouldScrollBottom = true;
      }),

      this.chatService.mensagensAtivas$.subscribe(msgs => {
        this.mensagens = msgs;
        this.shouldScrollBottom = true;
      }),

      this.chatService.digitando$.subscribe(mapa => {
        this.digitandoMapa = mapa;
      })
    );

    this.carregarDadosIniciais();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollBottom) {
      this.scrollToBottom();
      this.shouldScrollBottom = false;
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) { }
  }

  carregarDadosIniciais(): void {
    this.chatService.carregarConversas().subscribe();
    this.chatService.getUsuarios().subscribe(users => {
      this.todosUsuarios = users;
      this.filtrarContatos();
    });
    this.chamadosService.getChamados().subscribe(chams => {
      this.todosChamados = chams;
      this.filtrarChamadosParaCompartilhar();
    });
  }

  fecharChat(): void {
    this.chatService.fecharChat();
  }

  selecionarContato(contato: ContatoChat): void {
    this.chatService.selecionarContato(contato);
  }

  selecionarCanalGeral(): void {
    this.chatService.selecionarCanalGeral();
  }

  filtrarContatos(): void {
    if (!this.buscaContato || this.buscaContato.trim() === '') {
      this.contatosFiltrados = this.todosUsuarios;
    } else {
      const t = this.buscaContato.toLowerCase();
      this.contatosFiltrados = this.todosUsuarios.filter(u => 
        u.nomeCompleto.toLowerCase().includes(t) ||
        (u.cargo && u.cargo.toLowerCase().includes(t)) ||
        (u.departamento && u.departamento.toLowerCase().includes(t))
      );
    }
  }

  onInputMensagem(): void {
    if (!this.contatoAtivo) return;
    const isGeral = this.contatoAtivo.id === 'geral';
    const destId = isGeral ? undefined : this.contatoAtivo._id;
    
    this.chatService.emitirDigitando(destId, isGeral ? 'geral' : 'direto');

    clearTimeout(this.digitandoTimeout);
    this.digitandoTimeout = setTimeout(() => {
      this.chatService.emitirParouDigitar(destId, isGeral ? 'geral' : 'direto');
    }, 2500);
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.arquivoSelecionado = file;
    }
  }

  removerArquivo(): void {
    this.arquivoSelecionado = null;
  }

  abrirSeletorChamado(): void {
    this.showModalCompartilharChamado = true;
    this.buscaChamadoTermo = '';
    this.filtrarChamadosParaCompartilhar();
  }

  fecharSeletorChamado(): void {
    this.showModalCompartilharChamado = false;
    this.chamadoParaCompartilhar = null;
  }

  filtrarChamadosParaCompartilhar(): void {
    if (!this.buscaChamadoTermo || this.buscaChamadoTermo.trim() === '') {
      this.chamadosFiltradosParaEnvio = this.todosChamados.slice(0, 15);
    } else {
      const t = this.buscaChamadoTermo.toLowerCase();
      this.chamadosFiltradosParaEnvio = this.todosChamados.filter(c =>
        (c.numeroProtocolo && c.numeroProtocolo.toLowerCase().includes(t)) ||
        (c.nomeCliente && c.nomeCliente.toLowerCase().includes(t)) ||
        (c.categoria && c.categoria.toLowerCase().includes(t)) ||
        (c.descricao && c.descricao.toLowerCase().includes(t))
      ).slice(0, 20);
    }
  }

  compartilharChamadoSelecionado(chamado: Chamado): void {
    this.chamadoParaCompartilhar = chamado;
    this.showModalCompartilharChamado = false;
  }

  cancelarChamadoParaCompartilhar(): void {
    this.chamadoParaCompartilhar = null;
  }

  enviarMensagem(): void {
    if ((!this.textoMensagem.trim() && !this.chamadoParaCompartilhar && !this.arquivoSelecionado) || this.isEnviando) {
      return;
    }

    if (!this.contatoAtivo) {
      return;
    }

    this.isEnviando = true;
    const isGeral = this.contatoAtivo.id === 'geral';
    const destinatarioId = isGeral ? null : this.contatoAtivo._id;

    if (this.arquivoSelecionado) {
      const formData = new FormData();
      formData.append('tipoCanal', isGeral ? 'geral' : 'direto');
      if (destinatarioId) formData.append('destinatario', destinatarioId);
      if (this.textoMensagem.trim()) formData.append('texto', this.textoMensagem.trim());
      if (this.chamadoParaCompartilhar) formData.append('chamadoId', this.chamadoParaCompartilhar.id);
      formData.append('anexos', this.arquivoSelecionado);

      this.chatService.enviarMensagem(formData).subscribe({
        next: () => {
          this.limparFormularioEnvio();
          this.isEnviando = false;
        },
        error: () => {
          this.isEnviando = false;
        }
      });
    } else {
      const payload = {
        tipoCanal: isGeral ? 'geral' : 'direto',
        destinatario: destinatarioId,
        texto: this.textoMensagem.trim(),
        chamadoId: this.chamadoParaCompartilhar ? this.chamadoParaCompartilhar.id : null
      };

      this.chatService.enviarMensagem(payload).subscribe({
        next: () => {
          this.limparFormularioEnvio();
          this.isEnviando = false;
        },
        error: () => {
          this.isEnviando = false;
        }
      });
    }
  }

  private limparFormularioEnvio(): void {
    this.textoMensagem = '';
    this.arquivoSelecionado = null;
    this.chamadoParaCompartilhar = null;
    this.shouldScrollBottom = true;
  }

  onAbrirChamado(chamadoId?: string): void {
    if (chamadoId) {
      this.abrirChamado.emit(chamadoId);
    }
  }

  isMinhaMensagem(msg: MensagemChat): boolean {
    const meuId = this.usuarioLogado?.id;
    return msg.remetente?._id === meuId || (msg.remetente as any)?.id === meuId;
  }

  getPrioridadeBadgeClass(prioridade?: string): string {
    const p = (prioridade || '').toLowerCase();
    if (p.includes('urgente')) return 'prioridade-urgente';
    if (p.includes('alta')) return 'prioridade-alta';
    if (p.includes('baixa')) return 'prioridade-baixa';
    return 'prioridade-media';
  }

  getStatusBadgeClass(status?: string): string {
    const s = (status || '').toLowerCase();
    if (s === 'concluido' || s === 'encerrado') return 'status-concluido';
    if (s === 'em andamento') return 'status-andamento';
    return 'status-aberto';
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
