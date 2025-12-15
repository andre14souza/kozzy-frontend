import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chamado, RelatorioFilters } from '../chamados.service';
import { RelatorioTabelaComponent } from '../relatorio-tabela/relatorio-tabela.component';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-relatorio-screen',
  standalone: true,
  imports: [CommonModule, RelatorioTabelaComponent],
  templateUrl: './relatorio-screen.component.html',
  styleUrl: './relatorio-screen.component.css'
})
export class RelatorioScreenComponent {
  @Input() chamados: Chamado[] = [];
  @Input() filtrosUtilizados: RelatorioFilters | null = null;

  @Output() openFilterModal = new EventEmitter<void>();
  @Output() closeReportScreen = new EventEmitter<void>();
  @Output() chamadoSelecionado = new EventEmitter<Chamado>();

  getStatusCount(status: string): number {
    return this.chamados.filter(chamado => chamado.status === status).length;
  }

  onVoltar() { this.closeReportScreen.emit(); }
  onEditarFiltros() { this.openFilterModal.emit(); }

  exportarRelatorio(): void {
    if (!this.chamados || this.chamados.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const dadosParaPlanilha = this.chamados.map(chamado => ({
      'Protocolo': chamado.numeroProtocolo,
      'Cliente': chamado.cliente.replace(/🚴|👤|🏪/g, '').trim(),
      'Área': chamado.area || 'N/A',
      'Status': this.getStatusLabel(chamado.status),
      
      // --- MUDANÇA AQUI: Usando a função de formatar ---
      'Data': this.formatarDataParaExcel(chamado.dataAbertura),
      
      'Hora': chamado.horaAbertura, // Se a hora já vier HH:mm do banco, pode manter
      'Prioridade': this.getPrioridadeLabel(chamado.prioridade),
      'Atendente': chamado.atendente,
      'Assunto': chamado.categoria,
      'Descrição': chamado.descricao
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dadosParaPlanilha);

    const objectMaxLength: number[] = [];
    for (let i = 0; i < dadosParaPlanilha.length; i++) {
      let value = Object.values(dadosParaPlanilha[i]);
      for (let j = 0; j < value.length; j++) {
        if (typeof value[j] == "number") {
          objectMaxLength[j] = 10;
        } else if (typeof value[j] == "string") {
          objectMaxLength[j] = Math.max(objectMaxLength[j] || 0, value[j].length);
        }
      }
    }
    ws['!cols'] = objectMaxLength.map(w => ({ width: w + 2 }));

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chamados');

    XLSX.writeFile(wb, `Relatorio_Chamados_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // --- NOVA FUNÇÃO AUXILIAR PARA FORMATAR A DATA NO EXCEL ---
  private formatarDataParaExcel(dataIso: string): string {
    if (!dataIso) return '';
    
    // Tenta criar uma data a partir da string do banco
    const data = new Date(dataIso);
    
    // Verifica se a data é válida
    if (isNaN(data.getTime())) return dataIso;

    // Retorna no formato brasileiro dd/mm/aaaa
    // O 'UTC' ajuda a evitar que a data volte um dia dependendo do fuso
    return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  private getStatusLabel(status: string): string {
    const labels: any = { 'aberto': 'Aberto', 'em-andamento': 'Em Andamento', 'fechado': 'Fechado' };
    return labels[status] || status;
  }

  private getPrioridadeLabel(prioridade: string): string {
    const labels: any = { 'baixa': 'Baixa', 'media': 'Média', 'alta': 'Alta', 'urgente': 'Urgente' };
    return labels[prioridade] || prioridade;
  }
}