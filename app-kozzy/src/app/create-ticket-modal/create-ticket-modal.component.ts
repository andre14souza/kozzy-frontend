import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Chamado, NovoChamado } from '../chamados.service';
import { AuthService } from '../auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface SelectOption { value: string; label: string; }
interface UsuarioSimples { id?: string; _id?: string; nome: string; perfil: string; }

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
  atendenteOptions: SelectOption[] = [];

  constructor(private fb: FormBuilder, private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.initializeForm();
    this.carregarAtendentes();
  }

  carregarAtendentes() {
  this.authService.getTodosUsuarios().subscribe({
    next: (usuarios: UsuarioSimples[]) => { // <--- Tipagem essencial aqui
      this.atendenteOptions = usuarios
        .filter(u => u.perfil === 'atendente') // Filtra apenas atendentes
        .map(u => ({ 
          value: (u.id || u._id) as string, 
          label: u.nome 
        }));
    },
    error: (err) => console.error('Erro ao carregar atendentes:', err)
  });
}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && this.isVisible) {
      this.isEditMode = !!this.chamadoParaEditar;
      this.initializeForm(); 
      if (this.isEditMode) this.populateFormForEdit();
    }
  }

  initializeForm() {
    this.ticketForm = this.fb.group({
      origem: ['email', Validators.required],
      status: ['aberto', Validators.required],
      numeroProtocolo: [{ value: '', disabled: true }],
      cliente: ['', Validators.required],
      area: ['', Validators.required],
      assunto: ['', Validators.required],
      atendente: [''], 
      prioridade: ['Média Prioridade'],
      descricao: ['', Validators.maxLength(500)],
      data: [new Date().toISOString().split('T')[0]],
      hora: [new Date().toTimeString().slice(0, 5)]
    });
  }

populateFormForEdit(): void {
  if (!this.chamadoParaEditar) return;
  
  const atendenteInfo = this.chamadoParaEditar.atendente;
  let idParaOSelect = '';

  // Verifica se é um objeto (vindo do populate) ou uma string (ID puro)
  if (atendenteInfo && typeof atendenteInfo === 'object') {
    idParaOSelect = (atendenteInfo as any).id || (atendenteInfo as any)._id || '';
  } else {
    idParaOSelect = (atendenteInfo as string) || '';
  }

  this.ticketForm.patchValue({
    origem: this.chamadoParaEditar.origem || 'email',
    status: this.chamadoParaEditar.status || 'aberto',
    numeroProtocolo: this.chamadoParaEditar.numeroProtocolo || '',
    cliente: this.chamadoParaEditar.cliente || '',
    area: this.chamadoParaEditar.area || this.chamadoParaEditar.categoria || '',
    atendente: idParaOSelect, // Seta o ID correto para o dropdown
    prioridade: this.chamadoParaEditar.prioridade,
    descricao: this.chamadoParaEditar.descricao
  });
}

  salvar() {
    if (this.ticketForm.invalid) return;
    const val = this.ticketForm.getRawValue();
    const dadosParaOBack = {
      ...this.chamadoParaEditar,
      cliente: val.cliente,
      categoriaAssunto: val.area,
      atendente: val.atendente,
      nivelPrioridade: val.prioridade,
      descricaoDetalhada: val.descricao,
      avanco: val.status,
      origem: val.origem,
      numeroProtocolo: val.numeroProtocolo
    };

    if (this.isEditMode) this.chamadoAtualizado.emit(dadosParaOBack as any);
    else this.chamadoCriado.emit(dadosParaOBack as any);
    this.close();
  }

  close() { this.closeModal.emit(); }
}