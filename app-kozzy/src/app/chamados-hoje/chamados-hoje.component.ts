import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChamadosService, Chamado } from '../chamados.service';
import { RelatorioTabelaComponent } from '../relatorio-tabela/relatorio-tabela.component';
import { TicketDetailComponent } from '../ticket-detail/ticket-detail.component';
import { AuthService, UsuarioLogado } from '../auth.service';

@Component({
  selector: 'app-chamados-hoje',
  standalone: true,
  imports: [CommonModule, RelatorioTabelaComponent, TicketDetailComponent],
  templateUrl: './chamados-hoje.component.html',
  styleUrls: ['./chamados-hoje.component.css']
})
export class ChamadosHojeComponent implements OnInit {
  chamadosHoje: Chamado[] = [];
  isLoading = true;
  showDetailScreen = false;
  chamadoDetalhe: Chamado | null = null;
  usuarioLogado: UsuarioLogado | null = null;

  constructor(private chamadosService: ChamadosService, private authService: AuthService) {}

  ngOnInit() {
    this.usuarioLogado = this.authService.getUsuarioLogado();
    this.carregarChamadosDoDia();
  }

  carregarChamadosDoDia() {
    this.isLoading = true;
    const hoje = new Date().toISOString().split('T')[0];
    
    // Usar o endpoint de filtro para pegar apenas de hoje
    this.chamadosService.buscarChamadosPorFiltros({
      dataInicio: hoje,
      dataFim: hoje,
      status: 'todos',
      prioridade: 'todos',
      atendente: 'todos'
    }).subscribe({
      next: (dados) => {
        this.chamadosHoje = dados;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  onRowClick(chamado: Chamado) {
    this.chamadoDetalhe = chamado;
    this.showDetailScreen = true;
  }

  fecharTelaDetalhes() {
    this.showDetailScreen = false;
    this.chamadoDetalhe = null;
  }
}
