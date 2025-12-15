import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService, UsuarioLogado } from '../auth.service';
import { ChamadosService, Chamado, NovoChamado, RelatorioFilters } from '../chamados.service';
// Se você tiver o LoadingService, mantenha. Se não, remova o import e o uso no construtor.
import { LoadingService } from '../loading.service'; 

import { CreateTicketModalComponent } from '../create-ticket-modal/create-ticket-modal.component';
import { CriarUsuarioModalComponent } from '../criar-usuario-modal/criar-usuario-modal.component';
import { RelatorioFiltroModalComponent } from '../relatorio-filtro-modal/relatorio-filtro-modal.component';
import { RelatorioScreenComponent } from '../relatorio-screen/relatorio-screen.component';
import { TicketDetailComponent } from '../ticket-detail/ticket-detail.component'; 
import { SearchProtocolModalComponent } from '../search-protocol-modal/search-protocol-modal.component';

interface KPI { label: string; value: number; color: string; icon: string; }
interface FilterOptions { busca: string; status: string; prioridade: string; ordenacao: string; }
interface ToastMessage { message: string; type: 'success' | 'info' | 'warning' | 'error'; visible: boolean; }
interface MenuItem { label: string; icon: string; route?: string; action?: () => void; badge?: number; active?: boolean; }

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    CreateTicketModalComponent,
    CriarUsuarioModalComponent,
    RelatorioFiltroModalComponent, 
    RelatorioScreenComponent,
    TicketDetailComponent,
    SearchProtocolModalComponent
  ],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrl: './supervisor-dashboard.component.css'
})
export class SupervisorDashboardComponent implements OnInit, OnDestroy {
  showTicketModal: boolean = false;
  showCriarUsuarioModal: boolean = false;
  showRelatorioFiltrosModal: boolean = false;
  showRelatorioScreen: boolean = false;
  showSearchModal: boolean = false;
  showDetailScreen: boolean = false;
  origemDetalhe: 'dashboard' | 'relatorio' = 'dashboard';
  chamadoDetalhe: Chamado | null = null;
  chamadoSelecionado: Chamado | null = null;
  relatorioChamados: Chamado[] = [];
  
  menuCollapsed: boolean = false;
  menuItems: MenuItem[] = [];
  usuarioLogado: UsuarioLogado | null = null;
  filtros: FilterOptions = { busca: '', status: 'todos', prioridade: 'todas', ordenacao: 'mais-recentes' };
  toast: ToastMessage = { message: '', type: 'info', visible: false };
  kpis: KPI[] = [
    { label: 'Abertos', value: 0, color: 'red', icon: '🔴' },
    { label: 'Em Andamento', value: 0, color: 'yellow', icon: '🟡' },
    { label: 'Concluídos', value: 0, color: 'green', icon: '✅' },
    { label: 'Urgentes', value: 0, color: 'orange', icon: '⚠️' }
  ];
  chamados: Chamado[] = [];
  private chamadosSubscription!: Subscription;

  viewMode: 'dashboard' | 'usuarios' = 'dashboard';
  listaUsuarios: any[] = [];

  constructor(
    private router: Router, 
    public authService: AuthService,
    private chamadosService: ChamadosService,
    private loadingService: LoadingService // Remova se não tiver o serviço criado
  ) {}

  ngOnInit() {
    this.usuarioLogado = this.authService.getUsuarioLogado();
    this.carregarDados(); // Carrega os chamados ao iniciar
    
    this.menuItems = [
      { label: 'Visão Geral', icon: '👑', action: () => this.mudarVista('dashboard'), active: true },
      { label: 'Gerenciar Equipe', icon: '👥', action: () => this.mudarVista('usuarios') },
      { label: 'Buscar Protocolo', icon: '🔍', action: () => this.abrirModalBuscaProtocolo() },
      { label: 'Relatórios', icon: '📊', action: () => this.abrirModalRelatorios() },
      { label: 'Configurações', icon: '⚙️', route: '/configuracoes' },
      { label: 'Design System', icon: '🎨', route: '/design-system' }
    ];
    
    this.checkScreenSize();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  carregarDados() {
    // Se tiver LoadingService use: this.loadingService.show();
    this.chamadosSubscription = this.chamadosService.getChamados().subscribe({
        next: (dados) => {
            this.chamados = dados;
            this.calcularKPIs();
            // this.loadingService.hide();
        },
        error: (err) => {
            console.error(err);
            // this.loadingService.hide();
        }
    });
  }

  ngOnDestroy() { 
    if (this.chamadosSubscription) { this.chamadosSubscription.unsubscribe(); } 
    window.removeEventListener('resize', this.checkScreenSize.bind(this)); 
  }

  // --- NOVA FUNÇÃO DE EXCLUIR ---
  excluirChamadoDoDetalhe(id: string) {
    if (confirm('Tem certeza que deseja EXCLUIR este chamado permanentemente?')) {
        // this.loadingService.show();
        
        this.chamadosService.deletarChamado(id).subscribe({
            next: () => {
                this.showToast('Chamado excluído com sucesso!', 'success');
                
                // IMPORTANTE: Fechar a tela de detalhes pois o chamado não existe mais
                this.fecharTelaDetalhes();
                
                // Recarregar a lista
                this.carregarDados();
            },
            error: (err) => {
                console.error(err);
                this.showToast('Erro ao excluir chamado.', 'error');
                // this.loadingService.hide();
            }
        });
    }
  }

  mudarVista(modo: 'dashboard' | 'usuarios') {
    this.viewMode = modo;
    
    this.menuItems.forEach(i => {
      i.active = (i.label === 'Visão Geral' && modo === 'dashboard') || 
                 (i.label === 'Gerenciar Equipe' && modo === 'usuarios');
    });

    if (modo === 'dashboard') {
        this.showDetailScreen = false;
        this.showRelatorioScreen = false;
        this.chamadoDetalhe = null;
        this.carregarDados();
    }
    
    if (modo === 'usuarios') {
      this.carregarUsuarios();
    }
  }

  carregarUsuarios() {
    this.authService.getTodosUsuarios().subscribe({
      next: (users) => this.listaUsuarios = users,
      error: (err) => this.showToast('Erro ao carregar usuários', 'error')
    });
  }

  excluirUsuario(usuario: any) {
    if (usuario.id === this.usuarioLogado?.id) {
      alert('Você não pode excluir a si mesmo!');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir ${usuario.nome}?`)) {
      this.authService.deletarUsuario(usuario.id).subscribe({
        next: () => {
          this.showToast('Usuário excluído.', 'success');
          this.carregarUsuarios(); 
        },
        error: (err) => {
          console.error(err);
          this.showToast('Erro ao excluir.', 'error');
        }
      });
    }
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

  abrirModalRelatorios(): void { 
    this.showDetailScreen = false;
    this.showRelatorioScreen = false; 
    this.relatorioChamados = []; 
    this.showRelatorioFiltrosModal = true; 
  }

  abrirModalBuscaProtocolo() { this.showSearchModal = true; }
  fecharModalBusca() { this.showSearchModal = false; }
  onBuscarProtocolo(p: string) {
    const c = this.chamadosService.buscarPorProtocolo(p);
    if(c) { this.showSearchModal=false; this.onSelectChamado(c); this.showToast('Encontrado!', 'success'); }
    else { this.showToast('Não encontrado.', 'warning'); }
  }

  onEditarAPartirDoDetalhe(chamado: Chamado) {
    if (this.usuarioLogado?.perfil === 'supervisor') {
        this.abrirModalEdicao(chamado);
    } else {
        this.showToast('Apenas Supervisores podem editar.', 'error');
    }
  }

  abrirModalEdicao(c: Chamado) { this.chamadoSelecionado = { ...c }; this.showTicketModal = true; }
  fecharTicketModal() { this.showTicketModal = false; this.chamadoSelecionado = null; }
  
  onChamadoAtualizado(c: Chamado) {
    this.chamadosService.atualizarChamado(c).subscribe({
        next: () => {
            this.fecharTicketModal();
            if (this.showDetailScreen && this.chamadoDetalhe?.id === c.id) { this.chamadoDetalhe = c; }
            this.showToast('Atualizado com sucesso!', 'success');
            this.carregarDados();
        }, 
        error: () => this.showToast('Erro ao atualizar', 'error')
    });
  }
  
  abrirModalCriarChamado() { this.chamadoSelecionado = null; this.showTicketModal = true; }
  onChamadoCriado(n: NovoChamado) {
    this.chamadosService.adicionarChamado(n).subscribe({
        next: () => {
            this.fecharTicketModal();
            this.showToast('Criado com sucesso!', 'success');
            this.carregarDados();
        },
        error: () => this.showToast('Erro ao criar', 'error')
    });
  }

  abrirModalCriarUsuario() { this.showCriarUsuarioModal = true; }
  fecharModalCriarUsuario() { this.showCriarUsuarioModal = false; }
  
  onUsuarioCriado(msg: string) { 
      this.showToast(msg, 'success'); 
      this.fecharModalCriarUsuario(); 
      if (this.viewMode === 'usuarios') this.carregarUsuarios();
  }
  
  fecharModalRelatorioFiltros() { this.showRelatorioFiltrosModal = false; }
  onGerarRelatorio(filtros: RelatorioFilters) { 
      this.relatorioChamados = this.chamadosService.buscarChamadosPorFiltros(filtros); 
      this.showRelatorioFiltrosModal = false; 
      setTimeout(() => { this.showRelatorioScreen = true; }, 100); 
  }
  fecharRelatorioScreen() { this.showRelatorioScreen = false; this.relatorioChamados = []; }
  
  checkScreenSize() { this.menuCollapsed = window.innerWidth < 1024; }
  logout() { if (confirm('Tem certeza?')) { this.authService.logout(); } }
  showToast(message: string, type: any) { this.toast = { message, type, visible: true }; setTimeout(() => { this.toast.visible = false; }, 3000); }
  
  calcularKPIs() { const abertos = this.chamados.filter(c => c.status === 'aberto').length; const emAndamento = this.chamados.filter(c => c.status === 'em-andamento').length; const concluidos = this.chamados.filter(c => c.status === 'fechado').length; const urgentes = this.chamados.filter(c => c.prioridade === 'urgente' || c.prioridade === 'alta').length; this.kpis[0].value=abertos; this.kpis[1].value=emAndamento; this.kpis[2].value=concluidos; this.kpis[3].value=urgentes; }
  setFilter(key: any, value: any) { (this.filtros as any)[key] = value; }
  getChamadosFiltrados(): Chamado[] { let r = [...this.chamados]; if(this.filtros.busca.trim()){const b=this.filtros.busca.toLowerCase(); r=r.filter(c=>c.numeroProtocolo.toLowerCase().includes(b) || c.cliente.toLowerCase().includes(b) || c.descricao.toLowerCase().includes(b))} if(this.filtros.status!=='todos'){r=r.filter(c=>c.status===this.filtros.status)} return r; }
  getStatusLabel(s: string) { const labels: { [key: string]: string } = { 'aberto': 'Aberto', 'em-andamento': 'Em Andamento', 'fechado': 'Concluído' }; return labels[s] || ''; }
  getPrioridadeLabel(p: string) { const labels: { [key: string]: string } = { 'baixa': 'Baixa', 'media': 'Média', 'alta': 'Alta', 'urgente': 'Urgente' }; return labels[p] || ''; }
  getPrioridadeClass(p: string) { const classes: { [key: string]: string } = { 'alta': 'prioridade-alta', 'urgente': 'prioridade-alta', 'media': 'prioridade-media', 'baixa': 'prioridade-baixa' }; return classes[p] || ''; }
  getStatusClass(s:string){return`status-${s.replace('-','')}`}
  formatarData(d:any){return new Date(d).toLocaleDateString('pt-BR')}
}