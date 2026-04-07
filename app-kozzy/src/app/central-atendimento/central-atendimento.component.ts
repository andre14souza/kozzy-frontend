import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

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
    CommonModule, FormsModule, RouterModule, DragDropModule,
    CreateTicketModalComponent, RelatorioFiltroModalComponent,
    RelatorioScreenComponent, SearchProtocolModalComponent, TicketDetailComponent
  ],
  templateUrl: './central-atendimento.component.html',
  styleUrls: ['./central-atendimento.component.css'],
})
export class CentralAtendimentoComponent implements OnInit, OnDestroy {
  viewMode: 'kanban' | 'list' = 'kanban';
  chamadosAbertos: Chamado[] = [];
  chamadosEmAndamento: Chamado[] = [];
  chamadosConcluidos: Chamado[] = [];
  chamadosEncerrados: Chamado[] = [];

  showCreateModal: boolean = false;
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

  // ✅ CORREÇÃO CRÍTICA: Os 'values' agora batem EXATAMENTE com o banco de dados
  statusFilters = [
    { label: 'Todos', value: 'todos', icon: '📄', count: 0, active: true },
    { label: 'Abertos', value: 'aberto', icon: '🔴', count: 0, active: false },
    { label: 'Em Andamento', value: 'em andamento', icon: '🟡', count: 0, active: false },
    { label: 'Concluídos', value: 'concluido', icon: '🟢', count: 0, active: false },
    { label: 'Encerrados', value: 'encerrado', icon: '🔒', count: 0, active: false }
  ];
  currentFilter: string = 'todos';
  filtroOrigem: 'todos' | 'whatsapp' | 'email' = 'todos';
  menuCollapsed: boolean = false;
  isMobileMenuOpen: boolean = false;
  filtrosRelatorioSalvos: RelatorioFilters | null = null;
  toast: ToastMessage = { message: '', type: 'info', visible: false };

  constructor(
    public chamadosService: ChamadosService,
    public authService: AuthService,
    private loadingService: LoadingService
  ) { }

  ngOnInit(): void {
    this.usuarioLogado = this.authService.getUsuarioLogado();
    this.carregarDados();
    this.checkScreenSize();

    window.addEventListener('resize', this.checkScreenSize.bind(this));

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
    if (this.chamadosSubscription) this.chamadosSubscription.unsubscribe();
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  checkScreenSize() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      // Mobile: menu desktop always "collapsed", mobile menu managed by isMobileMenuOpen
      this.menuCollapsed = true;
    } else {
      this.isMobileMenuOpen = false;
    }
  }

  carregarDados(): void {
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
        this.updateKanbanColumns();
      },
      error: (err) => {
        this.showToast('Erro ao carregar chamados.', 'error');
      }
    });
  }

  setFilter(filterValue: string) {
    this.currentFilter = filterValue;
    this.statusFilters.forEach((filter) => (filter.active = filter.value === filterValue));
    this.updateKanbanColumns();
  }

  setFiltroOrigem(origem: 'todos' | 'whatsapp' | 'email') {
    this.filtroOrigem = origem;
    this.updateKanbanColumns();
  }

  getFilteredChamados(): Chamado[] {
    let lista = this.chamados;
    if (this.currentFilter !== 'todos') lista = lista.filter(c => c.status === this.currentFilter);
    if (this.filtroOrigem !== 'todos') lista = lista.filter(c => (c.origem || 'email') === this.filtroOrigem);
    return lista;
  }

  onChamadoCriado(n: NovoChamado) {
    this.chamadosService.adicionarChamado(n).subscribe({
      next: () => {
        this.fecharModal();
        this.showToast('Chamado criado com sucesso!', 'success');
        this.carregarDados();
      },
      error: () => {
        this.showToast('Erro ao criar chamado.', 'error');
      }
    });
  }

  onChamadoAtualizado(c: Chamado) {
    this.chamadosService.atualizarChamado(c).subscribe({
      next: () => {
        this.fecharModal();
        this.showToast('Chamado atualizado com sucesso!', 'success');
        if (this.showDetailScreen && this.chamadoDetalhe?.id === c.id) {
          this.chamadoDetalhe = c;
        }
        this.carregarDados();
      },
      error: () => {
        this.showToast('Erro ao atualizar chamado.', 'error');
      }
    });
  }

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
    this.showRelatorioScreen = false;
    this.origemDetalhe = 'relatorio';
  }

  fecharTelaDetalhes(): void {
    this.showDetailScreen = false;
    this.chamadoDetalhe = null;
    if (this.origemDetalhe === 'relatorio') this.showRelatorioScreen = true;
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

  onEditarAPartirDoDetalhe(chamado: Chamado) { this.abrirModalEdicao(chamado); }

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
    // ✅ Agora o serviço realmente filtra os dados
    this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros);
    this.showRelatorioFiltrosModal = false;
    setTimeout(() => { this.showRelatorioScreen = true; }, 100);
  }

  fecharRelatorioScreen() {
    this.showRelatorioScreen = false;
    this.relatorioChamados = [];
  }

  reabrirModalFiltros() { this.showRelatorioFiltrosModal = true; }
  toggleMenu() { 
    if (window.innerWidth <= 768) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
    } else {
      this.menuCollapsed = !this.menuCollapsed; 
    }
  }

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
      // ✅ CORREÇÃO: Usando 'em andamento'
      chamadosItem.badge = this.chamados.filter(c => c.status === 'aberto' || c.status === 'em andamento').length;
    }
  }

  // ✅ CORREÇÃO: Nomenclatura exata para os rótulos do Frontend
  getStatusLabel(status: string) {
    const l: any = {
      'aberto': 'Aberto',
      'em andamento': 'Em Andamento',
      'concluido': 'Concluído',
      'encerrado': 'Encerrado'
    };
    return l[status] || status;
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

  getTempoDecorrido(dataAbertura: string, horaAbertura: string): string {
    if (!dataAbertura) return '';
    try {
      const dataStr = dataAbertura.split('T')[0];
      const horaStr = horaAbertura || '00:00:00';
      const abertura = new Date(`${dataStr}T${horaStr}`);
      const agora = new Date();
      if (isNaN(abertura.getTime())) return '';

      const diffMs = agora.getTime() - abertura.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDias = Math.floor(diffHrs / 24);

      if (diffDias > 0) return `${diffDias} d`;
      if (diffHrs > 0) return `${diffHrs} h`;

      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} m`;
    } catch {
      return '';
    }
  }

  showToast(message: string, type: 'success' | 'info' | 'warning' | 'error') {
    this.toast = { message, type, visible: true };
    setTimeout(() => { this.toast.visible = false; }, 3000);
  }

  logout() { if (confirm('Tem certeza que deseja sair?')) this.authService.logout(); }

  // ==== KANBAN LOGIC ====
  updateKanbanColumns() {
    const list = this.getFilteredChamados();
    this.chamadosAbertos = list.filter(c => c.status === 'aberto');
    this.chamadosEmAndamento = list.filter(c => c.status === 'em andamento');
    this.chamadosConcluidos = list.filter(c => c.status === 'concluido');
    this.chamadosEncerrados = list.filter(c => c.status === 'encerrado');
  }

  drop(event: CdkDragDrop<Chamado[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );

      const chamadoMovido = event.container.data[event.currentIndex];
      let novoStatus = chamadoMovido.status;

      if (event.container.id === 'listaAbertos') novoStatus = 'aberto';
      else if (event.container.id === 'listaEmAndamento') novoStatus = 'em andamento';
      else if (event.container.id === 'listaConcluidos') novoStatus = 'concluido';
      else if (event.container.id === 'listaEncerrados') novoStatus = 'encerrado';

      if (chamadoMovido.status !== novoStatus) {
        chamadoMovido.status = novoStatus;
        this.chamadosService.atualizarChamado(chamadoMovido).subscribe({
          next: () => {
            this.showToast('Status atualizado via Kanban', 'success');
            this.updateStatusCounts();
            this.updateMenuBadge();
          },
          error: () => {
            this.showToast('Erro ao atualizar status', 'error');
            this.carregarDados(); // Reverte a view
          }
        });
      }
    }
  }
}