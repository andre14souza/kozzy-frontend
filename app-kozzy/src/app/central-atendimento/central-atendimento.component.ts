import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ChamadosService, Chamado, NovoChamado, RelatorioFilters } from '../chamados.service';
import { AuthService, UsuarioLogado } from '../auth.service';
import { LoadingService } from '../loading.service';

import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component';
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';
import { SearchProtocolModalComponent } from '../search-protocol-modal/search-protocol-modal.component';
import { TicketDetailComponent } from '../ticket-detail/ticket-detail.component';

interface MenuItem { label: string; icon: string; route?: string; action?: () => void; badge?: number; active?: boolean; }
interface ToastMessage { message: string; type: 'success' | 'info' | 'warning' | 'error'; visible: boolean; }

@Component({
  selector: 'app-central-atendimento',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    CreateTicketModalComponent,
    RelatorioFiltroModalComponent,
    RelatorioScreenComponent,
    SearchProtocolModalComponent,
    TicketDetailComponent
  ],
  templateUrl: './central-atendimento.component.html',
  styleUrls: ['./central-atendimento.component.css'],
})
export class CentralAtendimentoComponent implements OnInit, OnDestroy {
  // Variáveis de Controle de Tela
  showCreateModal: boolean = false; // <<< É ESSA QUE O HTML USA, NÃO 'isVisible'
  showSearchModal: boolean = false;
  showRelatorioFiltrosModal: boolean = false;
  showRelatorioScreen: boolean = false;
  showDetailScreen: boolean = false;
  origemDetalhe: 'dashboard' | 'relatorio' = 'dashboard';
  chamadoSelecionado: Chamado | null = null;
  chamadoDetalhe: Chamado | null = null;
  
  chamados: Chamado[] = [];
  relatorioChamados: Chamado[] = [];
  chamadosSubscription!: Subscription;
  usuarioLogado: UsuarioLogado | null = null;
  
  menuItems: MenuItem[] = [];
  statusFilters = [
    { label: 'Todos', value: 'todos', icon: '📄', count: 0, active: true },
    { label: 'Abertos', value: 'aberto', icon: '🔴', count: 0, active: false },
    { label: 'Em Andamento', value: 'em-andamento', icon: '🟡', count: 0, active: false },
    { label: 'Fechados', value: 'fechado', icon: '🟢', count: 0, active: false },
  ];
  currentFilter: string = 'todos';
  
  // NOVO: Filtro de Origem
  filtroOrigem: 'todos' | 'whatsapp' | 'email' = 'todos';

  menuCollapsed: boolean = false;
  filtrosRelatorioSalvos: RelatorioFilters | null = null;
  toast: ToastMessage = { message: '', type: 'info', visible: false };

  constructor(
    public chamadosService: ChamadosService,
    public authService: AuthService,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.usuarioLogado = this.authService.getUsuarioLogado();
    this.carregarDados();

    this.menuItems = [
      { label: 'Chamados', icon: '📞', action: () => this.voltarParaLista(), active: true, badge: 0 },
      { label: 'Novo Atendimento', icon: '➕', action: () => this.abrirModalCriarChamado() },
      { label: 'Buscar Protocolo', icon: '🔍', action: () => this.abrirModalBuscaProtocolo() },
      { label: 'Relatórios', icon: '📊', action: () => this.abrirModalRelatorios() },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
      { label: 'Design System', icon: '🎨', route: '/design-system' }
    ];
  }

  ngOnDestroy(): void {
    if (this.chamadosSubscription) { this.chamadosSubscription.unsubscribe(); }
  }

  carregarDados(): void {
    this.loadingService.show();
    this.chamadosSubscription = this.chamadosService.getChamados().subscribe({
      next: (dados: Chamado[]) => {
        if (this.authService.isSupervisor()) {
          this.chamados = dados;
        } else {
          const areaDoUsuario = this.usuarioLogado?.perfil || '';
          this.chamados = dados.filter(c => {
             const areaChamado = c.area.toLowerCase();
             const areaUser = areaDoUsuario.toLowerCase();
             if (areaUser === 'atendente') return true; 
             return areaChamado.includes(areaUser);
          });
        }
        this.updateStatusCounts();
        this.updateMenuBadge();
        this.loadingService.hide();
      },
      error: (err: any) => {
        console.error(err);
        this.showToast('Erro ao carregar chamados.', 'error');
        this.loadingService.hide();
      }
    });
  }

  // --- FILTROS ---

  setFilter(filterValue: string) {
    this.currentFilter = filterValue;
    this.statusFilters.forEach((filter) => (filter.active = filter.value === filterValue));
  }

  setFiltroOrigem(origem: 'todos' | 'whatsapp' | 'email') {
    this.filtroOrigem = origem;
  }

  getFilteredChamados(): Chamado[] {
    let lista = this.chamados;

    // 1. Filtro de Status
    if (this.currentFilter !== 'todos') {
      lista = lista.filter((chamado) => chamado.status === this.currentFilter);
    }

    // 2. Filtro de Origem
    if (this.filtroOrigem !== 'todos') {
      lista = lista.filter(c => (c.origem || 'email') === this.filtroOrigem);
    }

    return lista;
  }

  // --- MÉTODOS CRUD ---

  onChamadoCriado(n: NovoChamado) { 
    this.loadingService.show();
    this.chamadosService.adicionarChamado(n).subscribe({
      next: (res: any) => { 
        this.fecharModal();
        this.showToast('Chamado criado com sucesso!', 'success');
        this.carregarDados();
      },
      error: (err: any) => { 
        console.error(err);
        this.showToast('Erro ao criar chamado.', 'error');
        this.loadingService.hide();
      }
    });
  }

  onChamadoAtualizado(c: Chamado) { 
    this.loadingService.show();
    this.chamadosService.atualizarChamado(c).subscribe({
      next: (res: any) => { 
        this.fecharModal();
        this.showToast('Chamado atualizado com sucesso!', 'success');
        if (this.showDetailScreen && this.chamadoDetalhe?.id === c.id) {
          this.chamadoDetalhe = c;
        }
        this.carregarDados();
      },
      error: (err: any) => { 
        console.error(err);
        this.showToast('Erro ao atualizar chamado.', 'error');
        this.loadingService.hide();
      }
    });
  }

  // --- OUTROS MÉTODOS ---

  voltarParaLista() {
    this.showDetailScreen = false;
    this.showRelatorioScreen = false;
    this.chamadoDetalhe = null;
    this.setFilter('todos');
  }

  onSelectChamado(chamado: Chamado): void {
    this.chamadoDetalhe = chamado;
    this.showDetailScreen = true;
    this.showRelatorioScreen = false;
    this.origemDetalhe = 'dashboard';
  }
  onSelectChamadoDoRelatorio(chamado: Chamado): void {
    this.chamadoDetalhe = chamado;
    this.showDetailScreen = true;
    
    // IMPORTANTE: Não setamos showRelatorioScreen = false aqui imediatamente se quisermos manter o estado,
    // mas geralmente escondemos para mostrar o detalhe full screen.
    this.showRelatorioScreen = false; 
    
    this.origemDetalhe = 'relatorio'; // <--- Marca que veio do Relatório
  }
  fecharTelaDetalhes(): void {
    this.showDetailScreen = false;
    this.chamadoDetalhe = null;
    if (this.origemDetalhe === 'relatorio') {
        this.showRelatorioScreen = true;
    }
  }

  abrirModalRelatorios() {
    this.showDetailScreen = false;
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
    this.showRelatorioFiltrosModal = true;
  }

  abrirModalBuscaProtocolo() { this.showSearchModal = true; }
  fecharModalBusca() { this.showSearchModal = false; }

  onBuscarProtocolo(protocolo: string) {
    const chamadoEncontrado = this.chamados.find(c => c.numeroProtocolo === protocolo);
    if (chamadoEncontrado) {
      this.showSearchModal = false;
      this.onSelectChamado(chamadoEncontrado);
      this.showToast('Chamado encontrado!', 'success');
    } else {
      this.showToast(`Protocolo #${protocolo} não encontrado.`, 'warning');
    }
  }

  onEditarAPartirDoDetalhe(chamado: Chamado) {
    if (this.usuarioLogado?.perfil === 'atendente' && chamado.atendente !== this.usuarioLogado.nome) {
      // Regra de edição
    }
    this.abrirModalEdicao(chamado);
  }

  abrirModalEdicao(chamado: Chamado) {
    this.chamadoSelecionado = { ...chamado };
    this.showCreateModal = true;
  }

  abrirModalCriarChamado() {
    this.chamadoSelecionado = null;
    this.showCreateModal = true;
  }

  fecharModal() {
    this.showCreateModal = false;
    this.chamadoSelecionado = null;
  }

  fecharModalRelatorioFiltros() { this.showRelatorioFiltrosModal = false; }
  
  onGerarRelatorio(filtros: RelatorioFilters) {
    this.filtrosRelatorioSalvos = { ...filtros };
    this.loadingService.show();
    this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros);
    this.loadingService.hide();
    this.showRelatorioFiltrosModal = false;
    setTimeout(() => { this.showRelatorioScreen = true; }, 100);
  }

  fecharRelatorioScreen() {
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
  }
  
  reabrirModalFiltros() { this.showRelatorioFiltrosModal = true; }

  toggleMenu() { this.menuCollapsed = !this.menuCollapsed; }
  
  updateStatusCounts() {
    this.statusFilters.forEach((filter) => {
      filter.count = filter.value === 'todos' 
        ? this.chamados.length 
        : this.chamados.filter((c) => c.status === filter.value).length;
    });
  }

  updateMenuBadge() {
    const chamadosItem = this.menuItems.find((item) => item.label === 'Chamados');
    if (chamadosItem) {
      chamadosItem.badge = this.chamados.filter((c) => c.status === 'aberto' || c.status === 'em-andamento').length;
    }
  }

  getStatusLabel(status: string) { 
    const l:any = { 'aberto': 'Aberto', 'em-andamento': 'Em Andamento', 'fechado': 'Fechado' }; 
    return l[status] || status; 
  }
  
  formatDateTime(date: string, time: string) { return date + ' ' + time; }

  showToast(message: string, type: 'success' | 'info' | 'warning' | 'error') {
    this.toast = { message, type, visible: true };
    setTimeout(() => { this.toast.visible = false; }, 3000);
  }

  logout() {
    if (confirm('Tem certeza que deseja sair?')) {
      this.authService.logout();
    }
  }
}