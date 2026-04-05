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
  @Output() deleteTicket = new EventEmitter<string>();

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
}