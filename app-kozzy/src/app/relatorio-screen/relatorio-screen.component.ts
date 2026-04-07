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

  @Output() openFilterModal  = new EventEmitter<void>();
  @Output() closeReportScreen = new EventEmitter<void>();
  @Output() chamadoSelecionado = new EventEmitter<Chamado>();

  // ===== MÉTRICAS =====
  get total(): number { return this.chamados.length; }

  get totalResolvidos(): number {
    return this.chamados.filter(c => c.status === 'concluido' || c.status === 'encerrado').length;
  }

  get percentualConclusao(): number {
    if (this.total === 0) return 0;
    return Math.round((this.totalResolvidos / this.total) * 100);
  }

  get distribuicao(): { label: string; count: number; css: string }[] {
    return [
      { label: 'Abertos',      count: this.getStatusCount('aberto'),       css: 'aberto'      },
      { label: 'Em Andamento', count: this.getStatusCount('em andamento'),  css: 'em-andamento'},
      { label: 'Concluídos',   count: this.getStatusCount('concluido'),     css: 'concluido'   },
      { label: 'Encerrados',   count: this.getStatusCount('encerrado'),     css: 'encerrado'   },
    ].filter(d => d.count > 0);
  }

  get tempoMedioResolucao(): string {
    const resolvidos = this.chamados.filter(c =>
      (c.status === 'concluido' || c.status === 'encerrado') && c.dataAbertura
    );
    if (resolvidos.length === 0) return '—';

    const totalHoras = resolvidos.reduce((acc, c) => {
      try {
        const abertura = new Date(`${c.dataAbertura.split('T')[0]}T${c.horaAbertura || '00:00:00'}`);
        const resolucao = new Date(); // fallback — idealmente seria dataResolucao
        return acc + (resolucao.getTime() - abertura.getTime());
      } catch { return acc; }
    }, 0);

    const mediaHoras = Math.round(totalHoras / resolvidos.length / (1000 * 60 * 60));
    if (mediaHoras >= 24) return `${Math.round(mediaHoras / 24)} dia(s)`;
    return `${mediaHoras} hora(s)`;
  }

  getStatusCount(status: string): number {
    return this.chamados.filter(c => c.status === status).length;
  }

  onVoltar()        { this.closeReportScreen.emit(); }
  onEditarFiltros() { this.openFilterModal.emit(); }

  // ===== IMPRIMIR =====
  imprimirRelatorio(): void { window.print(); }

  // ===== EXPORTAR XLSX =====
  exportarRelatorio(): void {
    if (!this.chamados || this.chamados.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const dadosParaPlanilha = this.chamados.map(c => ({
      'Protocolo':  c.numeroProtocolo,
      'Cliente':    c.cliente.replace(/🚴|👤|🏪/g, '').trim(),
      'Nome':       c.nomeCliente || '',
      'Área':       c.area || 'N/A',
      'Status':     this.getStatusLabel(c.status),
      'Data':       this.formatarData(c.dataAbertura),
      'Hora':       c.horaAbertura,
      'Prioridade': this.getPrioridadeLabel(c.prioridade),
      'Atendente':  c.atendente?.nomeCompleto || c.atendente?.nome || c.atendente || '',
      'Assunto':    c.categoria,
      'Descrição':  c.descricao,
      'Origem':     c.origem || 'email'
    }));

    const ws = XLSX.utils.json_to_sheet(dadosParaPlanilha);
    const objectMaxLength: number[] = [];
    for (const row of dadosParaPlanilha) {
      Object.values(row).forEach((v, j) => {
        const len = typeof v === 'string' ? v.length : 10;
        objectMaxLength[j] = Math.max(objectMaxLength[j] || 0, len);
      });
    }
    ws['!cols'] = objectMaxLength.map(w => ({ width: w + 2 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chamados');
    XLSX.writeFile(wb, `Relatorio_Kozzy_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  private formatarData(dataIso: string): string {
    if (!dataIso) return '';
    const d = new Date(dataIso);
    return isNaN(d.getTime()) ? dataIso : d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  }

  getStatusLabel(status: string): string {
    const l: any = { 'aberto': 'Aberto', 'em andamento': 'Em Andamento', 'concluido': 'Concluído', 'encerrado': 'Encerrado' };
    return l[status] || status;
  }

  private getPrioridadeLabel(p: string): string {
    const l: any = { 'baixa': 'Baixa', 'media': 'Média', 'alta': 'Alta', 'urgente': 'Urgente' };
    return l[p] || p;
  }
}