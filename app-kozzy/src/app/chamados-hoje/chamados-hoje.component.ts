import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChamadosService, Chamado } from '../chamados.service';
import { RelatorioTabelaComponent } from '../relatorio-tabela/relatorio-tabela.component';
import { TicketDetailComponent } from '../ticket-detail/ticket-detail.component';
import { AuthService, UsuarioLogado } from '../auth.service';
import { UrlAnexoPipe } from '../url-anexo.pipe';

interface MenuItem { 
  label: string; 
  icon: string; 
  route?: string; 
  action?: () => void; 
  badge?: number; 
  active?: boolean; 
}

@Component({
  selector: 'app-chamados-hoje',
  standalone: true,
  imports: [CommonModule, RouterModule, RelatorioTabelaComponent, TicketDetailComponent, UrlAnexoPipe],
  templateUrl: './chamados-hoje.component.html',
  styleUrls: ['./chamados-hoje.component.css']
})
export class ChamadosHojeComponent implements OnInit {
  chamadosHoje: Chamado[] = [];
  isLoading = true;
  showDetailScreen = false;
  chamadoDetalhe: Chamado | null = null;
  usuarioLogado: UsuarioLogado | null = null;

  menuCollapsed = false;
  isMobileMenuOpen = false;
  menuItems: MenuItem[] = [];

  constructor(
    private chamadosService: ChamadosService, 
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.authService.usuarioLogado$.subscribe(user => {
      this.usuarioLogado = user;
    });
    
    this.menuItems = [
      { label: 'Chamados', icon: '📞', route: '/central' },
      { label: 'Novo Atendimento', icon: '➕', route: '/central' },
      { label: 'Chamados do Dia', icon: '📅', route: '/hoje', active: true },
      { label: 'Buscar Protocolo', icon: '🔍', route: '/central' },
      { label: 'Relatórios', icon: '📊', route: '/central' },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
      { label: 'Design System', icon: '🎨', route: '/design-system' }
    ];

    this.carregarChamadosDoDia();
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  checkScreenSize() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.menuCollapsed = true;
    } else {
      this.isMobileMenuOpen = false;
    }
  }

  toggleMenu() {
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    } else {
      this.menuCollapsed = !this.menuCollapsed;
    }
  }

  logout() {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
    }
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
