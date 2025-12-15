import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chamado } from '../chamados.service';
import { UsuarioLogado } from '../auth.service';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.css']
})
export class TicketDetailComponent {
  @Input() chamado!: Chamado;
  @Input() usuarioLogado!: UsuarioLogado | null;
  
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Chamado>();
  @Output() deleteTicket = new EventEmitter<string>(); // <--- NOVO OUTPUT

  onClose() {
    this.close.emit();
  }

  // Verifica se é Supervisor para mostrar o botão de Excluir
  isSupervisor(): boolean {
    return this.usuarioLogado?.perfil === 'supervisor';
  }

  onDelete() {
    // A confirmação fica aqui ou no componente pai. 
    // Vamos emitir o evento e deixar o pai confirmar e apagar.
    this.deleteTicket.emit(this.chamado.id);
  }

  // Lógica de Edição (Mantida)
  podeEditar(): boolean {
    if (!this.usuarioLogado || !this.chamado) return false;
    if (this.usuarioLogado.perfil === 'supervisor') return true;

    const nomeBate = this.usuarioLogado.nome.toLowerCase() === (this.chamado.atendente || '').toLowerCase();
    const areasDoUsuario = this.usuarioLogado.areas || [];
    const areaDoChamado = this.chamado.area;
    const areaBate = areasDoUsuario.includes(areaDoChamado);

    return this.usuarioLogado.perfil === 'atendente' && nomeBate && areaBate;
  }

  onEdit() {
    if (this.podeEditar()) {
      this.edit.emit(this.chamado);
    } else {
      alert(`⛔ ACESSO NEGADO\n\nVocê não tem permissão para editar este chamado.`);
    }
  }

  // Helpers
  getStatusLabel(s: string) { const m:any={'aberto':'Aberto','em-andamento':'Em Andamento','fechado':'Fechado'}; return m[s]||s; }
  getPrioridadeLabel(p: string) { const m:any={'baixa':'Baixa','media':'Média','alta':'Alta','urgente':'Urgente'}; return m[p]||p; }
}