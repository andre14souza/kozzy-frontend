import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chamado, ChamadosService, NovoChamado } from '../chamados.service';
import { UsuarioLogado } from '../auth.service';
import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateTicketModalComponent],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.css']
})
export class TicketDetailComponent {
  @Input() chamado!: Chamado;
  @Input() usuarioLogado!: UsuarioLogado | null;

  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Chamado>();
  @Output() deleteTicket = new EventEmitter<string>();

  novoComentario: string = '';
  isSubmittingComment: boolean = false;
  comentarioFile: File | null = null;
  
  isSubTicketModalVisible = false;

  constructor(private chamadosService: ChamadosService) { }

  onClose() { this.close.emit(); }

  isSupervisor(): boolean {
    return this.usuarioLogado?.perfil === 'supervisor';
  }

  onDelete() {
    if (this.chamado?.id) this.deleteTicket.emit(this.chamado.id);
  }

  podeEditar(): boolean {
    if (!this.usuarioLogado || !this.chamado) return false;

    // ✅ CORREÇÃO: Impede qualquer edição se o chamado foi finalizado de vez
    if (this.chamado.status === 'encerrado' && this.usuarioLogado.perfil !== 'supervisor') return false;

    if (this.usuarioLogado.perfil === 'supervisor') return true;

    const atendente = this.chamado.atendente;
    const atendenteId = (atendente && typeof atendente === 'object') ? (atendente.id || atendente._id) : atendente;
    const ehResponsavel = this.usuarioLogado.id === atendenteId;

    return this.usuarioLogado.perfil === 'atendente' && ehResponsavel;
  }

  onEdit() {
    if (this.podeEditar()) {
      this.edit.emit(this.chamado);
    } else {
      alert(`⛔ ACESSO NEGADO\n\nEste chamado está encerrado ou você não tem permissão para editá-lo.`);
    }
  }

  openSubTicketModal() {
    this.isSubTicketModalVisible = true;
  }

  closeSubTicketModal() {
    this.isSubTicketModalVisible = false;
  }

  onSubTicketCreated(dados: NovoChamado) {
    this.chamadosService.adicionarSubChamado(this.chamado.id, dados).subscribe({
      next: () => {
        alert('Sub-tarefa criada com sucesso!');
        this.isSubTicketModalVisible = false;
        // Atualiza a lista e a referência local do detalhe
        this.chamadosService.getChamados().subscribe(lista => {
          const atualizado = lista.find(c => c.id === this.chamado.id);
          if (atualizado) {
            this.chamado = atualizado;
          }
        });
      },
      error: (err) => {
        console.error('Erro ao criar sub-tarefa:', err);
        alert('Erro ao criar sub-tarefa. Verifique os dados e tente novamente.');
      }
    });
  }

  // ✅ CORREÇÃO: Mapeamento de status atualizado
  getStatusLabel(s: string) {
    const m: any = {
      'aberto': 'Aberto',
      'em andamento': 'Em Andamento',
      'concluido': 'Concluído',
      'encerrado': 'Encerrado'
    };
    return m[s] || s;
  }

  getPrioridadeLabel(p: string) {
    const m: any = { 'baixa': 'Baixa', 'media': 'Média', 'alta': 'Alta', 'urgente': 'Urgente' };
    return m[p] || p;
  }

  enviarComentario() {
    if ((!this.novoComentario || !this.novoComentario.trim()) && !this.comentarioFile) return;

    this.isSubmittingComment = true;

    this.chamadosService.adicionarComentario(this.chamado.id, this.novoComentario, this.comentarioFile || undefined).subscribe({
      next: (res) => {
        const comentarioSalvo = res.comentario || {
          mensagem: this.novoComentario,
          data: new Date().toISOString(),
          usuario: {
            nomeCompleto: this.usuarioLogado?.nome || 'Você'
          },
          anexo: this.comentarioFile ? {
            nomeOriginal: this.comentarioFile.name,
            url: URL.createObjectURL(this.comentarioFile)
          } : undefined
        };

        if (!this.chamado.comentarios) {
          this.chamado.comentarios = [];
        }

        this.chamado.comentarios.push(comentarioSalvo);
        this.novoComentario = '';
        this.comentarioFile = null;
        this.isSubmittingComment = false;
      },
      error: (err) => {
        console.error('Erro ao adicionar comentário:', err);
        alert('Falha ao enviar comentário.');
        this.isSubmittingComment = false;
      }
    });
  }

  onCommentFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.comentarioFile = input.files[0];
    }
  }

  removeCommentFile() {
    this.comentarioFile = null;
  }

  getAnexoUrl(caminho: string | undefined): string {
    if (!caminho || caminho === '#') return '#';
    if (caminho.startsWith('http') || caminho.startsWith('blob:')) return caminho;
    const normalizedPath = caminho.replace(/\\/g, '/');
    const baseUrl = environment.apiUrl.replace('/api', '');
    const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
    return `${baseUrl}${cleanPath}`;
  }

  getClienteIcon(tipoCliente: string): string {
    const icones: Record<string, string> = {
      'entregador': '🚴',
      'cliente': '👤',
      'vendedor': '🏪',
      'interno': '🏢'
    };
    return icones[tipoCliente?.toLowerCase()] || '👤';
  }
}