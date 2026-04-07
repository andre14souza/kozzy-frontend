import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chamado } from '../chamados.service';

@Component({
  selector: 'app-relatorio-tabela',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relatorio-tabela.component.html',
  styleUrl: './relatorio-tabela.component.css'
})
export class RelatorioTabelaComponent implements OnInit, OnChanges {
  @Input() chamados: Chamado[] = [];

  // --- NOVO: Evento para avisar o pai que uma linha foi clicada ---
  @Output() rowClick = new EventEmitter<Chamado>();

  // Propriedades para ordenação
  campoOrdenacao: string = '';
  ordemCrescente: boolean = true;
  chamadosOrdenados: Chamado[] = [];

  ngOnInit() {
    this.chamadosOrdenados = [...this.chamados];
  }

  ngOnChanges() {
    this.chamadosOrdenados = [...this.chamados];
    if (this.campoOrdenacao) {
      this.aplicarOrdenacao();
    }
  }

  // --- NOVO: Método disparado pelo HTML ---
  onRowClick(chamado: Chamado): void {
    this.rowClick.emit(chamado);
  }

  // Métodos de ordenação
  ordenarPor(campo: string): void {
    if (this.campoOrdenacao === campo) {
      this.ordemCrescente = !this.ordemCrescente;
    } else {
      this.campoOrdenacao = campo;
      this.ordemCrescente = true;
    }
    this.aplicarOrdenacao();
  }

  private aplicarOrdenacao(): void {
    this.chamadosOrdenados.sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (this.campoOrdenacao) {
        case 'numeroProtocolo':
          valorA = parseInt(a.numeroProtocolo);
          valorB = parseInt(b.numeroProtocolo);
          break;
        case 'cliente':
          valorA = a.cliente.toLowerCase();
          valorB = b.cliente.toLowerCase();
          break;
        case 'status':
          valorA = a.status;
          valorB = b.status;
          break;
        case 'dataAbertura':
          valorA = new Date(a.dataAbertura + ' ' + a.horaAbertura);
          valorB = new Date(b.dataAbertura + ' ' + b.horaAbertura);
          break;
        case 'prioridade':
          const prioridadeOrdem = { 'urgente': 4, 'alta': 3, 'media': 2, 'baixa': 1 };
          valorA = prioridadeOrdem[a.prioridade as keyof typeof prioridadeOrdem] || 0;
          valorB = prioridadeOrdem[b.prioridade as keyof typeof prioridadeOrdem] || 0;
          break;
        case 'atendente':
          valorA = a.atendente.toLowerCase();
          valorB = b.atendente.toLowerCase();
          break;
        default:
          return 0;
      }

      if (valorA < valorB) {
        return this.ordemCrescente ? -1 : 1;
      }
      if (valorA > valorB) {
        return this.ordemCrescente ? 1 : -1;
      }
      return 0;
    });
  }

  // Métodos de formatação
  getStatusClass(status: string): string {
    switch (status) {
      case 'aberto': return 'status-aberto';
      case 'em-andamento': return 'status-andamento';
      case 'fechado': return 'status-fechado';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'aberto': return 'Aberto';
      case 'em-andamento': return 'Em Andamento';
      case 'fechado': return 'Fechado';
      default: return status;
    }
  }

  getPrioridadeClass(prioridade: string): string {
    switch (prioridade) {
      case 'urgente': return 'priority-urgent';
      case 'alta': return 'priority-alta';
      case 'media': return 'priority-media';
      case 'baixa': return 'priority-baixa';
      default: return '';
    }
  }

  getPrioridadeIcon(prioridade: string): string {
    switch (prioridade) {
      case 'baixa': return '⬇️';
      case 'media': return '➡️';
      case 'alta': return '⬆️';
      case 'urgente': return '🚨';
      default: return '';
    }
  }

  getPrioridadeLabel(prioridade: string): string {
    switch (prioridade) {
      case 'baixa': return 'Baixa';
      case 'media': return 'Média';
      case 'alta': return 'Alta';
      case 'urgente': return 'Urgente';
      default: return prioridade;
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }

  formatDateTime(date: string, time: string): string {
    if (!date || !time) return '';
    return `${this.formatDate(date)} ${time}`;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Métodos de ação (apenas log por enquanto, pois o clique na linha fará a ação principal)
  visualizarChamado(chamado: Chamado): void {
    console.log('Visualizar chamado:', chamado);
    this.onRowClick(chamado); // Também abre o detalhe
  }

  editarChamado(chamado: Chamado): void {
    console.log('Editar chamado:', chamado);
    // Nota: A lógica de abrir modal de edição geralmente fica no pai, 
    // mas aqui estamos apenas logando.
  }

  exportarCSV(): void {
    if (!this.chamados || this.chamados.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const dadosCSV = this.chamados.map(chamado => ({
      'Nº Protocolo': chamado.numeroProtocolo,
      'Cliente': chamado.cliente,
      'Status': this.getStatusLabel(chamado.status),
      'Data': this.formatDate(chamado.dataAbertura),
      'Hora': chamado.horaAbertura,
      'Prioridade': this.getPrioridadeLabel(chamado.prioridade),
      'Atendente': chamado.atendente,
      'Categoria': chamado.categoria,
      'Descrição': chamado.descricao
    }));

    const headers = Object.keys(dadosCSV[0]);
    const csvContent = [
      headers.join(','),
      ...dadosCSV.map(row =>
        headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-chamados-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  imprimirRelatorio(): void {
    window.print();
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

  trackByChamado(index: number, chamado: Chamado): string {
    return chamado.numeroProtocolo;
  }
}