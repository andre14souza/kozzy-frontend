import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Chamado, NovoChamado } from '../chamados.service';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment'; // 💥 NOVO: Adicione este import no topo do arquivo!
interface SelectOption { value: string; label: string; }

@Component({
  selector: 'app-create-ticket-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-ticket-modal.component.html',
  styleUrls: ['./create-ticket-modal.component.css']
})
export class CreateTicketModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() chamadoParaEditar?: Chamado | null;
  @Input() perfilUsuario: string = 'atendente';
  @Input() usuarioLogadoNome: string = '';

  @Output() closeModal = new EventEmitter<void>();
  @Output() chamadoCriado = new EventEmitter<NovoChamado>();
  @Output() chamadoAtualizado = new EventEmitter<Chamado>();

  ticketForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  showPreview = false;

  // --- OPÇÕES DE STATUS (NOVO) ---
  statusOptions: SelectOption[] = [
    { value: 'aberto', label: '🔴 Aberto' },
    { value: 'em-andamento', label: '🟡 Em Andamento' },
    { value: 'fechado', label: '🟢 Concluído' }
  ];

  origemOptions: SelectOption[] = [
    { value: 'email', label: '📧 E-mail' },
    { value: 'whatsapp', label: '📱 WhatsApp' }
  ];

  areaOptions: SelectOption[] = [
    { value: 'Logistica', label: '📦 Logística' },
    { value: 'Contas a Pagar', label: '💸 Contas a Pagar' },
    { value: 'Contas a Receber', label: '💵 Contas a Receber' },
    { value: 'Compra', label: '🛒 Compras' },
    { value: 'T.I', label: '💻 T.I' },
    { value: 'Comercial', label: '📞 Comercial' }
  ];

  assuntoOptions: SelectOption[] = [
    { value: 'Dúvida Geral', label: 'Dúvida Geral' },
    { value: 'Reclamação', label: 'Reclamação' },
    { value: 'Solicitação de Serviço', label: 'Solicitação de Serviço' },
    { value: 'Erro no Sistema', label: 'Erro no Sistema' },
    { value: 'Troca/Devolução', label: 'Troca/Devolução' }
  ];

  clienteOptions: SelectOption[] = [
    { value: 'entregador', label: '🚴 Entregador' },
    { value: 'cliente', label: '👤 Cliente Final' },
    { value: 'vendedor', label: '🏪 Loja/Vendedor' },
    { value: 'interno', label: '🏢 Interno' }
  ];

  atendenteOptions: SelectOption[] = [];
  
  prioridadeOptions: SelectOption[] = [ 
    { value: 'Baixa Prioridade', label: '🟢 Baixa' },
    { value: 'Média Prioridade', label: '🟡 Média' }, 
    { value: 'Alta Prioridade', label: '🟠 Alta' }, 
    { value: 'Urgente', label: '🔴 Urgente' } 
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.initializeForm();
    this.carregarAtendentes();
    this.filtrarAreasPermitidas();
  }

  carregarAtendentes() {
    this.authService.getTodosUsuarios().subscribe({
      next: (usuarios) => {
        this.atendenteOptions = usuarios.map(u => ({ value: u.nome, label: u.nome }));
      },
      error: (err) => console.error(err)
    });
  }

  filtrarAreasPermitidas() {
    if (this.perfilUsuario === 'supervisor') return;
    const usuario = this.authService.getUsuarioLogado();
    if (!usuario || !usuario.id) return;

    // 💥 CORREÇÃO: Usar environment.apiUrl para apontar para o Render
    this.http.get<any>(`${environment.apiUrl}/areas/${usuario.id}`, { withCredentials: true }).subscribe({
      next: (res) => {
        if (res && res.areas && res.areas.length > 0) {
          this.areaOptions = this.areaOptions.filter(opt => res.areas.includes(opt.value));
          if (this.areaOptions.length === 1) this.ticketForm.patchValue({ area: this.areaOptions[0].value });
        }
      },
      error: (err) => {
        console.error('Erro ao carregar áreas do usuário:', err);
        // Pode ser útil para debug, mas não bloqueia a aplicação
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.isEditMode = !!this.chamadoParaEditar;
      this.initializeForm(); 
      this.filtrarAreasPermitidas();

      if (this.isEditMode) {
        this.populateFormForEdit();
        this.checkPermissionsAndPopulate();
      } 
    }
  }

  checkPermissionsAndPopulate(): void {
    this.populateFormForEdit();
    if (this.perfilUsuario === 'supervisor') {
      this.ticketForm.get('atendente')?.enable();
      this.ticketForm.get('prioridade')?.enable();
    } else {
      this.ticketForm.get('atendente')?.disable();
      this.ticketForm.get('prioridade')?.disable();
    }
  }

  initializeForm() {
    this.ticketForm = this.fb.group({
      origem: ['email', Validators.required],
      
      // --- CAMPO STATUS (Adicionado) ---
      status: ['aberto', Validators.required], 

      numeroProtocolo: [{ value: '', disabled: true }],
      cliente: ['', Validators.required],
      area: ['', Validators.required],
      assunto: ['', Validators.required],
      atendente: [{ value: '', disabled: true }], 
      prioridade: [{ value: 'Média Prioridade', disabled: true }],
      descricao: ['', Validators.maxLength(500)],
      data: [new Date().toISOString().split('T')[0]],
      hora: [new Date().toTimeString().slice(0, 5)]
    });

    this.ticketForm.get('origem')?.valueChanges.subscribe(origem => {
      this.atualizarValidacaoProtocolo(origem);
    });
  }

  atualizarValidacaoProtocolo(origem: string) {
    const protocoloControl = this.ticketForm.get('numeroProtocolo');
    if (!protocoloControl) return;

    if (origem === 'whatsapp') {
      protocoloControl.setValidators([Validators.required]);
      protocoloControl.enable();
    } else {
      protocoloControl.clearValidators();
      protocoloControl.setValue('');
    }
    protocoloControl.updateValueAndValidity();
  }

  populateFormForEdit(): void {
    if (!this.chamadoParaEditar) return;
    const safeValue = (val: any) => val || '';

    const protocolo = this.chamadoParaEditar.numeroProtocolo || '';
    const origemInferida = this.chamadoParaEditar.origem || (protocolo.startsWith('ATD-') ? 'email' : 'whatsapp');

    this.ticketForm.patchValue({
      origem: origemInferida,
      
      // --- POPULAR O STATUS ---
      status: this.chamadoParaEditar.status || 'aberto',

      numeroProtocolo: protocolo,
      cliente: safeValue(this.chamadoParaEditar.cliente),
      area: safeValue(this.chamadoParaEditar.area), 
      assunto: safeValue(this.chamadoParaEditar.categoria),
      atendente: this.chamadoParaEditar.atendente,
      prioridade: this.chamadoParaEditar.prioridade,
      descricao: this.chamadoParaEditar.descricao,
      data: this.chamadoParaEditar.dataAbertura,
      hora: this.chamadoParaEditar.horaAbertura
    });
    
    this.atualizarValidacaoProtocolo(origemInferida);
  }

  salvar() {
    if (this.ticketForm.invalid) {
        this.ticketForm.markAllAsTouched();
        return; 
    }
    this.isLoading = true;

    setTimeout(() => {
      const val = this.ticketForm.getRawValue();
      
      const dadosComuns = {
        cliente: val.cliente,
        area: val.area,
        assunto: val.assunto,
        atendente: this.perfilUsuario === 'supervisor' && val.atendente ? val.atendente : this.usuarioLogadoNome,
        prioridade: val.prioridade,
        descricao: val.descricao,
        data: val.data,
        hora: val.hora,
        origem: val.origem
      };

      if (this.isEditMode && this.chamadoParaEditar) {
        const editado: Chamado = {
          ...this.chamadoParaEditar,
          ...dadosComuns,
          categoria: val.assunto,
          numeroProtocolo: val.numeroProtocolo,
          
          // --- USA O STATUS SELECIONADO NA EDIÇÃO ---
          status: val.status 
        };
        this.chamadoAtualizado.emit(editado);
      } else {
        const novo: NovoChamado = {
          ...dadosComuns,
          numeroProtocolo: val.origem === 'whatsapp' ? val.numeroProtocolo : undefined,
          
          // --- NA CRIAÇÃO, FORÇA ABERTO ---
          status: 'aberto', 
          
          dataHoraCriacao: new Date().toISOString()
        };
        this.chamadoCriado.emit(novo);
      }
      this.isLoading = false;
    }, 200);
  }

  // ... (Outros métodos: close, handlers, etc. mantidos iguais)
  close() { this.closeModal.emit(); }
  closeModalHandler() { this.close(); }
  onOverlayClick(event: MouseEvent) { if ((event.target as HTMLElement).classList.contains('modal-overlay')) { this.close(); } }
  showPreviewHandler() { this.showPreview = true; }
  backToForm() { this.showPreview = false; }
  getPreviewData() { return this.ticketForm.getRawValue(); } 
  hasFieldError(field: string): boolean { const control = this.ticketForm.get(field); return !!(control && control.invalid && (control.dirty || control.touched)); }
  getFieldError(field: string): string { const control = this.ticketForm.get(field); if (control?.errors?.['required']) return 'Campo obrigatório'; return ''; }
  salvarChamado() { this.salvar(); }
}