import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Chamado, NovoChamado } from '../chamados.service';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

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
  @Input() chamadoPaiContext?: Chamado | null;
  @Input() perfilUsuario: string = 'atendente';
  @Input() usuarioLogadoNome: string = '';

  @Output() closeModal = new EventEmitter<void>();
  @Output() chamadoCriado = new EventEmitter<NovoChamado>();
  @Output() chamadoAtualizado = new EventEmitter<Chamado>();

  ticketForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  showPreview = false;
  selectedFiles: File[] = [];  // NOVO: suporte a múltiplos arquivos

  origemOptions: SelectOption[] = [
    { value: 'email', label: '📧 E-mail' },
    { value: 'whatsapp', label: '📱 WhatsApp' }
  ];

  // ✅ CORREÇÃO: Status atualizados e 'encerrado' adicionado
  statusOptions: SelectOption[] = [
    { value: 'aberto', label: '🔴 Aberto' },
    { value: 'em andamento', label: '🟡 Em Andamento' },
    { value: 'concluido', label: '🟢 Concluído' },
    { value: 'encerrado', label: '🔒 Encerrado' }
  ];

  areaOptions: SelectOption[] = [
    { value: 'Logistica', label: '📦 Logística' },
    { value: 'Contas a Pagar', label: '💸 Contas a Pagar' },
    { value: 'Contas a Receber', label: '💵 Contas a Receber' },
    { value: 'Compras', label: '🛒 Compras' },
    { value: 'T.I', label: '💻 T.I' },
    { value: 'Comercial', label: '📞 Comercial' }
  ];

  assuntoOptions: SelectOption[] = [
    { value: 'Dúvida Geral', label: 'Dúvida Geral' },
    { value: 'Reclamação', label: 'Reclamação' },
    { value: 'Solicitação de Serviço', label: 'Solicitação de Serviço' },
    { value: 'Erro no Sistema', label: 'Erro no Sistema' }
  ];

  clienteOptions: SelectOption[] = [
    { value: 'entregador', label: '🚴 Entregador' },
    { value: 'cliente', label: '👤 Cliente Final' },
    { value: 'vendedor', label: '🏪 Loja/Vendedor' },
    { value: 'interno', label: '🏢 Interno' }
  ];

  prioridadeOptions: SelectOption[] = [
    { value: 'Baixa Prioridade', label: '🟢 Baixa' },
    { value: 'Média Prioridade', label: '🟡 Média' },
    { value: 'Alta Prioridade', label: '🟠 Alta' },
    { value: 'Urgente', label: '🔴 Urgente' }
  ];

  atendenteOptions: any[] = [];

  constructor(private fb: FormBuilder, private authService: AuthService) { }

  ngOnInit() {
    if (!this.ticketForm) {
      this.initializeForm();
    }
    this.carregarAtendentes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.isEditMode = !!this.chamadoParaEditar;
      this.showPreview = false;
      this.selectedFiles = [];
      this.carregarAtendentes();
      this.initializeForm();
      if (this.isEditMode) {
        this.populateFormForEdit();
      } else if (this.chamadoPaiContext) {
        this.populateFormForSubtask();
      }
    }
  }

  initializeForm() {
    this.ticketForm = this.fb.group({
      origem: ['email', Validators.required],
      status: ['aberto', Validators.required],
      numeroProtocolo: [{ value: '', disabled: true }],
      cliente: ['', Validators.required],
      nomeCliente: [''],
      area: ['', Validators.required],
      assunto: ['', Validators.required],
      atendente: [''],
      prioridade: ['Média Prioridade'],
      descricao: ['', Validators.maxLength(500)],
      solucao: [''], // ✅ CORREÇÃO: Campo solução adicionado ao FormGroup
      data: [new Date().toISOString().split('T')[0]],
      hora: [new Date().toTimeString().slice(0, 5)]
    });

    this.ticketForm.get('origem')?.valueChanges.subscribe(val => {
      const prot = this.ticketForm.get('numeroProtocolo');
      if (val === 'whatsapp') { prot?.enable(); prot?.setValidators([Validators.required]); }
      else { prot?.disable(); prot?.clearValidators(); }
      prot?.updateValueAndValidity();
    });

    // ✅ VALIDAÇÃO DINÂMICA: Exige solução se estiver concluído/encerrado
    this.ticketForm.get('status')?.valueChanges.subscribe(status => {
      const solControl = this.ticketForm.get('solucao');
      if (status === 'concluido' || status === 'encerrado') {
        solControl?.setValidators([Validators.required, Validators.minLength(5)]);
      } else {
        solControl?.clearValidators();
      }
      solControl?.updateValueAndValidity();
    });
  }

  carregarAtendentes() {
    this.authService.getAtendentes().subscribe({
      next: (atendentes: any[]) => {
        this.atendenteOptions = atendentes.map(u => ({ value: u._id, label: u.nomeCompleto }));
      },
      error: (err) => console.error('Erro ao carregar atendentes', err)
    });
  }

  populateFormForEdit() {
    if (!this.chamadoParaEditar) return;
    const idAtendente = this.chamadoParaEditar.atendenteId;

    this.ticketForm.patchValue({
      origem: this.chamadoParaEditar.origem,
      status: this.chamadoParaEditar.status,
      numeroProtocolo: this.chamadoParaEditar.numeroProtocolo,
      cliente: this.chamadoParaEditar.cliente,
      nomeCliente: this.chamadoParaEditar.nomeCliente || '',
      area: this.chamadoParaEditar.area,
      assunto: this.chamadoParaEditar.categoria,
      atendente: idAtendente || '',
      prioridade: this.chamadoParaEditar.prioridade,
      descricao: this.chamadoParaEditar.descricao,
      solucao: this.chamadoParaEditar.solucao || '' // ✅ Preenche a solução anterior
    });
  }

  populateFormForSubtask() {
    if (!this.chamadoPaiContext) return;
    this.ticketForm.patchValue({
      cliente: this.chamadoPaiContext.cliente,
      nomeCliente: this.chamadoPaiContext.nomeCliente || '',
      area: this.chamadoPaiContext.area
    });
  }

  onOverlayClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) this.closeModalHandler();
  }

  closeModalHandler() { this.closeModal.emit(); }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles = Array.from(input.files);
    }
  }

  removeFile(index: number = -1) {
    if (index >= 0) {
      this.selectedFiles.splice(index, 1);
    } else {
      this.selectedFiles = [];
    }
  }

  salvarChamado() {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const val = this.ticketForm.getRawValue();
    const user = this.authService.getUsuarioLogado();

    let atendenteFinal;
    if (this.isEditMode) {
      if (!val.atendente || val.atendente === '' || val.atendente === 'Não Atribuído') {
        atendenteFinal = null;
      } else {
        const opt = this.atendenteOptions.find(o => o.value === val.atendente);
        atendenteFinal = opt ? { _id: opt.value, nomeCompleto: opt.label } : { _id: val.atendente };
      }
    } else {
      atendenteFinal = { _id: user?.id, nomeCompleto: user?.nome };
    }

    const dados = {
      ...val,
      atendente: atendenteFinal,
      atendenteId: val.atendente || null,
      categoria: val.assunto,
      ...(this.selectedFiles.length > 0 && !this.isEditMode ? { arquivos: this.selectedFiles } : {})
    };

    if (this.isEditMode) {
      this.chamadoAtualizado.emit({ ...this.chamadoParaEditar, ...dados } as any);
    } else {
      this.chamadoCriado.emit(dados as any);
    }
    this.isLoading = false;
    this.closeModalHandler();
  }

  getPreviewData() { return this.ticketForm.getRawValue(); }

  hasFieldError(field: string): boolean {
    const control = this.ticketForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getFieldError(field: string): string {
    const control = this.ticketForm.get(field);
    if (control?.hasError('required')) return 'Campo obrigatório';
    if (control?.hasError('minlength')) return 'Muito curto (mín. 5 caracteres)';
    return '';
  }
}